import type { SubscriptionPlan } from './project-server';
import type { Tier } from './tiers';

export interface PageAccessConfig {
  path: string;
  name: string;
  requiredTier: SubscriptionPlan;
  requiredFeatures?: (keyof Tier['features'])[];
  redirectTo?: string;
  message?: string;
}

// Define page access requirements
export const PAGE_ACCESS_CONFIG: PageAccessConfig[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    requiredTier: 'free',
    message: 'Dashboard is available to all users'
  },
  {
    path: '/projects',
    name: 'Projects',
    requiredTier: 'free',
    message: 'Projects are available to all users'
  },
  {
    path: '/projects/new',
    name: 'Create New Project',
    requiredTier: 'free',
    message: 'Project creation is available to all users'
  },
  {
    path: '/projects/[id]',
    name: 'Project Details',
    requiredTier: 'free',
    message: 'Project details are available to all users'
  },
  {
    path: '/projects/[id]/edit',
    name: 'Edit Project',
    requiredTier: 'free',
    message: 'Project editing is available to all users'
  },
  {
    path: '/community',
    name: 'Community',
    requiredTier: 'plus',
    requiredFeatures: ['communityAccess'],
    redirectTo: '/dashboard',
    message: 'Community access requires Plus plan or higher'
  },
  {
    path: '/profile',
    name: 'Profile',
    requiredTier: 'free',
    message: 'Profile is available to all users'
  },
  {
    path: '/login',
    name: 'Login',
    requiredTier: 'free',
    message: 'Login is available to all users'
  },
  {
    path: '/verify-email',
    name: 'Verify Email',
    requiredTier: 'free',
    message: 'Email verification is available to all users'
  },
  {
    path: '/privacy',
    name: 'Privacy Policy',
    requiredTier: 'free',
    message: 'Privacy policy is available to all users'
  },
  {
    path: '/terms',
    name: 'Terms of Service',
    requiredTier: 'free',
    message: 'Terms of service is available to all users'
  }
];

// Helper function to get page config by path
export const getPageConfig = (path: string): PageAccessConfig | undefined => {
  return PAGE_ACCESS_CONFIG.find(config => {
    // Exact match
    if (config.path === path) return true;
    
    // Dynamic route match (e.g., /projects/[id] matches /projects/123)
    if (config.path.includes('[') && config.path.includes(']')) {
      const pathSegments = path.split('/');
      const configSegments = config.path.split('/');
      
      if (pathSegments.length !== configSegments.length) return false;
      
      return configSegments.every((segment, index) => {
        if (segment.startsWith('[') && segment.endsWith(']')) {
          return true; // Dynamic segment matches anything
        }
        return segment === pathSegments[index];
      });
    }
    
    return false;
  });
};

// Check if user can access a specific page
export const canAccessPage = async (
  path: string,
  userTier: SubscriptionPlan,
  tierFeatures?: Tier['features']
): Promise<{ allowed: boolean; reason?: string; redirectTo?: string }> => {
  const pageConfig = getPageConfig(path);
  
  if (!pageConfig) {
    // If no config found, allow access (default behavior)
    return { allowed: true };
  }
  
  // Check tier requirement
  const tierHierarchy: SubscriptionPlan[] = ['free', 'plus', 'pro'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(pageConfig.requiredTier);
  
  if (userTierIndex < requiredTierIndex) {
    return {
      allowed: false,
      reason: pageConfig.message || `This page requires ${pageConfig.requiredTier} plan or higher`,
      redirectTo: pageConfig.redirectTo || '/dashboard'
    };
  }
  
  // Check specific features if required
  if (pageConfig.requiredFeatures && tierFeatures) {
    for (const feature of pageConfig.requiredFeatures) {
      if (!tierFeatures[feature]) {
        return {
          allowed: false,
          reason: `This page requires ${feature} feature which is not available on your current plan`,
          redirectTo: pageConfig.redirectTo || '/dashboard'
        };
      }
    }
  }
  
  return { allowed: true };
};

// Get all accessible pages for a user
export const getAccessiblePages = async (
  userTier: SubscriptionPlan,
  tierFeatures?: Tier['features']
): Promise<PageAccessConfig[]> => {
  const accessiblePages: PageAccessConfig[] = [];
  
  for (const pageConfig of PAGE_ACCESS_CONFIG) {
    const access = await canAccessPage(pageConfig.path, userTier, tierFeatures);
    if (access.allowed) {
      accessiblePages.push(pageConfig);
    }
  }
  
  return accessiblePages;
};

// Get upgrade suggestions for inaccessible pages
export const getUpgradeSuggestions = (
  userTier: SubscriptionPlan
): { page: string; requiredTier: SubscriptionPlan; message: string }[] => {
  const suggestions: { page: string; requiredTier: SubscriptionPlan; message: string }[] = [];
  
  for (const pageConfig of PAGE_ACCESS_CONFIG) {
    const tierHierarchy: SubscriptionPlan[] = ['free', 'plus', 'pro'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(pageConfig.requiredTier);
    
    if (userTierIndex < requiredTierIndex) {
      suggestions.push({
        page: pageConfig.name,
        requiredTier: pageConfig.requiredTier,
        message: pageConfig.message || `Upgrade to ${pageConfig.requiredTier} to access ${pageConfig.name}`
      });
    }
  }
  
  return suggestions;
};
