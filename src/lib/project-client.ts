
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
import type { Project, Prompt } from './projects';


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  try {
    const projectsCollectionRef = collection(db, 'projects');
    const q = query(projectsCollectionRef, where("userId", "==", userId));
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
        userId: data.userId
      });
    });

    // Sort in code to avoid needing a composite index
    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return projects;
  } catch (err: any) {
     console.error("Error fetching projects:", err);
     if (err.code === 'permission-denied') {
        // This error will now be more meaningful as it's definitely a rules issue.
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
        // Security rules should enforce this, but an extra client-side check doesn't hurt.
        if (data.userId === userId) {
            const createdAtTimestamp = data.createdAt as Timestamp;
            return {
                id: docSnap.id,
                name: data.name || 'Untitled Project',
                idea: data.idea || '',
                imageUrl: data.imageUrl,
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
                userId: data.userId,
            };
        }
    }
    // If we are here, either the project doesn't exist or the user doesn't own it.
    return null;
}

// Function to get all prompts for a project
export const getPromptsForProject = async (userId: string, projectId: string): Promise<Prompt[]> => {
    // First, verify the user can access the project at all.
    const project = await getProject(userId, projectId);
    if (!project) {
        throw new Error("Permission denied or project not found.");
    }
    
    // Prompts are now a subcollection of projects
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    // We don't need to query by projectId anymore since we are in the subcollection.
    const querySnapshot = await getDocs(promptsCollectionRef);
    const prompts: Prompt[] = [];
    querySnapshot.forEach((doc) => {
      // The returned prompt will not have projectId, which matches our updated Prompt interface.
      prompts.push({ id: doc.id, ...doc.data() } as Prompt)
    });

    prompts.sort((a, b) => (a.order || 0) - (b.order || 0));
    return prompts;
}


// Helper function to verify project ownership, used by write operations below
const verifyProjectOwner = async (userId: string, projectId: string) => {
    const project = await getProject(userId, projectId);
    if (!project) {
        throw new Error("Permission denied or project not found.");
    }
    return project;
}


// Function to create a new project and add its prompts
export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  idea: string,
  plan: DecomposeIdeaOutput
): Promise<string> => {
  const projectDocRef = await addDoc(collection(db, 'projects'), {
    name: projectName,
    idea: idea,
    imageUrl: null,
    createdAt: serverTimestamp(),
    userId: userId,
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
        await verifyProjectOwner(userId, projectId);
        
        // AI flow is a server action, which is fine to call from the client
        const imageResult = await generateImage({ idea });
        const dataUri = imageResult.imageUrl;
        
        // Storage and DB writes happen on the authenticated client
        const imagePath = `project-images/${projectId}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadString(imageRef, dataUri, 'data_url');
        const imageUrl = await getDownloadURL(imageRef);

        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { imageUrl });

    } catch (err) {
        // This is a fire-and-forget background task.
        // We log the error but don't re-throw, as the user has already moved on.
        console.error("Background image generation and save failed:", err);
    }
}

// Function to update a project's details
export const updateProject = async (userId: string, projectId: string, data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, data);
};

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, data: Partial<Omit<Prompt, 'id'>>): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, data);
}

// Function to update a prompt's status
export const updatePromptStatus = async (userId: string, projectId: string, promptId: string, isDone: boolean): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, { isDone });
};

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to delete a project and all its associated prompts
export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
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
    await verifyProjectOwner(userId, projectId);
    
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    const q = query(promptsCollectionRef, where("phase", "==", promptData.phase));
    const phasePromptsSnapshot = await getDocs(q);
    const newOrder = phasePromptsSnapshot.docs.length;

    const newPromptRef = await addDoc(promptsCollectionRef, {
        ...promptData,
        order: newOrder,
        isDone: false, // Default to not done
    });
    return newPromptRef.id;
}

// Function to update the order of prompts
export const updatePromptsOrder = async (userId: string, projectId: string, prompts: { id: string; order: number }[]): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const batch = writeBatch(db);
    prompts.forEach(prompt => {
        const promptRef = doc(db, 'projects', projectId, 'prompts', prompt.id);
        batch.update(promptRef, { order: prompt.order });
    });
    await batch.commit();
};
