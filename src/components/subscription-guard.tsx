'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSubscriptionChecks } from '@/hooks/use-subscription-checks';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface SubscriptionGuardProps {
  action: 'create_project' | 'make_public' | 'access_community' | 'ai_enhancement' | 'full_generation';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
  currentProjectCount?: number;
}

export const SubscriptionGuard = ({
  action,
  children,
  fallback,
  showUpgradeButton = true,
  currentProjectCount
}: SubscriptionGuardProps) => {
  const { checkAction, getUpgradeSuggestion, subscriptionPlan } = useSubscriptionChecks();
  const [checkResult, setCheckResult] = useState<{ allowed: boolean; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performCheck = async () => {
      setLoading(true);
      try {
        const result = await checkAction(action, currentProjectCount);
        setCheckResult(result);
      } catch (error) {
        console.error('Failed to check subscription action:', error);
        setCheckResult({ allowed: false, reason: 'Failed to check permissions' });
      } finally {
        setLoading(false);
      }
    };

    performCheck();
  }, [action, currentProjectCount, checkAction]);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!checkResult?.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const upgradeSuggestion = getUpgradeSuggestion(action);
    
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex flex-col gap-2">
            <p>{checkResult.reason}</p>
            {showUpgradeButton && upgradeSuggestion && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => {
                    // TODO: Implement upgrade flow
                    console.log('Upgrade clicked for action:', action);
                  }}
                >
                  <span className="inline-block h-4 w-4 mr-1 text-orange-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path
                        fill="currentColor"
                        d="M10 2a1 1 0 0 1 .894.553l2.382 4.764 5.26.765a1 1 0 0 1 .554 1.707l-3.806 3.71.899 5.242a1 1 0 0 1-1.451 1.054L10 16.347l-4.682 2.458A1 1 0 0 1 3.867 17.76l.899-5.242-3.806-3.71A1 1 0 0 1 1.514 7.08l5.26-.765L9.156 2.55A1 1 0 0 1 10 2Z"
                      />
                    </svg>
                  </span>
                  Upgrade Plan
                </Button>
                <span className="text-sm text-orange-600">{upgradeSuggestion}</span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

// Convenience components for common actions
export const CreateProjectGuard = ({ children, ...props }: Omit<SubscriptionGuardProps, 'action'>) => (
  <SubscriptionGuard action="create_project" {...props}>
    {children}
  </SubscriptionGuard>
);

export const PublicProjectGuard = ({ children, ...props }: Omit<SubscriptionGuardProps, 'action'>) => (
  <SubscriptionGuard action="make_public" {...props}>
    {children}
  </SubscriptionGuard>
);

export const CommunityGuard = ({ children, ...props }: Omit<SubscriptionGuardProps, 'action'>) => (
  <SubscriptionGuard action="access_community" {...props}>
    {children}
  </SubscriptionGuard>
);

export const AIEnhancementGuard = ({ children, ...props }: Omit<SubscriptionGuardProps, 'action'>) => (
  <SubscriptionGuard action="ai_enhancement" {...props}>
    {children}
  </SubscriptionGuard>
);

export const FullGenerationGuard = ({ children, ...props }: Omit<SubscriptionGuardProps, 'action'>) => (
  <SubscriptionGuard action="full_generation" {...props}>
    {children}
  </SubscriptionGuard>
);
