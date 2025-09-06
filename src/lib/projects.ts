// This file is now used only for shared type definitions.
// All database interaction logic has been moved to `src/lib/project-server.ts`
// to ensure that write operations are executed from the authenticated client,
// satisfying Firestore security rules.

export type Role = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
}

export interface ClarificationStep {
    step: number;
    userPrompt: string;
}

// Type for a project
export interface Project {
  id: string;
  name:string;
  idea: string;
  isPublic: boolean;
  imageUrl?: string;
  createdAt: Date;
  roles: Record<string, Role>;
  members: Record<string, boolean>; // Object with user IDs as keys and boolean values
  clarificationSteps?: ClarificationStep[];
  author?: {
    displayName: string;
    photoURL: string | null;
  }
}

// Type for a prompt
export interface Prompt {
    id: string;
    title: string;
    userPrompt: string;
    order: number;
    mapFlow: string;
    isDone?: boolean;
    timeEstimate?: string;
    complexity?: "low" | "medium" | "high";
    acceptanceCriteria?: string[];
}
