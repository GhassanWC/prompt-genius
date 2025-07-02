'use server';

import { db } from '@/lib/firebase';
import { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
import {
  collection,
  addDoc,
  query,
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
  // 1. Define the main project document within the user's subcollection
  const projectDocRef = doc(collection(db, 'users', userId, 'projects'));

  // 2. Create a batch write
  const batch = writeBatch(db);

  // 3. Set the project document in the batch
  batch.set(projectDocRef, {
    name: projectName,
    idea: idea,
    // userId is now implicitly part of the path, no longer needed in the doc
    stack: plan.stack,
    createdAt: new Date(),
  });

  // 4. Add prompts to the batch
  if (plan.steps && plan.steps.length > 0) {
    plan.steps.forEach((step, index) => {
      const promptRef = doc(collection(db, 'users', userId, 'projects', projectDocRef.id, 'prompts'));
      batch.set(promptRef, {
        phase: step.phase,
        platform: step.platform,
        title: step.title,
        prompt: step.prompt,
        order: index,
      });
    });
  }

  // 5. Commit the batch
  await batch.commit();

  return projectDocRef.id;
};


// Function to get all projects for a user
export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
  try {
    const projects: Project[] = [];
    // Query the user's specific projects subcollection
    const projectsCollectionRef = collection(db, 'users', userId, 'projects');
    const q = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      projects.push({ 
        id: doc.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(0),
        stack: data.stack || 'Unknown Stack'
      });
    });

    return projects;
  } catch (error) {
     console.error("Error fetching projects: ", error);
     throw new Error("Failed to fetch projects. Please check your Firestore security rules and database indexes.");
  }
};

// Function to get a single project's details
export const getProject = async (userId: string, projectId: string): Promise<Project | null> => {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: docSnap.id,
            name: data.name || 'Untitled Project',
            idea: data.idea || '',
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(0),
            stack: data.stack || 'Unknown Stack'
         };
    }
    return null;
}

// Function to get all prompts for a project
export const getPromptsForProject = async (userId: string, projectId: string): Promise<Prompt[]> => {
    const promptsCollectionRef = collection(db, 'users', userId, 'projects', projectId, 'prompts');
    const q = query(promptsCollectionRef, orderBy('order'));
    const querySnapshot = await getDocs(q);
    const prompts: Prompt[] = [];
    querySnapshot.forEach((doc) => {
      prompts.push({ id: doc.id, ...doc.data() } as Prompt)
    });
    return prompts;
}

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, newPrompt: string): Promise<void> => {
    const promptRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', promptId);
    await updateDoc(promptRef, { prompt: newPrompt });
}

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId:string, promptId: string): Promise<void> => {
    const promptRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to add a new prompt to a project
export const addPrompt = async (userId: string, projectId: string, promptData: Omit<Prompt, 'id'>): Promise<string> => {
    const promptsCollectionRef = collection(db, 'users', userId, 'projects', projectId, 'prompts');
    const newPromptRef = await addDoc(promptsCollectionRef, promptData);
    return newPromptRef.id;
}
