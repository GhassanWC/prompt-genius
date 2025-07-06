
'use server';

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
  serverTimestamp,
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
    // projectId is now implicit via subcollection path
    phase: string;
    title: string;
    prompt: string;
    order: number;
    mapFlow: string;
    environment: "Replit" | "Blob" | "Supabase" | "Generic";
    dir?: string;
    command?: string;
    timeEstimate?: string;
    complexity?: "low" | "medium" | "high";
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
    // Prompts are now a subcollection of the project
    const promptsCollectionRef = collection(db, 'projects', projectId, 'prompts');
    plan.developmentPlan.forEach((step, index) => {
      const promptDocRef = doc(promptsCollectionRef); // Auto-generate ID in subcollection
      batch.set(promptDocRef, {
        ...step,
        order: index,
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
        throw err;
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

    // Find and delete all associated prompts from the subcollection
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
