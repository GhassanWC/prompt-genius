// src/lib/server/projects-server.ts
import 'server-only';
import { randomUUID } from 'crypto';

import { getAdminApp, getDb } from '@/lib/firebase-admin';
import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore';

import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
import { generateImage } from '@/ai/flows/generate-image';
import type { Project, Prompt, Role, Collaborator, ProjectClone } from '@/lib/projects';
import { getSubscriptionByUserId } from '@/lib/subscription-server';

export type SubscriptionPlan = 'free' | 'plus' | 'pro';

export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 1,
  plus: 10,
  pro: 30,
};

// ---- shims so the rest of the file stays the same
export const AdminFieldValue = FieldValue;

// Lazy helpers (no top-level Admin init)
const col = (name: string) => getDb().collection(name);
const usersCol = () => col('users');

// ---------- USER PROJECT COUNTS (Denormalized counters for performance)

/** Get user's project counts - with fallback for unmigrated users */
export const getUserProjectCounts = async (userId: string): Promise<{
  projectCount: number;
  clonedProjectCount: number;
}> => {
  const userDoc = await usersCol().doc(userId).get();
  const data = userDoc.data() as any;

  // If counts exist, return them (fast path)
  if (typeof data?.projectCount === 'number' && typeof data?.clonedProjectCount === 'number') {
    return {
      projectCount: data.projectCount,
      clonedProjectCount: data.clonedProjectCount,
    };
  }

  // Fallback: count manually and update the user doc (one-time per unmigrated user)
  const [projectsSnap, clonesSnap] = await Promise.all([
    col('projects').where(`members.${userId}`, '==', true).get(),
    col('projectClones').where('ownerId', '==', userId).get(),
  ]);

  const projectCount = projectsSnap.size;
  const clonedProjectCount = clonesSnap.size;

  // Update user doc with counts for future reads
  try {
    await usersCol().doc(userId).update({
      projectCount,
      clonedProjectCount,
    });
  } catch (err) {
    // User doc might not exist yet, try set with merge
    await usersCol().doc(userId).set({
      projectCount,
      clonedProjectCount,
    }, { merge: true });
  }

  return { projectCount, clonedProjectCount };
};

/**
 * Normalizes the stored `aiRole` field into a plain string.
 *
 * Earlier versions of the app (or external tools) may have stored the AI role
 * as a structured object (for example, a Dotprompt template object). When those
 * documents are read back into the UI, React would coerce the object to the
 * string "[object Object]", and any downstream AI enhancement call would receive
 * that instead of the real role text – leading to confusing errors such as:
 *
 *   "The provided role text is missing. Please provide the role text within the
 *    `<<<dotprompt:role:[object Object]>>>` tag..."
 *
 * To avoid this, we aggressively coerce the value to a human‑readable string,
 * pulling from common text fields when it was stored as an object.
 */
function normalizeAiRole(raw: any): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') return raw;

  if (typeof raw === 'object') {
    // Try a few likely property names first.
    const candidate =
      (raw as any).role ??
      (raw as any).text ??
      (raw as any).content ??
      (raw as any).body ??
      (raw as any).description;

    if (typeof candidate === 'string') return candidate;

    // As a last resort, fall back to a pretty-printed JSON string so the UI
    // never shows just "[object Object]" and the enhancement flow still sees
    // something meaningful.
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return undefined;
    }
  }

  // Numbers/booleans, etc. – coerce to string if present.
  try {
    return String(raw);
  } catch {
    return undefined;
  }
}

const chunkArray = <T,>(arr: T[], size: number): T[][] =>
  arr.reduce<T[][]>((chunks, item, index) => {
    if (index % size === 0) chunks.push([]);
    chunks[chunks.length - 1].push(item);
    return chunks;
  }, []);

const CLONE_COUNT_CHUNK_SIZE = 10;

export const getCloneCountsForProjectIds = async (
  projectIds: string[]
): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  const uniqueIds = Array.from(new Set(projectIds));
  if (uniqueIds.length === 0) return counts;

  const chunks = chunkArray(uniqueIds, CLONE_COUNT_CHUNK_SIZE);
  for (const chunk of chunks) {
    const snap = await col('projectClones')
      .where('sourceProjectId', 'in', chunk)
      .get();
    snap.docs.forEach((doc: any) => {
      const sourceId = doc.get('sourceProjectId');
      if (!sourceId) return;
      counts[sourceId] = (counts[sourceId] ?? 0) + 1;
    });
  }

  return counts;
};

