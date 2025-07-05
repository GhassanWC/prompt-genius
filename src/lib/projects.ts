import { db, storage } from '@/lib/firebase';
import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
import { generateImage } from '@/ai/flows/generate-image';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';

// Type for a project
export interface Project {
  id: string;
  name: string;
  idea: string;
  imageUrl?: string;
  createdAt: Date;
  userId: string; // userId for ownership
}

// Type for a prompt
export interface Prompt {
    id: string;
    projectId: string; // Link to the project
    phase: string;
    title: string;
    prompt: string;
    order: number;
    mapFlow: string;
}

// Internal function to get a project by ID without checking ownership
const getProjectById = async (projectId: string): Promise<Project | null> => {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
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
    return null;
}

// Helper function to verify project ownership
const verifyProjectOwner = async (userId: string, projectId: string) => {
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
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
  const batch = writeBatch(db);
  const projectDocRef = doc(collection(db, 'projects'));

  // Add project creation to batch. Image URL is null initially.
  batch.set(projectDocRef, {
    name: projectName,
    idea: idea,
    imageUrl: null,
    createdAt: new Date(),
    userId: userId,
  });

  // Add prompts creation to batch
  if (plan.steps && plan.steps.length > 0) {
    const promptsCollectionRef = collection(db, 'prompts');
    plan.steps.forEach((step, index) => {
      const promptDocRef = doc(promptsCollectionRef);
      batch.set(promptDocRef, {
        projectId: projectDocRef.id,
        phase: step.phase,
        title: step.title,
        prompt: step.prompt,
        mapFlow: step.mapFlow,
        order: index,
      });
    });
  }

  await batch.commit();

  return projectDocRef.id;
};

// Function to generate and save the project image asynchronously.
export const generateAndSaveProjectImage = async (
  userId: string,
  projectId: string,
  idea: string
): Promise<void> => {
    try {
        await verifyProjectOwner(userId, projectId);
        
        const imageResult = await generateImage({ idea });
        const dataUri = imageResult.imageUrl;
        
        // Upload to Firebase Storage
        const imagePath = `project-images/${projectId}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadString(imageRef, dataUri, 'data_url');
        const imageUrl = await getDownloadURL(imageRef);

        // Update the project document with the new image URL
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { imageUrl });

    } catch (err) {
        console.error("Background image generation and save failed:", err);
        // We throw here so the .catch() on the caller side can see it if it wants to.
        throw err;
    }
}


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
    const project = await getProjectById(projectId);
    if (project && project.userId === userId) {
        return project;
    }
    return null;
}

// Function to update a project's details
export const updateProject = async (userId: string, projectId: string, data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, data);
};

// Function to get all prompts for a project
export const getPromptsForProject = async (userId: string, projectId: string): Promise<Prompt[]> => {
    await verifyProjectOwner(userId, projectId);
    const promptsCollectionRef = collection(db, 'prompts');
    const q = query(promptsCollectionRef, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    const prompts: Prompt[] = [];
    querySnapshot.forEach((doc) => {
      prompts.push({ id: doc.id, ...doc.data() } as Prompt)
    });

    prompts.sort((a, b) => (a.order || 0) - (b.order || 0));
    return prompts;
}

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, data: Partial<Omit<Prompt, 'id' | 'projectId'>>): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, data);
}

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to delete a project and all its associated prompts
export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const batch = writeBatch(db);

    // Delete the project document
    const projectRef = doc(db, 'projects', projectId);
    batch.delete(projectRef);

    // Find and delete all associated prompts for the project
    const promptsCollectionRef = collection(db, 'prompts');
    const q = query(promptsCollectionRef, where("projectId", "==", projectId));
    const promptsSnapshot = await getDocs(q);
    promptsSnapshot.forEach((promptDoc) => {
        batch.delete(promptDoc.ref);
    });

    await batch.commit();
};

// Function to add a new prompt to a project
export const addPrompt = async (userId: string, projectId: string, promptData: Omit<Prompt, 'id' | 'projectId' | 'order'>): Promise<string> => {
    await verifyProjectOwner(userId, projectId);
    
    // Get current prompts in the same phase to determine the new order
    const promptsCollectionRef = collection(db, 'prompts');
    const q = query(promptsCollectionRef, where("projectId", "==", projectId), where("phase", "==", promptData.phase));
    const phasePromptsSnapshot = await getDocs(q);
    const newOrder = phasePromptsSnapshot.docs.length;

    const newPromptRef = await addDoc(collection(db, 'prompts'), {
        ...promptData,
        projectId: projectId,
        order: newOrder,
    });
    return newPromptRef.id;
}


// Function to update the order of prompts
export const updatePromptsOrder = async (userId: string, projectId: string, prompts: { id: string; order: number }[]): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const batch = writeBatch(db);
    prompts.forEach(prompt => {
        const promptRef = doc(db, 'prompts', prompt.id);
        batch.update(promptRef, { order: prompt.order });
    });
    await batch.commit();
};
