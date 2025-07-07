
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
} from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { generateImage } from '@/ai/flows/generate-image';
import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
import type { Project, Prompt, Role, Collaborator } from './projects';


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  try {
    const projectsCollectionRef = collection(db, 'projects');
    const q = query(projectsCollectionRef, where(`roles.${userId}`, "in", ["owner", "editor", "viewer"]));
    const querySnapshot = await getDocs(q);
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      projects.push({ 
        id: doc.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        imageUrl: data.imageUrl,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
        roles: data.roles || {},
        clarificationSteps: data.clarificationSteps,
      });
    });

    // Sort in code to avoid needing a composite index
    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return projects;
  } catch (err: any) {
     console.error("Error fetching projects:", err);
     if (err.code === 'permission-denied') {
        throw new Error("Permission Denied: Your security rules are blocking access. Please ensure they allow you to read your own projects.");
     } else if (err.code === 'failed-precondition') {
        throw new Error("Database Index Required: This query requires an index. Please check your browser's developer console for a link to create it.");
     } else {
       throw new Error(err.message || "An unknown error occurred while fetching projects.");
     }
  }
};

// Function to get a single project's details
export const getProject = async (userId: string, projectId: string): Promise<Project | null> => {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Check if the user has a role in this project
        if (data.roles && data.roles[userId]) {
            const createdAtTimestamp = data.createdAt as Timestamp;
            return {
                id: docSnap.id,
                name: data.name || 'Untitled Project',
                idea: data.idea || '',
                imageUrl: data.imageUrl,
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
                roles: data.roles,
                clarificationSteps: data.clarificationSteps,
            };
        }
    }
    // If we are here, either the project doesn't exist or the user doesn't have access.
    return null;
}


// Function to get all prompts for a project, also verifies access
export const getPromptsForProject = async (userId: string, projectId: string): Promise<Prompt[]> => {
    const project = await getProject(userId, projectId);
    if (!project) {
        throw new Error("Permission denied or project not found.");
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
    const project = await getProject(userId, projectId);
    return project?.roles?.[userId] || null;
}


// Function to create a new project and add its prompts
export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  plan: DecomposeIdeaOutput
): Promise<string> => {
  const projectDocRef = await addDoc(collection(db, 'projects'), {
    name: projectName,
    idea: plan.enhancedIdea,
    clarificationSteps: plan.clarificationSteps || [],
    imageUrl: null,
    createdAt: serverTimestamp(),
    roles: {
      [userId]: 'owner' // Set the creator as the owner
    },
  });

  const projectId = projectDocRef.id;

  if (plan.developmentPlan && plan.developmentPlan.length > 0) {
    const batch = writeBatch(db);
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    plan.developmentPlan.forEach((step, index) => {
      const promptDocRef = doc(promptsCollectionRef); 
      batch.set(promptDocRef, {
        ...step,
        order: index,
        isDone: false,
      });
    });
    await batch.commit();
  }

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
        if (!role) throw new Error("Permission denied for image generation.");
        
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
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");
    
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, data);
};

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, data: Partial<Omit<Prompt, 'id'>>): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, data);
}

// Function to update a prompt's status
export const updatePromptStatus = async (userId: string, projectId: string, promptId: string, isDone: boolean): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, { isDone });
};

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");

    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to delete a project and all its associated prompts
export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
    const role = await getProjectRole(userId, projectId);
    if (role !== 'owner') throw new Error("Permission denied. Only the owner can delete a project.");

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
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");
    
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    const q = query(promptsCollectionRef, where("phase", "==", promptData.phase));
    const phasePromptsSnapshot = await getDocs(q);
    const newOrder = phasePromptsSnapshot.docs.length;

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
    if (role !== 'owner' && role !== 'editor') throw new Error("Permission denied.");

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

export const updateProjectRoles = async (currentUserId: string, projectId: string, newRoles: Record<string, Role>): Promise<void> => {
    const role = await getProjectRole(currentUserId, projectId);
    if (role !== 'owner') {
        throw new Error("Permission denied. Only the project owner can change roles.");
    }
    if (!newRoles[currentUserId] || newRoles[currentUserId] !== 'owner') {
        throw new Error("The project must always have an owner.");
    }

    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { roles: newRoles });
}
