'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface LikeButtonProps {
  projectId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function LikeButton({ projectId, initialLiked, initialCount, onClick }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  // Use initial values directly - they come from server and are always correct
  // Initialize state with initial values immediately
  const [liked, setLiked] = useState(() => initialLiked ?? false);
  const [count, setCount] = useState(() => initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const hasInitialValues = initialCount !== undefined && initialLiked !== undefined;

  // CRITICAL: Always sync with initial values when they change
  // This ensures buttons show correct state on page reload
  useEffect(() => {
    // Always sync with initial values when they're provided (they're from server, so trust them)
    // Only skip if user has interacted in THIS session (not on page reload)
    if (!hasUserInteracted) {
      if (initialCount !== undefined) {
        setCount(initialCount);
      }
      if (initialLiked !== undefined) {
        setLiked(initialLiked);
      }
    }
  }, [initialCount, initialLiked, hasUserInteracted]);

  // Reset interaction flag when project changes
  useEffect(() => {
    setHasUserInteracted(false);
  }, [projectId]);

  // Only fetch if initial values weren't provided
  useEffect(() => {
    if (!hasInitialValues) {
      if (user && projectId) {
        checkLikeStatus();
        loadLikeCount();
      } else {
        loadLikeCount();
      }
    }
  }, [user, projectId, hasInitialValues]);

  const loadLikeCount = async () => {
    try {
      const res = await fetch(`/api/community/likes?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading like count:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/community/likes?projectId=${projectId}&userId=${user.uid}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked || false);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(e);
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to like projects.',
      });
      return;
    }

    // Prevent double-clicks
    if (loading) return;

    setLoading(true);
    setHasUserInteracted(true); // Mark that user has interacted
    const previousLiked = liked;
    const previousCount = count;
    
    // Optimistic update
    setLiked(!liked);
    setCount(prev => liked ? prev - 1 : prev + 1);

    try {
      const token = await auth.currentUser?.getIdToken();
      const action = previousLiked ? 'unlike' : 'like';
      
      const res = await fetch('/api/community/likes', {
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
        if (res.status === 400 && data.error === 'Project already liked') {
          // Already liked - state is correct, just refresh count
          await loadLikeCount();
          return;
        }
        if (res.status === 404 && data.error === 'Like not found') {
          // Already unliked - state is correct, just refresh count
          await loadLikeCount();
          return;
        }
        // Real error - revert optimistic update
        setLiked(previousLiked);
        setCount(previousCount);
        throw new Error(data.error || 'Failed to update like');
      }

      // Success - refresh to ensure sync (this will update state correctly)
      await loadLikeCount();
      if (user) {
        const statusRes = await fetch(`/api/community/likes?projectId=${projectId}&userId=${user.uid}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setLiked(statusData.liked || false);
        }
      }
    } catch (error: any) {
      console.error('Error updating like:', error);
      // Revert optimistic update
      setLiked(previousLiked);
      setCount(previousCount);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update like. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ALWAYS prefer initial values if provided (they come from server and are authoritative)
  // Only use local state if user has interacted in THIS session OR if initial values aren't provided
  const displayLiked = (initialLiked !== undefined && !hasUserInteracted) ? initialLiked : liked;
  const displayCount = (initialCount !== undefined && !hasUserInteracted) ? initialCount : count;

  return (
    <Button
      variant="default"
      size="sm"
      title={displayLiked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-2 px-4 py-2 h-auto rounded-xl transition-all duration-200 shadow-md active:scale-95 ${
        displayLiked 
          ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/20' 
          : 'bg-gradient-to-r from-[#00171f] to-gray-800 dark:from-gray-700 dark:to-gray-900 text-white hover:from-[#00171f]/90 hover:to-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-800'
      } ${
        loading ? 'cursor-wait opacity-80' : ''
      }`}
      onClick={handleLike}
      disabled={loading || !user}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${displayLiked ? 'fill-current animate-pulse' : ''} transition-all`} />
      )}
      <span className="text-sm font-semibold">
        {displayCount}
      </span>
    </Button>
  );
}

