import "server-only";
import { getDb } from '@/lib/firebase-admin';

export interface Tier {
  id: string;
  name: string;
  features: {
    projectLimit: number;
    featureLimit: number; // Maximum number of features per project (8 for free, 16 for plus, 32 for pro)
    fullPromptGeneration: boolean;
    publicProjects: boolean;
    communityAccess: boolean;
    aiPromptEnhancement: boolean;
    executionFollowUpAgent: boolean;
    promptPlayground: boolean;
    cloning: boolean;
    support: 'none' | 'community' | 'priority';
    [key: string]: any; // Allow custom features
  };
}

export const getTier = async (tierId: string): Promise<Tier | null> => {
  const db = getDb();
  const tierDoc = await db.collection('tiers').doc(tierId).get();

  if (tierDoc.exists) {
    return { id: tierDoc.id, ...tierDoc.data() } as Tier;
  }
  
  // Fallback for free plan if document doesn't exist
  if (tierId === 'free') {
    return {
      id: 'free',
      name: 'Hobbyist',
      features: {
        projectLimit: 1,
        featureLimit: 8,
        fullPromptGeneration: true,
        publicProjects: false,
        communityAccess: false,
        aiPromptEnhancement: false,
        executionFollowUpAgent: false,
        promptPlayground: false,
        cloning: false,
        support: 'none'
      }
    };
  }
  
  return null;
}
