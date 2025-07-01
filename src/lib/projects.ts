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
  setDoc,
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
    console.log("hello are you there")
  
  // 1. Define the main project document
  const projectDoc = await addDoc(collection(db, 'projects'), {
    name: projectName,
    idea: idea,
    userId: userId,
    stack: plan.stack,
    createdAt: new Date(),
  });

  // 2. Add prompts in a batch under /projects/{projectId}/prompts
  const batch = writeBatch(db);
  if (plan.steps && plan.steps.length > 0) {
    plan.steps.forEach((step, index) => {
      const promptRef = doc(collection(db, 'projects', projectDoc.id, 'prompts'));
      batch.set(promptRef, {
        phase: step.phase,
        platform: step.platform,
        title: step.title,
        prompt: step.prompt,
        order: index,
        userId: userId,
      });
    });
  }

  await batch.commit();

  return projectDoc.id;
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