function tsToDate(ts: any): Date {
  if (ts?.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

function getBucket() {
  const { getStorage } = require('firebase-admin/storage');
  return getStorage(getAdminApp()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
}

function parseDataUri(dataUri: string): { buffer: Buffer; contentType: string } {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!m) throw new Error('Invalid data URI');
  const [, contentType, b64] = m;
  return { buffer: Buffer.from(b64, 'base64'), contentType };
}

// ---------- READS

export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  try {
    const snap = await col('projects').where(`members.${userId}`, '==', true).get();

    const projects: Project[] = snap.docs.map((d: any) => {
      const data: any = d.data();
      return {
        id: d.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        aiRole: normalizeAiRole(data.aiRole),
        summary: data.summary || undefined,
        imageUrl: data.imageUrl || null,
        isPublic: !!data.isPublic,
        createdAt: tsToDate(data.createdAt),
        roles: data.roles || {},
        members: data.members || {},
        clarificationSteps: data.clarificationSteps || [],
      };
    });

    if (projects.length > 0) {
      const cloneCounts = await getCloneCountsForProjectIds(projects.map((project) => project.id));
      projects.forEach((project) => {
        project.cloneCount = cloneCounts[project.id] ?? 0;
      });
    }

    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return projects;
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    const code = err?.code;
    if (code === 'permission-denied') {
      throw new Error(
        "We couldn't load your projects. Please check your internet connection and try again."
      );
    } else if (code === 'failed-precondition') {
      throw new Error(
        'Something went wrong on our end while trying to fetch your projects. Please contact support if this continues.'
      );
    } else {
      throw new Error(
        'An unexpected error occurred while fetching your projects. Please refresh the page.'
      );
    }
  }
};

export const getProject = async (userId: string | null, projectId: string): Promise<Project | null> => {
  const ref = col('projects').doc(projectId);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const data: any = doc.data();
  const project: Project = {
    id: doc.id,
    name: data.name || 'Untitled Project',
    idea: data.idea || '',
    aiRole: normalizeAiRole(data.aiRole),
    isPublic: !!data.isPublic,
    imageUrl: data.imageUrl || null,
    createdAt: tsToDate(data.createdAt),
    roles: data.roles || {},
    members: data.members || {},
    clarificationSteps: data.clarificationSteps || [],
  };

  if (project.isPublic) return project;
  if (userId && project.members?.[userId]) return project;
  return null;
};

export const getClonedProjectsForUser = async (
  userId: string
): Promise<ProjectClone[]> => {
  const snap = await col('projectClones')
    .where('ownerId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc:any) => {
    const data:any = doc.data();
    return {
      id: doc.id,
      cloneProjectId: data.cloneProjectId,
      sourceProjectId: data.sourceProjectId,
      sourceProjectName: data.sourceProjectName || 'Community Project',
      sourceIdea: data.sourceIdea || '',
      sourceImageUrl: data.sourceImageUrl ?? null,
      sourceAuthorDisplayName: data.sourceAuthorDisplayName ?? null,
      sourceAuthorPhotoURL: data.sourceAuthorPhotoURL ?? null,
      createdAt: tsToDate(data.createdAt),
    };
  });
};

export const removeCloneForUser = async (
  userId: string,
  cloneProjectId: string
): Promise<void> => {
  const db = getDb();

  // Remove clone metadata entry for this user + cloned project
  const clonesSnap = await col('projectClones')
    .where('ownerId', '==', userId)
    .where('cloneProjectId', '==', cloneProjectId)
    .limit(1)
    .get();

  const batch = db.batch();
  if (!clonesSnap.empty) {
    batch.delete(clonesSnap.docs[0].ref);
    // Decrement user's cloned project count
    batch.update(usersCol().doc(userId), {
      clonedProjectCount: AdminFieldValue.increment(-1),
    });
  }

  // Best-effort delete of the cloned project itself. If the user is not
  // the owner or the project no longer exists, we still consider the
  // clone "removed" from their list once metadata is gone.
  try {
    await deleteProject(userId, cloneProjectId);
  } catch (err) {
    console.error('Failed to delete cloned project, metadata removed only:', err);
  }

  if (!clonesSnap.empty) {
    await batch.commit();
  }
};

