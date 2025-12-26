// Community feature types and interfaces

export interface ProjectLike {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
}

export interface ProjectFavorite {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  content: string;
  parentCommentId?: string; // For threaded replies
  createdAt: Date;
  updatedAt?: Date;
  likes?: number;
  isEdited?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  createdAt: Date;
  updatedAt: Date;
  // Stats
  projectsCreated: number;
  projectsCloned: number;
  totalLikes: number;
  totalComments: number;
  badges: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ProjectCollection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  projectIds: string[];
  isPublic: boolean;
  coverImageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  followerCount?: number;
}

export interface TrendingProject {
  projectId: string;
  score: number;
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  rank: number;
  calculatedAt: Date;
}

export interface FeaturedProject {
  projectId: string;
  featuredAt: Date;
  featuredUntil?: Date;
  reason?: string;
  isActive: boolean;
}

