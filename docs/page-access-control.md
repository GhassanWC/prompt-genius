# Page Access Control System

This document explains how to implement subscription-based page access control in your application.

## Overview

The page access control system provides:
- **Page-level protection** based on subscription tiers
- **Automatic redirects** when users don't have access
- **Navigation filtering** to show only accessible pages
- **Beautiful access denied UI** with upgrade prompts
- **Flexible configuration** for different access requirements

## Architecture

### Core Components

1. **`src/lib/page-access.ts`** - Page access configuration and logic
2. **`src/components/page-access-guard.tsx`** - Individual page protection
3. **`src/components/app-layout-guard.tsx`** - Application-wide protection
4. **`src/components/navigation-guard.tsx`** - Navigation filtering
5. **`src/components/with-page-access.tsx`** - Higher-order component

## Quick Start

### 1. Configure Page Access

First, define which pages require which subscription tiers:

```tsx
// src/lib/page-access.ts
export const PAGE_ACCESS_CONFIG: PageAccessConfig[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    requiredTier: 'free',
    message: 'Dashboard is available to all users'
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
    path: '/projects/[id]',
    name: 'Project Details',
    requiredTier: 'free',
    message: 'Project details are available to all users'
  }
];
```

### 2. Protect Individual Pages

#### Option A: Using PageAccessGuard Component

```tsx
// src/app/community/page.tsx
'use client';

import { PageAccessGuard } from '@/components/page-access-guard';

export default function CommunityPage() {
  return (
    <PageAccessGuard>
      <div>
        {/* Your community page content */}
        <h1>Community</h1>
        <p>Welcome to the community!</p>
      </div>
    </PageAccessGuard>
  );
}
```

#### Option B: Using Higher-Order Component

```tsx
// src/app/community/page.tsx
'use client';

import { withPageAccess } from '@/components/with-page-access';

function CommunityPage() {
  return (
    <div>
      <h1>Community</h1>
      <p>Welcome to the community!</p>
    </div>
  );
}

export default withPageAccess(CommunityPage);
```

### 3. Protect Entire Application

Add the AppLayoutGuard to your root layout:

```tsx
// src/app/layout.tsx
import { AppLayoutGuard } from '@/components/app-layout-guard';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppLayoutGuard excludePaths={['/api/*']}>
            {children}
          </AppLayoutGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Filter Navigation

Use NavigationGuard to show only accessible pages:

```tsx
// src/components/sidebar.tsx
import { NavigationGuard, NavigationLink } from '@/components/navigation-guard';

export function Sidebar() {
  return (
    <NavigationGuard>
      {(accessiblePages) => (
        <nav>
          <NavigationLink href="/dashboard" accessiblePages={accessiblePages}>
            Dashboard
          </NavigationLink>
          <NavigationLink href="/community" accessiblePages={accessiblePages}>
            Community
          </NavigationLink>
        </nav>
      )}
    </NavigationGuard>
  );
}
```

## Configuration Options

### PageAccessConfig Interface

```tsx
interface PageAccessConfig {
  path: string;                    // Page path (supports dynamic routes)
  name: string;                    // Human-readable name
  requiredTier: SubscriptionPlan;  // Minimum required tier
  requiredFeatures?: string[];     // Specific features required
  redirectTo?: string;            // Redirect path if access denied
  message?: string;               // Custom access denied message
}
```

### Supported Path Patterns

```tsx
// Exact paths
'/dashboard'
'/community'

// Dynamic routes
'/projects/[id]'
'/projects/[id]/edit'

// Nested dynamic routes
'/admin/users/[userId]/settings'
```

### Tier Hierarchy

```tsx
const tierHierarchy: SubscriptionPlan[] = ['free', 'plus', 'pro'];
// Higher tiers have access to lower tier features
```

## Usage Examples

### 1. Basic Page Protection

```tsx
// Protect a page that requires Plus plan
<PageAccessGuard>
  <PremiumFeaturePage />
</PageAccessGuard>
```

### 2. Custom Access Denied UI

```tsx
<PageAccessGuard
  fallback={
    <div className="custom-access-denied">
      <h2>Premium Feature</h2>
      <p>This feature is only available to Plus members.</p>
      <button>Upgrade Now</button>
    </div>
  }
>
  <PremiumFeaturePage />