export const cloneProjectForUser = async (
  userId: string,
  sourceProjectId: string
): Promise<string> => {
  const db = getDb();

  const sourceRef = col('projects').doc(sourceProjectId);
  const sourceDoc = await sourceRef.get();

  if (!sourceDoc.exists) {
    throw new Error('Source project not found.');
  }

  const sourceData: any = sourceDoc.data();

  // Only allow cloning if the project is public or the user is already a member
  const isMember = !!sourceData.members?.[userId];
  const isPublic = !!sourceData.isPublic;
  if (!isPublic && !isMember) {
    throw new Error("You don't have permission to clone this project.");
  }

  // Enforce subscription limits using denormalized counters (fast!)
  const [subscription, userCounts] = await Promise.all([
    getSubscriptionByUserId(userId),
    getUserProjectCounts(userId),
  ]);

  const totalProjects = userCounts.projectCount + userCounts.clonedProjectCount;

  if (totalProjects >= (subscription?.cumulative_quantity ?? PLAN_LIMITS.free)) {
    throw new Error(
      'You have reached the maximum number of projects for your plan. Please upgrade to create more projects.'
    );
  }

  const cloneRef = col('projects').doc();
  const batch = db.batch();

  const cloneData = {
    name: sourceData.name || 'Untitled Project',
    idea: sourceData.idea || '',
    // Use null for optional fields so Firestore accepts the document
    aiRole: normalizeAiRole(sourceData.aiRole) ?? null,
    summary: sourceData.summary ?? null,
    isPublic: false,
    clarificationSteps: sourceData.clarificationSteps || [],
    imageUrl: sourceData.imageUrl ?? null,
    createdAt: AdminFieldValue.serverTimestamp(),
    roles: { [userId]: 'owner' as Role },
    members: { [userId]: true },
  };

  batch.set(cloneRef, cloneData);

  // Copy prompts from source project to cloned project
  const promptsSnap = await sourceRef.collection('prompts').get();
  promptsSnap.forEach((promptDoc: any, index: number) => {
    const data: any = promptDoc.data();
    const newPromptRef = cloneRef.collection('prompts').doc();
    batch.set(newPromptRef, {
      title: data.title,
      userPrompt: data.userPrompt,
      mapFlow: data.mapFlow,
      order: typeof data.order === 'number' ? data.order : index,
      isDone: false,
      acceptanceCriteria: data.acceptanceCriteria ?? [],
    });
  });

  // Record clone metadata for analytics/history
  const ownerId =
    Object.keys(sourceData.roles || {}).find(
      (uid) => (sourceData.roles as Record<string, Role>)[uid] === 'owner'
    ) ?? null;

  let ownerProfile: any = null;
  if (ownerId) {
    const ownerSnap = await col('users').doc(ownerId).get();
    ownerProfile = ownerSnap.exists ? ownerSnap.data() : null;
  }

  const cloneMetaRef = col('projectClones').doc();
  batch.set(cloneMetaRef, {
    ownerId: userId,
    cloneProjectId: cloneRef.id,
    sourceProjectId,
    sourceProjectName: sourceData.name || 'Community Project',
    sourceIdea: sourceData.idea || '',
    sourceImageUrl: sourceData.imageUrl ?? null,
    sourceAuthorDisplayName:
      ownerProfile?.displayName || ownerProfile?.email || null,
    sourceAuthorPhotoURL: ownerProfile?.photoURL ?? null,
    createdAt: AdminFieldValue.serverTimestamp(),
  });

  // Increment user's cloned project count
  batch.update(usersCol().doc(userId), {
    clonedProjectCount: AdminFieldValue.increment(1),
  });

  await batch.commit();

  return cloneRef.id;
};

