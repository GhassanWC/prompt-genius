'use server';

import { db } from '@/lib/firebase';
import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';
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
  createdAt: Date;
  stack: string;
  userId: string; // userId for ownership
}

// Type for a prompt
export interface Prompt {
    id: string;
    projectId: string; // Link to the project
    userId: string; // Denormalized for security rules
    phase: string;
    platform: string;
    title: string;
    prompt: string;
    order: number;
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
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(0),
            stack: data.stack || 'Unknown Stack',
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
  const projectCollectionRef = collection(db, 'projects');
  const projectDocRef = doc(projectCollectionRef);

  batch.set(projectDocRef, {
    name: projectName,
    idea: idea,
    stack: plan.stack,
    createdAt: new Date(),
    userId: userId,
  });

  if (plan.steps && plan.steps.length > 0) {
    const promptsCollectionRef = collection(db, 'prompts');
    plan.steps.forEach((step, index) => {
      const promptDocRef = doc(promptsCollectionRef);
      batch.set(promptDocRef, {
        projectId: projectDocRef.id,
        userId: userId,
        phase: step.phase,
        platform: step.platform,
        title: step.title,
        prompt: step.prompt,
        order: index,
      });
    });
  }

  await batch.commit();

  return projectDocRef.id;
};

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
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(0),
        stack: data.stack || 'Unknown Stack',
        userId: data.userId
      });
    });

    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return projects;
  } catch (err: any) {
     console.error("Error fetching projects:", err);
     if (err.code === 'permission-denied') {
        throw new Error("Permission Denied: Your security rules are blocking access. Please ensure your Firestore rules allow you to read your own projects.");
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

    prompts.sort((a, b) => a.order - b.order);
    return prompts;
}

// Function to update a prompt
export const updatePrompt = async (userId: string, projectId: string, promptId: string, newPrompt: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, { prompt: newPrompt });
}

// Function to delete a prompt
export const deletePrompt = async (userId: string, projectId: string, promptId: string): Promise<void> => {
    await verifyProjectOwner(userId, projectId);
    const promptRef = doc(db, 'prompts', promptId);
    await deleteDoc(promptRef);
}

// Function to add a new prompt to a project
export const addPrompt = async (userId: string, projectId: string, promptData: Omit<Prompt, 'id' | 'projectId' | 'userId'>): Promise<string> => {
    await verifyProjectOwner(userId, projectId);
    const promptsCollectionRef = collection(db, 'prompts');
    const newPromptRef = await addDoc(promptsCollectionRef, {
        ...promptData,
        projectId: projectId,
        userId: userId,
    });
    return newPromptRef.id;
}