</PageAccessGuard>
```

### 3. Navigation with Access Control

```tsx
<NavigationGuard>
  {(accessiblePages) => (
    <nav>
      {accessiblePages.map(page => (
        <Link key={page.path} href={page.path}>
          {page.name}
        </Link>
      ))}
    </nav>
  )}
</NavigationGuard>
```

### 4. Conditional Navigation Links

```tsx
<NavigationGuard>
  {(accessiblePages) => (
    <nav>
      <NavigationLink href="/dashboard" accessiblePages={accessiblePages}>
        Dashboard
      </NavigationLink>
      <NavigationLink href="/community" accessiblePages={accessiblePages}>
        Community
      </NavigationLink>
    </nav>
  )}
</NavigationGuard>
```

### 5. Application-Wide Protection

```tsx
<AppLayoutGuard excludePaths={['/api/*', '/public/*']}>
  <YourApp />
</AppLayoutGuard>
```

## Advanced Features

### 1. Feature-Based Access

```tsx
{
  path: '/ai-enhancement',
  name: 'AI Enhancement',
  requiredTier: 'plus',
  requiredFeatures: ['aiPromptEnhancement'],
  message: 'AI enhancement requires Plus plan with AI features'
}
```

### 2. Dynamic Route Protection

```tsx
{
  path: '/projects/[id]',
  name: 'Project Details',
  requiredTier: 'free',
  // This will protect all project detail pages
}
```

### 3. Custom Redirects

```tsx
{
  path: '/premium-feature',
  name: 'Premium Feature',
  requiredTier: 'pro',
  redirectTo: '/upgrade',
  message: 'This feature requires Pro plan'
}
```

## Error Handling

The system handles various scenarios:

1. **No subscription plan**: Shows appropriate error message
2. **Database errors**: Falls back to default behavior
3. **Network issues**: Graceful degradation
4. **Invalid paths**: Allows access (default behavior)

## Best Practices

### 1. Always Check Access

```tsx
// Good: Use guards for protection
<PageAccessGuard>
  <ProtectedPage />
</PageAccessGuard>

// Bad: Manual checking
{userTier === 'pro' && <ProtectedPage />}
```

### 2. Provide Clear Upgrade Paths

```tsx
// Good: Clear upgrade messaging
{
  path: '/community',
  message: 'Community access requires Plus plan. Upgrade to connect with other creators!'
}

// Bad: Generic message
{
  path: '/community',
  message: 'Access denied'
}
```

### 3. Use Navigation Guards

```tsx
// Good: Filter navigation based on access
<NavigationGuard>
  {(pages) => pages.map(page => <Link href={page.path}>{page.name}</Link>)}
</NavigationGuard>

// Bad: Show all links and handle errors
{allPages.map(page => <Link href={page.path}>{page.name}</Link>)}
```

### 4. Handle Loading States

```tsx
// The guards automatically handle loading states
<PageAccessGuard>
  <YourPage />
</PageAccessGuard>
// Shows loading spinner while checking access
```

## Testing

### Test Different Subscription Scenarios

1. **Free plan**: Should access basic pages, denied premium pages
2. **Plus plan**: Should access community, denied pro-only features
3. **Pro plan**: Should access all pages
4. **No subscription**: Should redirect to login

### Test Edge Cases

1. **Invalid paths**: Should allow access (default behavior)
2. **Network errors**: Should show error message
3. **Database errors**: Should fall back gracefully
4. **Dynamic routes**: Should protect correctly

## Integration with Existing Code

The system integrates seamlessly:

```tsx
// Before: Manual access checking
const CommunityPage = () => {
  const { subscriptionPlan } = useAuth();
  
  if (subscriptionPlan !== 'plus' && subscriptionPlan !== 'pro') {
    return <AccessDenied />;
  }
  
  return <CommunityContent />;
};

// After: Automatic protection
const CommunityPage = () => {
  return (
    <PageAccessGuard>
      <CommunityContent />
    </PageAccessGuard>
  );
};
```

## Performance Considerations

1. **Caching**: Access checks are cached per session
2. **Lazy loading**: Guards only check when needed
3. **Minimal re-renders**: Efficient state management
4. **Background checks**: Non-blocking access verification

## Future Enhancements

Potential improvements:

1. **Role-based access**: Support for user roles
2. **Time-based access**: Temporary access grants
3. **Usage tracking**: Track feature usage
4. **A/B testing**: Different access for different users
5. **Analytics**: Track access patterns and upgrades
