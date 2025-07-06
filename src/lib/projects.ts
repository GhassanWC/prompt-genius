
// This file is now used only for shared type definitions.
// All database interaction logic has been moved to `src/lib/project-client.ts`
// to ensure that write operations are executed from the authenticated client,
// satisfying Firestore security rules.

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
