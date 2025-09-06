// This file contains functions that are safe to run on the client side.
// They handle reading and writing project data and do not involve sensitive operations or AI flows.

import { db, storage } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  type Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  limit,
  orderBy,
} from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { generateImage } from '@/ai/flows/generate-image';
import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
import type { Project, Prompt, Role, Collaborator } from './projects';
import { getSubscription } from './subscriptions';

export type SubscriptionPlan = 'free' | 'plus' | 'pro';

// This is no longer the source of truth, but can be a fallback.
export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 1,
  plus: 10,
  pro: 30,
};


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  try {
    const projectsCollectionRef = collection(db, 'projects');
    // Query for projects where the user is a member (using the members object)
    const q = query(projectsCollectionRef, where(`members.${userId}`, "==", true));
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('querySnapshot', data);
      const createdAtTimestamp = data.createdAt as Timestamp;
      projects.push({ 
        id: doc.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        imageUrl: data.imageUrl,
        isPublic: data.isPublic || false,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
        roles: data.roles || {},
        members: data.members || {},
        clarificationSteps: data.clarificationSteps,
      });
    });

    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return projects;
  } catch (err: any) {
     console.error("Error fetching projects:", err);
     if (err.code === 'permission-denied') {
        throw new Error("We couldn't load your projects. Please check your internet connection and try again.");
     } else if (err.code === 'failed-precondition') {
        throw new Error("Something went wrong on our end while trying to fetch your projects. Please contact support if this continues.");
     } else {
       throw new Error("An unexpected error occurred while fetching your projects. Please refresh the page.");
     }
  }
};

// Function to get a single project's details
export const getProject = async (userId: string | null, projectId: string): Promise<Project | null> => {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const projectData = {
            id: docSnap.id,
            name: data.name || 'Untitled Project',
            idea: data.idea || '',
            isPublic: data.isPublic,
            imageUrl: data.imageUrl,
            createdAt: (data.createdAt as Timestamp) ? (data.createdAt as Timestamp).toDate() : new Date(),
            roles: data.roles,
                         members: data.members || {},
            clarificationSteps: data.clarificationSteps,
        };

        // Public projects are readable by anyone
        if (projectData.isPublic) {
            return projectData;
        }

        // Private projects are only readable by collaborators
        if (userId && projectData.members && projectData.members[userId] === true) {
            return projectData;
        }
    }
    // If we are here, the project is private and user is not a collaborator, or it doesn't exist.
    return null;
}


// Function to get all prompts for a project, also verifies access
export const getPromptsForProject = async (userId: string | null, projectId: string): Promise<Prompt[]> => {
    // getProject handles the public/private access logic
    const project = await getProject(userId, projectId);
    if (!project) {
        throw new Error("You don't have permission to view this project, or the project does not exist.");
    }
    
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    const querySnapshot = await getDocs(promptsCollectionRef);
    const prompts: Prompt[] = [];
    querySnapshot.forEach((doc) => {
      prompts.push({ id: doc.id, ...doc.data() } as Prompt)
    });

    prompts.sort((a, b) => (a.order || 0) - (b.order || 0));
    return prompts;
}


// Helper function to verify project access and role, used by write operations below
export const getProjectRole = async (userId: string, projectId: string): Promise<Role | null> => {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) return null;
    const projectData = projectDoc.data();
    // This is a direct role check, doesn't account for public read access.
    // Intended for write permission checks.
    return projectData?.roles?.[userId] || null;
}


// Function to create a new project and add its prompts
export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  plan: DecomposeIdeaOutput
): Promise<string> => {
  // Create a new document reference first
  const projectDocRef = doc(collection(db, 'projects'));
  const projectId = projectDocRef.id;
  console.log("projectId: ", projectId)
  // Create a batch to write both project and prompts atomically
  const batch = writeBatch(db);
  console.log("projectId2: ", projectId)

  // Add the project document to the batch
  batch.set(projectDocRef, {
    name: projectName,
    idea: plan.enhancedIdea,
    isPublic: false, // Projects are private by default
    clarificationSteps: plan.clarificationSteps || [],
    imageUrl: null,
    createdAt: serverTimestamp(),
    roles: {
      [userId]: 'owner' // Set the creator as the owner
    },
    members: {
      [userId]: true // Add the owner to the members object
    },
  });
  console.log("projectId3: ", projectId)

  // Add prompts to the batch if they exist
  if (plan.developmentPlan && plan.developmentPlan.length > 0) {
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    plan.developmentPlan.forEach((step, index) => {
      const promptDocRef = doc(promptsCollectionRef); 
      batch.set(promptDocRef, {
        ...step,
        order: index,
        isDone: false,
      });
    });
  }
  console.log("projectId4: ", projectId)

  // Commit the entire batch atomically
  await batch.commit();

  return projectId;
};


