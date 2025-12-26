'use client';

import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrendingBadgeProps {
  rank: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'alltime';
}

export function TrendingBadge({ rank, period = 'weekly' }: TrendingBadgeProps) {
  const periodLabels = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    alltime: 'All Time',
  };

  if (rank > 10) return null; // Only show for top 10

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <Badge className={`${getRankColor(rank)} flex items-center gap-1`}>
      <TrendingUp className="h-3 w-3" />
      #{rank} {periodLabels[period]}
    </Badge>
  );
}

