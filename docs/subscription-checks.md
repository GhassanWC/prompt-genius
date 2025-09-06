# Subscription-Based Action Checks

This document explains how to use the subscription check system to validate user actions based on their subscription plan.

## Overview

The subscription check system provides a comprehensive way to:
- Validate user permissions based on their subscription plan
- Show appropriate upgrade prompts when actions are not allowed
- Manage feature access across different subscription tiers
- Provide a consistent user experience for subscription-gated features

## Architecture

### Core Files

1. **`src/lib/subscription-checks.ts`** - Core utility functions for checking subscription permissions
2. **`src/hooks/use-subscription-checks.ts`** - React hook for easy access to subscription checks
3. **`src/components/subscription-guard.tsx`** - React components for conditional rendering based on permissions
4. **`src/context/auth-context.tsx`** - Updated auth context with subscription check methods

### Subscription Plans

- **Free**: 1 project, basic features
- **Plus**: 10 projects, public projects, community access, AI enhancement
- **Pro**: 30 projects, all features, priority support

## Usage Examples

### 1. Using the Hook

```tsx
import { useSubscriptionChecks } from '@/hooks/use-subscription-checks';

const MyComponent = () => {
  const { 
    subscriptionPlan, 
    currentProjectCount,
    canCreateProject,
    canMakeProjectPublic,
    getLimits 
  } = useSubscriptionChecks();

  const handleCreateProject = async () => {
    const result = await canCreateProject();
    if (result.allowed) {
      // Proceed with project creation
    } else {
      // Show error message: result.reason
    }
  };

  return (
    <div>
      <p>Plan: {subscriptionPlan}</p>
      <p>Projects: {currentProjectCount}</p>
      <button onClick={handleCreateProject}>Create Project</button>
    </div>
  );
};
```

### 2. Using SubscriptionGuard Components

```tsx
import { 
  CreateProjectGuard, 
  PublicProjectGuard, 
  CommunityGuard 
} from '@/components/subscription-guard';

const ProjectActions = () => {
  return (
    <div>
      {/* Only shows if user can create projects */}
      <CreateProjectGuard>
        <button>Create New Project</button>
      </CreateProjectGuard>

      {/* Only shows if user can make projects public */}
      <PublicProjectGuard>
        <button>Make Public</button>
      </PublicProjectGuard>

      {/* Only shows if user can access community */}
      <CommunityGuard>
        <button>Browse Community</button>
      </CommunityGuard>
    </div>
  );
};
```

### 3. Using Generic SubscriptionGuard

```tsx
import { SubscriptionGuard } from '@/components/subscription-guard';

const CustomFeature = () => {
  return (
    <SubscriptionGuard action="ai_enhancement">
      <button>Enhance with AI</button>
    </SubscriptionGuard>
  );
};
```

### 4. Custom Fallback Content

```tsx
<SubscriptionGuard 
  action="create_project"
  fallback={
    <div className="upgrade-prompt">
      <h3>Upgrade Required</h3>
      <p>You've reached your project limit.</p>
      <button>Upgrade Now</button>
    </div>
  }
  showUpgradeButton={false}
>
  <button>Create Project</button>
</SubscriptionGuard>
```

## Available Actions

| Action | Description | Free | Plus | Pro |
|--------|-------------|------|------|-----|
| `create_project` | Create new projects | ✅ (1) | ✅ (10) | ✅ (30) |
| `make_public` | Make projects public | ❌ | ✅ | ✅ |
| `access_community` | Access community features | ❌ | ✅ | ✅ |
| `ai_enhancement` | Use AI prompt enhancement | ❌ | ✅ | ✅ |
| `full_generation` | Use full prompt generation | ✅ | ✅ | ✅ |

## API Reference

### useSubscriptionChecks Hook

```tsx
const {
  // State
  subscriptionPlan: SubscriptionPlan | null,
  currentProjectCount: number,
  loading: boolean,
  
  // Action checks
  canCreateProject: () => Promise<ActionCheckResult>,
  canMakeProjectPublic: () => Promise<ActionCheckResult>,
  canAccessCommunity: () => Promise<ActionCheckResult>,
  canUseAIPromptEnhancement: () => Promise<ActionCheckResult>,
  canUseFullPromptGeneration: () => Promise<ActionCheckResult>,
  
  // Utilities
  getLimits: () => Promise<SubscriptionLimits | null>,
  getUpgradeSuggestion: (action: string) => string | null,
  checkAction: (action, currentProjectCount?) => Promise<ActionCheckResult>
} = useSubscriptionChecks();
```

### ActionCheckResult Interface

```tsx
interface ActionCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}
```

### SubscriptionLimits Interface

```tsx
interface SubscriptionLimits {
  projectLimit: number;
  fullPromptGeneration: boolean;
  publicProjects: boolean;
  communityAccess: boolean;
  aiPromptEnhancement: boolean;
  support: 'none' | 'community' | 'priority';
}
```

### SubscriptionGuard Props

```tsx
interface SubscriptionGuardProps {
  action: 'create_project' | 'make_public' | 'access_community' | 'ai_enhancement' | 'full_generation';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
  currentProjectCount?: number;
}
```

## Best Practices

### 1. Always Check Before Actions

```tsx
// Good: Check before performing action
const handleAction = async () => {
  const result = await canCreateProject();
  if (!result.allowed) {
    showError(result.reason);
    return;
  }
  // Proceed with action
};

// Bad: Assume permission
const handleAction = () => {
  // Directly perform action without checking
};
```

### 2. Use Guards for UI Elements

```tsx
// Good: Use guards to conditionally render
<CreateProjectGuard>
  <button>Create Project</button>
</CreateProjectGuard>

// Bad: Manually check and render
{canCreate && <button>Create Project</button>}
```

### 3. Provide Clear Upgrade Paths

```tsx
// Good: Show upgrade suggestion
const result = await canCreateProject();
if (!result.allowed) {
  const suggestion = getUpgradeSuggestion('create_project');
  showUpgradePrompt(suggestion);
}

// Bad: Generic error message
if (!result.allowed) {
  showError('Action not allowed');
}
```

### 4. Handle Loading States

```tsx
const { loading, subscriptionPlan } = useSubscriptionChecks();

if (loading) {
  return <div>Loading subscription data...</div>;
}

if (!subscriptionPlan) {
  return <div>Please sign in to access features</div>;
}
```

## Error Handling

The system handles various error scenarios:

1. **No subscription plan**: Returns appropriate error message
2. **Database errors**: Falls back to default limits
3. **Network issues**: Graceful degradation with cached data
4. **Invalid actions**: Returns "Unknown action" error

## Testing

To test different subscription scenarios:

1. **Free plan**: Create 1 project, try to create more
2. **Plus plan**: Test public projects and community access
3. **Pro plan**: Test all features
4. **Edge cases**: Test with no subscription, expired subscription

## Integration with Existing Code

The subscription checks integrate seamlessly with existing code:

```tsx
// Before
const handleCreateProject = () => {
  createProject();
};

// After
const handleCreateProject = async () => {
  const result = await canCreateProject();
  if (result.allowed) {
    createProject();
  } else {
    showUpgradePrompt(result.reason);
  }
};
```

## Future Enhancements

Potential improvements to consider:

1. **Caching**: Cache subscription data to reduce API calls
2. **Real-time updates**: Update limits when subscription changes
3. **Usage tracking**: Track actual usage vs limits
4. **Trial periods**: Support for trial subscriptions
5. **Custom limits**: Allow custom limits per user/organization