// Function to generate and save the project image asynchronously.
export const generateAndSaveProjectImage = async (
  userId: string,
  projectId: string,
  idea: string
): Promise<void> => {
    try {
        const role = await getProjectRole(userId, projectId);
        if (!role) throw new Error("You don't have permission to generate an image for this project.");
        
        const imageResult = await generateImage({ idea });
        const dataUri = imageResult.imageUrl;
        
        const imagePath = `project-images/${projectId}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadString(imageRef, dataUri, 'data_url');
        const imageUrl = await getDownloadURL(imageRef);

        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { imageUrl });

    } catch (err) {
        console.error("Background image generation and save failed:", err);
    }
}

// Function to update a project's details
export const updateProject = async (userId: string, projectId: string, data: Partial<Omit<Project, 'id' | 'roles' | 'createdAt'>>): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to edit this project.");
    
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, data);
};

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, data: Partial<Omit<Prompt, 'id'>>): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to edit prompts in this project.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, data);
}

// Function to update a prompt's status
export const updatePromptStatus = async (userId: string, projectId: string, promptId: string, isDone: boolean): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to update prompts in this project.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, { isDone });
};

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to delete prompts in this project.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to delete a project and all its associated prompts
export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner') throw new Error("You don't have permission to delete this project. Only the owner can do this.");

    const batch = writeBatch(db);
    const projectRef = doc(db, 'projects', projectId);
    batch.delete(projectRef);

    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    const promptsSnapshot = await getDocs(promptsCollectionRef);
    promptsSnapshot.forEach((promptDoc) => {
        batch.delete(promptDoc.ref);
    });

    await batch.commit();
};

// Function to add a new prompt to a project
export const addPrompt = async (userId: string, projectId: string, promptData: Omit<Prompt, 'id' | 'order'>): Promise<string> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to add prompts to this project.");
    
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    const allPromptsSnapshot = await getDocs(promptsCollectionRef);
    const newOrder = allPromptsSnapshot.docs.length;

    const newPromptRef = await addDoc(promptsCollectionRef, {
        ...promptData,
        order: newOrder,
        isDone: false,
    });
    return newPromptRef.id;
}

// Function to update the order of prompts
export const updatePromptsOrder = async (userId: string, projectId: string, prompts: { id: string; order: number }[]): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("You don't have permission to reorder prompts in this project.");

    const batch = writeBatch(db);
    prompts.forEach(prompt => {
        const promptRef = doc(db, 'projects', projectId, 'prompts', prompt.id);
        batch.update(promptRef, { order: prompt.order });
    });
    await batch.commit();
};

// --- Collaboration Functions ---

export const findUserByEmail = async (email: string): Promise<{ uid: string; email: string; displayName: string | null; photoURL: string | null; } | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return {
        uid: userDoc.id,
        ...userDoc.data()
    } as { uid: string; email: string; displayName: string | null; photoURL: string | null; };
}

export const getUsers = async (userIds: string[]): Promise<Omit<Collaborator, 'role'>[]> => {
    if (userIds.length === 0) return [];
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', 'in', userIds));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        photoURL: doc.data().photoURL
    }));
}

export const updateProjectSettings = async (currentUserId: string, projectId: string, settings: { roles: Record<string, Role>, isPublic: boolean }): Promise<void> => {
    const role = await getProjectRole(currentUserId, projectId);
    if (role !== 'owner') {
        throw new Error("You don't have permission to change settings. Only the project owner can do this.");
    }

    const { roles, isPublic } = settings;
    if (!roles[currentUserId] || roles[currentUserId] !== 'owner') {
        throw new Error("A project must always have an owner.");
    }
    
    // Create the members object from the keys of the roles map
    const members = Object.keys(roles).reduce((acc, uid) => {
      acc[uid] = true;
      return acc;
    }, {} as Record<string, boolean>);

    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { roles, isPublic, members });
}

// Function to get the latest public projects for the community page
export const getPublicProjects = async (count: number): Promise<Project[]> => {
  const projectsCollectionRef = collection(db, 'projects');
  
  try {
    const q = query(
      projectsCollectionRef, 
      where("isPublic", "==", true),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const projectsSnapshot = await getDocs(q);

    let projects: Project[] = [];
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({ 
        id: doc.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        imageUrl: data.imageUrl,
        isPublic: data.isPublic,
        createdAt: (data.createdAt as Timestamp).toDate(),
        roles: data.roles || {},
        members: data.members || {},
      });
    });
    
    if (projects.length === 0) {
        return [];
    }
    
    const ownerUids = projects.map(p => {
        return Object.keys(p.roles).find(uid => p.roles[uid] === 'owner')!;
    }).filter(uid => uid);

    if (ownerUids.length === 0) {
      return projects;
    }

    const ownersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', 'in', ownerUids)));
    const ownersMap = new Map(ownersSnapshot.docs.map(doc => [doc.id, doc.data()]));
    
    const projectsWithAuthors = projects.map(p => {
        const ownerUid = Object.keys(p.roles).find(uid => p.roles[uid] === 'owner');
        if (ownerUid && ownersMap.has(ownerUid)) {
            const ownerData = ownersMap.get(ownerUid);
            return {
                ...p,
                author: {
                    displayName: ownerData?.displayName || ownerData?.email || 'Anonymous',
                    photoURL: ownerData?.photoURL || null,
                }
            };
        }
        return p;
    });

    return projectsWithAuthors;
    
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      throw new Error("We're having trouble fetching community projects right now due to a configuration issue. Please contact support if this continues.");
    }
    console.error("Error fetching public projects:", err);
    throw new Error("An unexpected error occurred while fetching community projects.");
  }
}

export const getUserSubscriptionPlan = async (userId: string): Promise<SubscriptionPlan> => {
    const subscription = await getSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
        return 'free';
    }

    return subscription.tier_id || 'free';
}

