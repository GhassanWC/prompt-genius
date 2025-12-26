'use client';

import { useEffect, useState, useMemo, useRef, useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import type { Project } from '@/lib/projects';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, Lock, Rocket, GitFork, Check, TrendingUp, Heart, Star, Clock } from 'lucide-react';
import { LikeButton } from '@/components/community/like-button';
import { formatDistanceToNow } from 'date-fns';
import { TrendingBadge } from '@/components/community/trending-badge';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTier, Tier } from '@/lib/tiers';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CommunityProject = Project & {
  cloneCount?: number;
};


function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center p-8 border-gray-200 shadow-lg bg-white rounded-2xl">
        <CardContent className="p-0">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-6">
            <Lock className="h-8 w-8 text-[#00171f]" />
          </div>
          <h2 className="font-headline text-2xl font-bold text-[#00171f]">
            Exclusive Feature
          </h2>
          <p className="mt-2 text-gray-600">
            Access to the community showcase is available for Plus and Pro members.
          </p>
          <Link href="/#pricing">
            <Button className="mt-6 bg-[#00171f] hover:bg-[#00171f]/90 text-white rounded-full text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-3 font-semibold">
              <Rocket className="mr-2 h-4 w-4" />
              Upgrade Your Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

const PAGE_SIZE = 12;

const formatCommunityDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString() : '—';

