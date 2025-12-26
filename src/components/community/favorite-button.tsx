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

export function FavoriteButton({ projectId, initialFavorited = false, initialCount = 0, onClick }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      checkFavoriteStatus();
      loadFavoriteCount();
    } else {
      loadFavoriteCount();
    }
  }, [user, projectId]);

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

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const action = favorited ? 'unfavorite' : 'favorite';
      
      const res = await fetch('/api/community/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, action }),
      });

      if (!res.ok) {
        throw new Error('Failed to update favorite');
      }

      setFavorited(!favorited);
      setCount(prev => favorited ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update favorite. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      title={favorited ? 'Unfavorite' : 'Favorite'}
      className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full transition-all duration-200 shadow-md ${
        favorited 
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
          : 'bg-[#00171f] text-white hover:bg-[#00171f]/90'
      } ${
        loading ? 'cursor-wait opacity-80' : ''
      }`}
      onClick={handleFavorite}
      disabled={loading || !user}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Star className={`h-3.5 w-3.5 ${favorited ? 'fill-current' : ''}`} />
      )}
      <span className="text-xs font-medium">
        {count}
      </span>
    </Button>
  );
}

