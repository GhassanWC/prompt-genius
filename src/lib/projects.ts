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
}


// Function to create a new project and add its prompts
export const createProjectWithPrompts = async (
  userId: string,
  projectName: string,
  idea: string,
  plan: DecomposeIdeaOutput
) => {
  // Step 1: Create the main project document FIRST and get its ID.
  const projectRef = await addDoc(collection(db, 'projects'), {
    name: projectName,
    idea: idea,
    userId: userId,
    stack: plan.stack,
    createdAt: new Date(),
  });

  // Step 2: Create a batch to add all the prompt documents to the new project.
  // This now works because the project document exists.
  const promptsBatch = writeBatch(db);
  plan.steps.forEach((step, index) => {
    const promptRef = doc(collection(db, 'projects', projectRef.id, 'prompts'));
    promptsBatch.set(promptRef, { ...step, order: index });
  });

  // Step 3: Commit the batch of prompts.
  await promptsBatch.commit();

  return projectRef.id;
};

// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  // Removing orderBy to simplify the query and bypass the composite index requirement.
  const q = query(collection(db, 'projects'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const projects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return { 
      id: doc.id,
      name: data.name,
      idea: data.idea,
      userId: data.userId,
      // The `createdAt` field from Firestore is a Timestamp object. We convert it to a JS Date.
      createdAt: (data.createdAt as Timestamp).toDate(),
      stack: data.stack
    } as Project;
  });

  // We now sort the projects by date here in the code instead of in the database query.
  return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
