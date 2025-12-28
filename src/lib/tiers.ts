import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface Tier {
  id: string;
  name: string;
  features: {
    projectLimit: number;
    fullPromptGeneration: boolean;
    publicProjects: boolean;
    communityAccess: boolean;
    aiPromptEnhancement: boolean;
    executionFollowUpAgent: boolean;
    promptPlayground: boolean;
    support: 'none' | 'community' | 'priority';
  };
}

export const getTier = async (tierId: string): Promise<Tier | null> => {
  const tierDocRef = doc(db, 'tiers', tierId);
  const tierDoc = await getDoc(tierDocRef);

  if (tierDoc.exists()) {
    return { id: tierDoc.id, ...tierDoc.data() } as Tier;
  }
  
  // Fallback for free plan if document doesn't exist
  if (tierId === 'free') {
    return {
      id: 'free',
      name: 'Hobbyist',
      features: {
        projectLimit: 1,
        fullPromptGeneration: true,
        publicProjects: false,
        communityAccess: false,
        aiPromptEnhancement: false,
        executionFollowUpAgent: false,
        promptPlayground: false,
        support: 'none'
      }
    };
  }
  
  return null;
}
