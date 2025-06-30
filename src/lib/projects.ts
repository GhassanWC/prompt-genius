'use server';

import { db } from '@/lib/firebase';
import { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
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
  orderBy,
  writeBatch,
  type Timestamp
} from 'firebase/firestore';

// Type for a project
export interface Project {
  id: string;
  name: string;
  idea: string;
  userId: string;
  createdAt: Date;
  stack: string;
}

// Type for a prompt within a project
export interface Prompt {
    id: string;
    phase: string;
    platform: string;
    title: string;
    prompt: string;
    order: number;
    userId: string;
}


// Function to create a new project and add its prompts
export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  idea: string,
  plan: DecomposeIdeaOutput
) => {
  // Create a reference to a new project document.
  const projectRef = doc(collection(db, 'projects'));

  // Use a batch to perform an atomic write.
  const batch = writeBatch(db);

  // 1. Set the data for the main project document in the batch.
  batch.set(projectRef, {
    name: projectName,
    idea: idea,
    userId: userId,
    stack: plan.stack,
    createdAt: new Date(),
  });

  // 2. Add each prompt to the batch, including the userId for secure rule validation.
  if (plan.steps && plan.steps.length > 0) {
    plan.steps.forEach((step, index) => {
        const promptDocRef = doc(collection(db, 'projects', projectRef.id, 'prompts'));
        batch.set(promptDocRef, {
            ...step,
            order: index,
            userId: userId, // Add userId to each prompt to fix the security rule race condition.
        });
    });
  }

  // 3. Commit the batch. This will either succeed or fail entirely.
  await batch.commit();

  return projectRef.id;
};


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  const projects: Project[] = [];
  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({ 
        id: doc.id,
        name: data.name,
        idea: data.idea,
        userId: data.userId,
        createdAt: (data.createdAt as Timestamp).toDate(),
        stack: data.stack
      } as Project);
    });
  } catch (error) {
     console.error("Error fetching projects: ", error);
     // This handles cases where the collection doesn't exist or permissions/indexes are wrong.
     return [];
  }
  return projects;
};

// Function to get a single project's details
export const getProject = async (projectId: string): Promise<Project | null> => {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
         } as Project;
    }
    return null;
}

// Function to get all prompts for a project
export const getPromptsForProject = async (projectId: string): Promise<Prompt[]> => {
    const q = query(collection(db, 'projects', projectId, 'prompts'), orderBy('order'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
}

// Function to update a prompt
export const updatePrompt = async (projectId: string, promptId: string, newPrompt: string): Promise<void> => {
    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, { prompt: newPrompt });
}

// Function to delete a prompt
export const deletePrompt = async (projectId: string, promptId: string): Promise<void> => {
    const promptRef = doc(db, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to add a new prompt to a project
export const addPrompt = async (projectId: string, promptData: Omit<Prompt, 'id'>): Promise<string> => {
    const newPromptRef = await addDoc(collection(db, 'projects', projectId, 'prompts'), promptData);
    return newPromptRef.id;
}
