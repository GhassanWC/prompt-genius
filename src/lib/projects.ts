// This file is now used only for shared type definitions.
// All database interaction logic has been moved to `src/lib/project-client.ts`
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
  name: string;
  idea: string;
  imageUrl?: string;
  createdAt: Date;
  roles: Record<string, Role>;
  clarificationSteps?: ClarificationStep[];
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