export default function CommunityPage() {
  const { user, subscriptionPlan, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tier, setTier] = useState<Tier | null>(null);
  const [tierLoading, setTierLoading] = useState(true);
  const canAccessCommunity = useMemo(
    () => tier?.features.communityAccess === true,
    [tier]
  );

  const [publicProjects, setPublicProjects] = useState<CommunityProject[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [clonedSourceIds, setClonedSourceIds] = useState<Set<string>>(() => new Set());
  const [cloningProjectId, setCloningProjectId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'most-liked' | 'most-cloned'>('recent');
  const [trendingProjects, setTrendingProjects] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchTierInfo = async () => {
      setTierLoading(true);
      try {
        if (subscriptionPlan) {
          const tierData = await getTier(subscriptionPlan);
          setTier(tierData);
        } else {
          setTier(null);
        }
      } finally {
        setTierLoading(false);
      }
    };
    if (!authLoading && subscriptionPlan !== undefined) {
      fetchTierInfo();
    } else if (!authLoading && subscriptionPlan === null) {
      setTierLoading(false);
    }
  }, [subscriptionPlan, authLoading]);

  useEffect(() => {
    if (!canAccessCommunity) {
      setPublicProjects([]);
      setHasMore(false);
      setLoadingInitial(false);
      return;
    }

    const loadFirstPage = async () => {
      setLoadingInitial(true);
      try {
        const res = await fetch(
          `/api/projects?public=true&count=${PAGE_SIZE}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const { projects, nextCursor: cursor } = await res.json();
        setPublicProjects(projects || []);
        setNextCursor(cursor || null);
        setHasMore(Boolean(cursor));
      } catch (e) {
        console.error('Failed to fetch first page:', e);
        setPublicProjects([]);
        setNextCursor(null);
        setHasMore(false);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadFirstPage();
    loadTrending();
  }, [canAccessCommunity]);

  const loadTrending = async () => {
    try {
      const res = await fetch('/api/community/trending?period=weekly&limit=10');
      if (res.ok) {
        const data = await res.json();
        setTrendingProjects(data.trending?.map((t: any) => t.projectId) || []);
      }
    } catch (e) {
      console.error('Failed to load trending:', e);
    }
  };

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !canAccessCommunity) return;
    if (!nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/projects?public=true&count=${PAGE_SIZE}&cursor=${encodeURIComponent(
          nextCursor
        )}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const { projects: more, nextCursor: cursor } = await res.json();
      setPublicProjects((prev) => [...prev, ...(more || [])]);
      setNextCursor(cursor || null);
      setHasMore(Boolean(cursor));
    } catch (e) {
      console.error('Failed to fetch more projects:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, canAccessCommunity]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const filteredProjects = useMemo(() => {
    let filtered = publicProjects;
    
    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(lower) || p.idea.toLowerCase().includes(lower)
      );
    }

    // Apply sorting
    if (sortBy === 'trending') {
      filtered = filtered.sort((a, b) => {
        const aTrending = trendingProjects.indexOf(a.id);
        const bTrending = trendingProjects.indexOf(b.id);
        if (aTrending === -1 && bTrending === -1) return 0;
        if (aTrending === -1) return 1;
        if (bTrending === -1) return -1;
        return aTrending - bTrending;
      });
    } else if (sortBy === 'most-liked') {
      filtered = filtered.sort((a, b) => {
        const aLikes = (a as any).likeCount || 0;
        const bLikes = (b as any).likeCount || 0;
        return bLikes - aLikes;
      });
    } else if (sortBy === 'most-cloned') {
      filtered = filtered.sort((a, b) => {
        const aClones = a.cloneCount || 0;
        const bClones = b.cloneCount || 0;
        return bClones - aClones;
      });
    } else {
      // Recent (default)
      filtered = filtered.sort((a, b) => {
        const aDate = new Date(a.createdAt as any).getTime();
        const bDate = new Date(b.createdAt as any).getTime();
        return bDate - aDate;
      });
    }

    return filtered;
  }, [searchTerm, publicProjects, sortBy, trendingProjects]);

  const fetchUserClones = useCallback(async () => {
    if (!user) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/project-clones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Unable to load your clones');
      const { clones } = await res.json();
      setClonedSourceIds(new Set((clones ?? []).map((clone: any) => clone.sourceProjectId)));
    } catch (error) {
      console.error('Failed to fetch clones metadata', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchUserClones();
  }, [user, fetchUserClones]);

  const handleCloneProject = useCallback(
    async (projectId: string, event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (cloningProjectId) return;
      setCloningProjectId(projectId);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'cloneProject', sourceProjectId: projectId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to clone project.');
        }
        toast({
          title: 'Project cloned',
          description: 'It is now available on your dashboard.',
        });
        setClonedSourceIds((prev) => {
          const next = new Set(prev);
          next.add(projectId);
          return next;
        });
        router.push(`/projects/${data.cloneProjectId}`);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Clone failed',
          description: error?.message || 'Unable to clone the project.',
        });
      } finally {
        setCloningProjectId(null);
      }
    },
    [cloningProjectId, router, toast]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? (
              <UserNav />
            ) : (
              <Link href="/login">
                <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 active:scale-95 transition-all duration-200 font-medium text-xs sm:text-sm px-4 py-1.5 sm:px-6 sm:py-2 rounded-full">
                  Sign In
                </Button>
              </Link>
            )}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search projects..."
              className="w-full bg-white dark:bg-[#00171f] text-sm rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/10 dark:focus:ring-white/10 transition-all duration-200 pl-11 pr-4 py-2.5 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {authLoading || tierLoading ? (
          <div className="space-y-6">
            {/* Category Skeleton */}
            <div className="mb-6">
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
            {/* Projects Grid Skeleton */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-[#00171f] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <Skeleton className="w-full min-h-[140px] bg-gray-50 dark:bg-gray-900" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-full rounded-md" />
                    <div className="flex gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex gap-2.5">
                      <Skeleton className="h-8 w-16 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !canAccessCommunity ? (
          <AccessDenied />
        ) : loadingInitial ? (
          <div className="space-y-6">
            {/* Category Skeleton */}
            <div className="mb-6">
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
            {/* Projects Grid Skeleton */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-[#00171f] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <Skeleton className="w-full min-h-[140px] bg-gray-50 dark:bg-gray-900" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-full rounded-md" />
                    <div className="flex gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex gap-2.5">
                      <Skeleton className="h-8 w-16 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Category Filters */}
            <div className="mb-8 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2.5 pb-2">
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                  className={`rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                    sortBy === 'recent' 
                      ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm' 
                      : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={sortBy === 'trending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('trending')}
                  className={`rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                    sortBy === 'trending' 
                      ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm' 
                      : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  Trending
                </Button>
                <Button
                  variant={sortBy === 'most-liked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('most-liked')}
                  className={`rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                    sortBy === 'most-liked' 
                      ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm' 
                      : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Heart className="mr-1.5 h-3.5 w-3.5" />
                  Most Liked
                </Button>
                <Button
                  variant={sortBy === 'most-cloned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('most-cloned')}
                  className={`rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                    sortBy === 'most-cloned' 
                      ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm' 
                      : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <GitFork className="mr-1.5 h-3.5 w-3.5" />
                  Most Cloned
                </Button>
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <section>
                <div className="grid w-full gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProjects.map((project) => {
                      const createdDate = formatCommunityDate(project.createdAt as any);
                      const cloneCount = project.cloneCount ?? 0;
                      const authorName =
                        (project as any).author?.displayName || 'Community project';
                      const relativeDate = formatDistanceToNow(new Date(project.createdAt as any), { addSuffix: true });

                      return (
                        <div key={project.id} className="group">
                          <div className="bg-white dark:bg-[#00171f] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 overflow-hidden">
                            <Link href={`/projects/${project.id}`} className="block">
                              {/* Project Idea Preview - Modern Card Style */}
                              <div className="relative w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                <div className="p-5 pb-4">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 font-normal">
                                    {project.idea || 'No description provided.'}
                                  </p>
                                </div>
                                {trendingProjects.includes(project.id) && (
                                  <div className="absolute top-3 right-3 z-10">
                                    <TrendingBadge 
                                      rank={trendingProjects.indexOf(project.id) + 1} 
                                      period="weekly"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-5 pt-4">
                                {/* Title */}
                                <h3 className="text-sm sm:text-base font-semibold text-[#00171f] dark:text-white line-clamp-2 mb-3 group-hover:text-[#00171f]/80 dark:group-hover:text-white/80 transition-colors">
                                  {project.name}
                                </h3>

                                {/* Creator Info */}
                                <div className="flex items-center gap-2.5 mb-3">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00171f] to-gray-700 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-xs font-semibold text-white">
                                      {authorName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                                      {authorName}
                                    </p>
                                  </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                  <span className="font-medium">{cloneCount} clone{cloneCount !== 1 ? 's' : ''}</span>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span>{relativeDate}</span>
                                </div>
                              </div>
                            </Link>

                            {/* Action Buttons */}
                            <div className="px-5 pb-5 flex items-center gap-2.5 border-t border-gray-100 dark:border-gray-800 pt-4" onClick={(e) => e.preventDefault()}>
                              <LikeButton projectId={project.id} />
                              {clonedSourceIds.has(project.id) ? (
                                <div 
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-default"
                                  title="Cloned"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Check className="h-3.5 w-3.5 text-[#00171f] dark:text-white" />
                                  <span className="text-xs font-medium text-[#00171f] dark:text-white">
                                    {cloneCount}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  title="Clone"
                                  className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full transition-all duration-200 shadow-sm bg-[#00171f] text-white hover:bg-[#00171f]/90 ${
                                    cloningProjectId === project.id ? 'cursor-wait opacity-80' : ''
                                  }`}
                                  onClick={(event) => handleCloneProject(project.id, event)}
                                  disabled={!user || Boolean(cloningProjectId)}
                                >
                                  {cloningProjectId === project.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <GitFork className="h-3.5 w-3.5" />
                                  )}
                                  <span className="text-xs font-medium">
                                    {cloneCount}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                <div ref={sentinelRef} className="flex h-16 items-center justify-center">
                  {loadingMore && (
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#00171f]/30 animate-pulse" />
                      <div className="h-3 w-3 rounded-full bg-[#00171f]/30 animate-pulse delay-100" />
                      <div className="h-3 w-3 rounded-full bg-[#00171f]/30 animate-pulse delay-200" />
                    </div>
                  )}
                  {!hasMore && !loadingMore && (
                    <p className="text-sm text-gray-500">You've reached the end.</p>
                  )}
                </div>
              </section>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50">
                <Search className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-6 text-lg sm:text-xl md:text-2xl font-bold text-[#00171f]">No Projects Found</h3>
                <p className="mt-3 text-gray-600 font-medium">
                  Your search for "{searchTerm}" did not match any projects.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 bg-white hover:bg-gray-50 border-2 border-[#00171f] text-[#00171f] font-semibold text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full transition-all duration-200 hover:shadow-lg"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