export const getPromptsForProject = async (userId: string | null, projectId: string): Promise<Prompt[]> => {
  const project = await getProject(userId, projectId);
  if (!project) {
    throw new Error("You don't have permission to view this project, or the project does not exist.");
  }

  const snap = await col('projects').doc(projectId).collection('prompts').get();
  const prompts: Prompt[] = snap.docs.map((d:any) => ({
    id: d.id,
    ...(d.data() as Omit<Prompt, 'id'>),
  }));
  prompts.sort((a, b) => (a.order || 0) - (b.order || 0));
  return prompts;
};

export const getProjectRole = async (userId: string, projectId: string): Promise<Role | null> => {
  const d = await col('projects').doc(projectId).get();
  if (!d.exists) return null;
  const data: any = d.data();
  return (data?.roles?.[userId] as Role) || null;
};

// ---------- WRITES

export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  plan: DecomposeIdeaOutput
): Promise<string> => {
  const db = getDb();
  const projectRef = col('projects').doc();
  const batch = db.batch();

  batch.set(projectRef, {
    name: projectName,
    idea: plan.enhancedIdea,
    // Use null for optional fields so Firestore accepts the document
    aiRole: normalizeAiRole(plan.aiRole) ?? null,
    summary: null,
    isPublic: false,
    clarificationSteps: plan.clarificationSteps || [],
    imageUrl: null,
    createdAt: AdminFieldValue.serverTimestamp(),
    roles: { [userId]: 'owner' as Role },
    members: { [userId]: true },
  });

  if (Array.isArray(plan.developmentPlan) && plan.developmentPlan.length > 0) {
    const promptsCol = projectRef.collection('prompts');
    plan.developmentPlan.forEach((step, index) => {
      const promptRef = promptsCol.doc();
      batch.set(promptRef, { ...step, order: index, isDone: false });
    });
  }

  // Increment user's project count in the same batch
  batch.update(usersCol().doc(userId), {
    projectCount: AdminFieldValue.increment(1),
  });

  await batch.commit();
  return projectRef.id;
};

