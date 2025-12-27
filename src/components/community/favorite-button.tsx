'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';

interface FavoriteButtonProps {
  projectId: string;
  initialFavorited?: boolean;
  initialCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function FavoriteButton({ projectId, initialFavorited, initialCount, onClick }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  // Use initial values directly - they come from server and are always correct
  // Initialize state with initial values immediately
  const [favorited, setFavorited] = useState(() => initialFavorited ?? false);
  const [count, setCount] = useState(() => initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const hasInitialValues = initialCount !== undefined && initialFavorited !== undefined;

  // CRITICAL: Always sync with initial values when they change
  // This ensures buttons show correct state on page reload
  useEffect(() => {
    // Always sync with initial values when they're provided (they're from server, so trust them)
    // Only skip if user has interacted in THIS session (not on page reload)
    if (!hasUserInteracted) {
      if (initialCount !== undefined) {
        setCount(initialCount);
      }
      if (initialFavorited !== undefined) {
        setFavorited(initialFavorited);
      }
    }
  }, [initialCount, initialFavorited, hasUserInteracted]);

  // Reset interaction flag when project changes
  useEffect(() => {
    setHasUserInteracted(false);
  }, [projectId]);

  // Only fetch if initial values weren't provided
  useEffect(() => {
    if (!hasInitialValues) {
      if (user && projectId) {
        checkFavoriteStatus();
        loadFavoriteCount();
      } else {
        loadFavoriteCount();
      }
    }
  }, [user, projectId, hasInitialValues]);

  const loadFavoriteCount = async () => {
    try {
      const res = await fetch(`/api/community/favorites?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading favorite count:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/community/favorites?projectId=${projectId}&userId=${user.uid}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited || false);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(e);
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to favorite projects.',
      });
      return;
    }

    // Prevent double-clicks
    if (loading) return;

    setLoading(true);
    setHasUserInteracted(true); // Mark that user has interacted
    const previousFavorited = favorited;
    const previousCount = count;
    
    // Optimistic update
    setFavorited(!favorited);
    setCount(prev => favorited ? prev - 1 : prev + 1);

    try {
      const token = await auth.currentUser?.getIdToken();
      const action = previousFavorited ? 'unfavorite' : 'favorite';
      
      const res = await fetch('/api/community/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, action }),
      });

      const data = await res.json();

      // Handle cases where the action was already applied (400/404 are not errors in this case)
      if (!res.ok) {
        if (res.status === 400 && data.error === 'Project already favorited') {
          // Already favorited - state is correct, just refresh count
          await loadFavoriteCount();
          return;
        }
        if (res.status === 404 && data.error === 'Favorite not found') {
          // Already unfavorited - state is correct, just refresh count
          await loadFavoriteCount();
          return;
        }
        // Real error - revert optimistic update
        setFavorited(previousFavorited);
        setCount(previousCount);
        throw new Error(data.error || 'Failed to update favorite');
      }

      // Success - refresh to ensure sync (this will update state correctly)
      await loadFavoriteCount();
      if (user) {
        const statusRes = await fetch(`/api/community/favorites?projectId=${projectId}&userId=${user.uid}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setFavorited(statusData.favorited || false);
        }
      }
    } catch (error: any) {
      console.error('Error updating favorite:', error);
      // Revert optimistic update
      setFavorited(previousFavorited);
      setCount(previousCount);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update favorite. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ALWAYS prefer initial values if provided (they come from server and are authoritative)
  // Only use local state if user has interacted in THIS session OR if initial values aren't provided
  const displayFavorited = (initialFavorited !== undefined && !hasUserInteracted) ? initialFavorited : favorited;
  const displayCount = (initialCount !== undefined && !hasUserInteracted) ? initialCount : count;

  return (
    <Button
      variant="default"
      size="sm"
      title={displayFavorited ? 'Unfavorite' : 'Favorite'}
      className={`flex items-center gap-2 px-4 py-2 h-auto rounded-xl transition-all duration-200 shadow-md active:scale-95 ${
        displayFavorited 
          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-yellow-500/20' 
          : 'bg-gradient-to-r from-[#00171f] to-gray-800 dark:from-gray-700 dark:to-gray-900 text-white hover:from-[#00171f]/90 hover:to-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-800'
      } ${
        loading ? 'cursor-wait opacity-80' : ''
      }`}
      onClick={handleFavorite}
      disabled={loading || !user}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className={`h-4 w-4 ${displayFavorited ? 'fill-current animate-pulse' : ''} transition-all`} />
      )}
      <span className="text-sm font-semibold">
        {displayCount}
      </span>
    </Button>
  );
}

