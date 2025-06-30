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
  // Step 1: Create the main project document FIRST and wait for it to complete.
  const projectRef = await addDoc(collection(db, 'projects'), {
    name: projectName,
    idea: idea,
    userId: userId,
    stack: plan.stack,
    createdAt: new Date(),
  });

  // Step 2: Sequentially add each prompt document to the new project's subcollection.
  // This avoids race conditions with security rules by ensuring the project document
  // is fully created before we try to write to its subcollection.
  if (plan.steps && plan.steps.length > 0) {
    for (const [index, step] of plan.steps.entries()) {
      await addDoc(collection(db, 'projects', projectRef.id, 'prompts'), {
        ...step,
        order: index,
      });
    }
  }

  return projectRef.id;
};


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  const projects: Project[] = [];
  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach((doc) => {
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
     return []; // Return an empty array in case of error
  }


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
