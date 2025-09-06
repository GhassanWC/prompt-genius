'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { canAccessPage } from '@/lib/page-access';
import { getTier } from '@/lib/tiers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, ArrowLeft } from 'lucide-react';

interface PageAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

export const PageAccessGuard = ({ 
  children, 
  fallback,
  showUpgradeButton = true 
}: PageAccessGuardProps) => {
  const { user, subscriptionPlan, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [accessCheck, setAccessCheck] = useState<{
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return;

      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }

      if (!subscriptionPlan) {
        setAccessCheck({
          allowed: false,
          reason: 'Unable to determine your subscription plan. Please try again.',
          redirectTo: '/dashboard'
        });
        setChecking(false);
        return;
      }

      try {
        // Get tier features
        const tier = await getTier(subscriptionPlan);
        const tierFeatures = tier?.features;

        // Check page access
        const access = await canAccessPage(pathname, subscriptionPlan, tierFeatures);
        setAccessCheck(access);

        // Auto-redirect if not allowed and redirectTo is specified
        if (!access.allowed && access.redirectTo && access.redirectTo !== pathname) {
          router.push(access.redirectTo);
          return;
        }
      } catch (error) {
        console.error('Error checking page access:', error);
        setAccessCheck({
          allowed: false,
          reason: 'An error occurred while checking access permissions.',
          redirectTo: '/dashboard'
        });
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, subscriptionPlan, loading, pathname, router]);

  // Show loading state
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied UI
  if (!accessCheck?.allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription>
              {accessCheck?.reason || 'You do not have permission to access this page.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showUpgradeButton && subscriptionPlan !== 'pro' && (
              <Alert className="border-orange-200 bg-orange-50">
                <span className="h-4 w-4 text-orange-600 mr-2 inline-block align-middle">⬆️</span>
                <AlertDescription className="text-orange-800">
                  Upgrade your plan to access more features and pages.
                </AlertDescription>
              </Alert>
      
            )}
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              {showUpgradeButton && subscriptionPlan !== 'pro' && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement upgrade flow
                    console.log('Upgrade clicked');
                  }}
                  className="w-full"
                >
                  {/* TODO: Import and use the correct Upgrade icon/component */}
                  <span className="h-4 w-4 mr-2 inline-block align-middle">⬆️</span>
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show children if access is allowed
  return <>{children}</>;
};
