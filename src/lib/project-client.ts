// This file contains functions that are safe to run on the client side.
// They handle reading project data and do not involve sensitive operations or AI flows.

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  type Timestamp,
} from 'firebase/firestore';
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