export const generateAndSaveProjectImage = async (
  userId: string,
  projectId: string,
  idea: string
): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (!role) throw new Error("You don't have permission to generate an image for this project.");

  try {
    const { imageUrl: dataUri } = await generateImage({ idea });
    const { buffer, contentType } = parseDataUri(dataUri);

    const path = `project-images/${projectId}.png`;
    const file = getBucket().file(path);

    const token = randomUUID();
    await file.save(buffer, {
      contentType,
      metadata: {
        metadata: { firebaseStorageDownloadTokens: token },
        cacheControl: 'public,max-age=31536000,immutable',
      },
      public: false,
      resumable: false,
    });

    const encodedPath = encodeURIComponent(path);
    const bucket = process.env.NEXT_FIREBASE_STORAGE_BUCKET!;
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${token}`;

    await col('projects').doc(projectId).update({ imageUrl: publicUrl });
  } catch (err) {
    console.error('Background image generation and save failed:', err);
  }
};

export const updateProject = async (
  userId: string,
  projectId: string,
  data: Partial<Omit<Project, 'id' | 'roles' | 'createdAt'>>
): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to edit this project.");

  await col('projects').doc(projectId).update(data);
};

export const updatePrompt = async (
  userId: string,
  projectId: string,
  promptId: string,
  data: Partial<Omit<Prompt, 'id'>>
): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor')
    throw new Error("You don't have permission to edit prompts in this project.");

  await col('projects').doc(projectId).collection('prompts').doc(promptId).update(data);
};

export const updatePromptStatus = async (
  userId: string,
  projectId: string,
  promptId: string,
  isDone: boolean
): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor')
    throw new Error("You don't have permission to update prompts in this project.");

  await col('projects').doc(projectId).collection('prompts').doc(promptId).update({ isDone });
};

export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor')
    throw new Error("You don't have permission to delete prompts in this project.");

  await col('projects').doc(projectId).collection('prompts').doc(promptId).delete();
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner')
    throw new Error('You don\'t have permission to delete this project. Only the owner can do this.');

  const db = getDb();
  const projectRef = col('projects').doc(projectId);
  const batch = db.batch();

  batch.delete(projectRef);

  const promptsSnap = await projectRef.collection('prompts').get();
  promptsSnap.forEach((p:any) => batch.delete(p.ref));

  // Decrement user's project count
  batch.update(usersCol().doc(userId), {
    projectCount: AdminFieldValue.increment(-1),
  });

  await batch.commit();
};

export const addPrompt = async (
  userId: string,
  projectId: string,
  promptData: Omit<Prompt, 'id' | 'order'>
): Promise<string> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor')
    throw new Error("You don't have permission to add prompts to this project.");

  const promptsCol = col('projects').doc(projectId).collection('prompts');
  const countSnap = await promptsCol.get();
  const newOrder = countSnap.size;

  const newRef = promptsCol.doc();
  await newRef.set({ ...promptData, order: newOrder, isDone: false });
  return newRef.id;
};

export const updatePromptsOrder = async (
  userId: string,
  projectId: string,
  prompts: { id: string; order: number }[]
): Promise<void> => {
  const role = await getProjectRole(userId, projectId);
  if (role !== 'owner' && role !== 'editor')
    throw new Error("You don't have permission to reorder prompts in this project.");

  const db = getDb();
  const batch = db.batch();
  prompts.forEach(({ id, order }) => {
    const ref = col('projects').doc(projectId).collection('prompts').doc(id);
    batch.update(ref, { order });
  });
  await batch.commit();
};

// ---------- COLLABORATION

export const findUserByEmail = async (email: string): Promise<{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
} | null> => {
  const snap = await col('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data: any = d.data();
  return {
    uid: d.id,
    email: data.email,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
  };
};

export const getUsers = async (userIds: string[]): Promise<Omit<Collaborator, 'role'>[]> => {
  if (userIds.length === 0) return [];
  const chunk = <T>(arr: T[], size: number) =>
    arr.reduce<T[][]>((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);
  const chunks = chunk(userIds, 10);

  const results: Omit<Collaborator, 'role'>[] = [];
  for (const ids of chunks) {
    const snap = await col('users').where(FieldPath.documentId(), 'in', ids).get();
    results.push(
      ...snap.docs.map((d:any) => {
        const data: any = d.data();
        return {
          uid: d.id,
          email: data.email,
          displayName: data.displayName ?? null,
          photoURL: data.photoURL ?? null,
        };
      })
    );
  }
  return results;
};

export const updateProjectSettings = async (
  currentUserId: string,
  projectId: string,
  settings: { roles: Record<string, Role>; isPublic: boolean }
): Promise<void> => {
  const role = await getProjectRole(currentUserId, projectId);
  if (role !== 'owner')
    throw new Error("You don't have permission to change settings. Only the project owner can do this.");

  const { roles, isPublic } = settings;
  if (!roles[currentUserId] || roles[currentUserId] !== 'owner') {
    throw new Error('A project must always have an owner.');
  }

  const members = Object.keys(roles).reduce<Record<string, boolean>>((acc, uid) => {
    acc[uid] = true;
    return acc;
  }, {});

  await col('projects').doc(projectId).update({ roles, isPublic, members });
};

export const getPublicProjects = async (count: number): Promise<Project[]> => {
  try {
    const q = col('projects').where('isPublic', '==', true).orderBy('createdAt', 'desc').limit(count);

    const projectsSnap = await q.get();
    const projects: (Project & {
      author?: { displayName: string; photoURL: string | null };
    })[] = projectsSnap.docs.map((d:any) => {
      const data: any = d.data();
      return {
        id: d.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        imageUrl: data.imageUrl || null,
        isPublic: !!data.isPublic,
        createdAt: tsToDate(data.createdAt),
        roles: data.roles || {},
        members: data.members || {},
      };
    });

    if (projects.length === 0) return [];

    const ownerUids = projects
      .map((p) => Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner'))
      .filter(Boolean) as string[];

    if (ownerUids.length > 0) {
      const unique = Array.from(new Set(ownerUids));
      const chunk = <T>(arr: T[], size: number) =>
        arr.reduce<T[][]>((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);
      const chunks = chunk(unique, 10);

      const ownerMap = new Map<string, any>();
      for (const ids of chunks) {
        const snap = await col('users').where(FieldPath.documentId(), 'in', ids).get();
        snap.docs.forEach((d:any) => ownerMap.set(d.id, d.data()));
      }

      projects.forEach((p) => {
        const ownerUid = Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner');
        if (ownerUid && ownerMap.has(ownerUid)) {
          const od = ownerMap.get(ownerUid);
          (p as any).author = {
            displayName: od?.displayName || od?.email || 'Anonymous',
            photoURL: od?.photoURL || null,
          };
        }
      });
    }

    return projects;
  } catch (err: any) {
    if (err?.code === 'failed-precondition') {
      throw new Error(
        "We're having trouble fetching community projects right now due to a configuration issue. Please contact support if this continues."
      );
    }
    console.error('Error fetching public projects:', err);
    throw new Error('An unexpected error occurred while fetching community projects.');
  }
};

export const getUserSubscriptionPlan = async (userId: string): Promise<SubscriptionPlan> => {
  const subscription = await getSubscriptionByUserId(userId);

  if (!subscription || subscription.status !== 'active') return 'free';
  return (subscription.tier_id as SubscriptionPlan) || 'free';
};

export const getUserSubscriptionPlanUrl = async (userId: string): Promise<string> => {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription || subscription.status !== 'active') return '';
  return subscription.urls.customer_portal || '';
};


export type PublicProject = {
  id: string;
  name: string;
  idea: string;
  imageUrl?: string;
  author?: { displayName: string; photoURL?: string };
  createdAt?: string | null; // ISO
  [k: string]: any;
};

type Page = { projects: Project[]; nextCursor: string | null };

function tsFromCursor(raw?: string | null): Timestamp | null {
  if (!raw) return null;
  const n = Number(raw);
  const ms = Number.isNaN(n) ? Date.parse(raw) : n;
  if (Number.isNaN(ms)) return null;
  return Timestamp.fromMillis(ms);
}

export async function getPublicProjectsPage(count = 12, cursor?: string | null): Promise<Page> {
  const db = getDb();

  let q: FirebaseFirestore.Query = db
    .collection('projects')
    .where('isPublic', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(Math.max(1, Math.min(50, count)));

  const ts = tsFromCursor(cursor);
  if (ts) q = q.startAfter(ts);
  const projectsSnap = await q.get();
  const projects: (Project & {
    author?: { displayName: string; photoURL: string | null };
  })[] = projectsSnap.docs.map((d: any) => {
    const data: any = d.data();
    return {
      id: d.id,
      name: data.name || 'Untitled Project',
      idea: data.idea || '',
      imageUrl: data.imageUrl || null,
      isPublic: !!data.isPublic,
      createdAt: tsToDate(data.createdAt),
      roles: data.roles || {},
      members: data.members || {},
    };
  });

  if (projects.length === 0) return { projects, nextCursor: null };

  const ownerUids = projects
    .map((p) => Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner'))
    .filter(Boolean) as string[];

  if (ownerUids.length > 0) {
    const unique = Array.from(new Set(ownerUids));
    const chunk = <T>(arr: T[], size: number) =>
      arr.reduce<T[][]>((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);
    const chunks = chunk(unique, 10);

    const ownerMap = new Map<string, any>();
    for (const ids of chunks) {
      const snap = await col('users').where(FieldPath.documentId(), 'in', ids).get();
      snap.docs.forEach((d: any) => ownerMap.set(d.id, d.data()));
    }

    projects.forEach((p) => {
      const ownerUid = Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner');
      if (ownerUid && ownerMap.has(ownerUid)) {
        const od = ownerMap.get(ownerUid);
        (p as any).author = {
          displayName: od?.displayName || od?.email || 'Anonymous',
          photoURL: od?.photoURL || null,
        };
      }
    });
  }

  if (projects.length > 0) {
    const cloneCounts = await getCloneCountsForProjectIds(projects.map((project) => project.id));
    projects.forEach((project) => {
      project.cloneCount = cloneCounts[project.id] ?? 0;
    });
  }

  const last = projectsSnap.docs[projectsSnap.docs.length - 1];
  const lastCreated: Timestamp | undefined = last?.get('createdAt');
  const nextCursor = lastCreated ? String(lastCreated.toMillis()) : null;

  return { projects, nextCursor };
}
