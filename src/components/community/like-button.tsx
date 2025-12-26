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

export function LikeButton({ projectId, initialLiked = false, initialCount = 0, onClick }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      checkLikeStatus();
      loadLikeCount();
    } else {
      loadLikeCount();
    }
  }, [user, projectId]);

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
        setLiked(data.liked);
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

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const action = liked ? 'unlike' : 'like';
      
      const res = await fetch('/api/community/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, action }),
      });

      if (!res.ok) {
        throw new Error('Failed to update like');
      }

      setLiked(!liked);
      setCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update like. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      title={liked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full transition-all duration-200 shadow-md ${
        liked 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-[#00171f] text-white hover:bg-[#00171f]/90'
      } ${
        loading ? 'cursor-wait opacity-80' : ''
      }`}
      onClick={handleLike}
      disabled={loading || !user}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
      )}
      <span className="text-xs font-medium">
        {count}
      </span>
    </Button>
  );
}

