import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import type { ActionCheckResult, SubscriptionLimits } from '@/lib/subscription-checks';

export const useSubscriptionChecks = () => {
  const { user, subscriptionPlan, checkUserAction, getSubscriptionLimits, getUpgradeSuggestion } = useAuth();
  const [currentProjectCount, setCurrentProjectCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch current project count when user changes
  useEffect(() => {
    const fetchProjectCount = async () => {
      if (!user) {
        setCurrentProjectCount(0);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/projects', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store', // always fresh; remove if you prefer caching
        });
        if (!res.ok) {
          throw new Error('Failed to fetch projects');
        }
        const projects = await res.json();
        setCurrentProjectCount(projects.length);
      } catch (error) {
        console.error('Failed to fetch project count:', error);
        setCurrentProjectCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectCount();
  }, [user]);

  // Wrapper functions that include current project count
  const canCreateProject = async (): Promise<ActionCheckResult> => {
    return checkUserAction('create_project', currentProjectCount);
  };

  const canMakeProjectPublic = async (): Promise<ActionCheckResult> => {
    return checkUserAction('make_public');
  };

  const canAccessCommunity = async (): Promise<ActionCheckResult> => {
    return checkUserAction('access_community');
  };

  const canUseAIPromptEnhancement = async (): Promise<ActionCheckResult> => {
    return checkUserAction('ai_enhancement');
  };

  const canUseFullPromptGeneration = async (): Promise<ActionCheckResult> => {
    return checkUserAction('full_generation');
  };

  const getLimits = async (): Promise<SubscriptionLimits | null> => {
    return getSubscriptionLimits();
  };

  const getUpgradeSuggestionForAction = (action: string): string | null => {
    return getUpgradeSuggestion(action);
  };

  return {
    // Current state
    subscriptionPlan,
    currentProjectCount,
    loading,
    
    // Action checks
    canCreateProject,
    canMakeProjectPublic,
    canAccessCommunity,
    canUseAIPromptEnhancement,
    canUseFullPromptGeneration,
    
    // Utility functions
    getLimits,
    getUpgradeSuggestion: getUpgradeSuggestionForAction,
    
    // Generic action checker
    checkAction: checkUserAction,
  };
};
