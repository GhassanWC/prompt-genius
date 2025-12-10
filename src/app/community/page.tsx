'use client';

import { useEffect, useState, useMemo, useRef, useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import type { Project } from '@/lib/projects';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, Lock, Rocket, GitFork, Check } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
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
            <Button className="mt-6 bg-[#00171f] hover:bg-[#00171f]/90 text-white rounded-full px-6 py-3 font-semibold">
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchTierInfo = async () => {
      if (subscriptionPlan) {
        const tierData = await getTier(subscriptionPlan);
        setTier(tierData);
      } else {
        setTier(null);
      }
    };
    fetchTierInfo();
  }, [subscriptionPlan]);

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
  }, [canAccessCommunity]);

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
    if (!searchTerm) return publicProjects;
    const lower = searchTerm.toLowerCase();
    return publicProjects.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.idea.toLowerCase().includes(lower)
    );
  }, [searchTerm, publicProjects]);

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
    <div className="min-h-screen bg-white text-[#00171f] relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          {user ? (
            <UserNav />
          ) : (
            <Link href="/login">
              <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#00171f] transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>

        <div className="text-center mb-10 sm:mb-14">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f]">
            Community Spotlight
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-xl mx-auto font-medium leading-relaxed">
            Browse public projects you can clone and adapt to your own ideas.
          </p>
        </div>

        {authLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="border border-gray-200 bg-white shadow-sm rounded-2xl"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                        <Skeleton className="h-3 w-1/2 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-5/6 rounded-md" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-3 w-20 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : !canAccessCommunity ? (
          <AccessDenied />
        ) : (
          <>
            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                  <Search className="h-5 w-5 text-[#00171f]" />
                </div>
                <Input
                  type="search"
                  placeholder="Search community projects..."
                  className="w-full bg-white text-base font-medium rounded-2xl border border-gray-200 shadow-sm focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 pl-12 pr-4 py-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <section className="space-y-6">
                <div className="w-full space-y-6">
                  <div className="flex items-center justify-between px-1 sm:px-0">
                    <p className="text-sm text-gray-500">
                      Filtered results are paginated for easier browsing.
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      Clones:{' '}
                      {filteredProjects
                        .reduce((sum, project) => sum + (project.cloneCount ?? 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>

                  <div className="grid w-full gap-6 grid-cols-1 md:grid-cols-4 lg:grid-cols-5">
                    {filteredProjects.map((project) => {
                      const createdDate = formatCommunityDate(project.createdAt as any);
                      const cloneCount = project.cloneCount ?? 0;
                      const authorName =
                        (project as any).author?.displayName || 'Community project';

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="group block h-full"
                        >
                          <Card className="h-full border border-gray-200 bg-white shadow-sm rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#00171f]/30">
                            <CardContent className="p-5 flex flex-col h-full">
                              {/* Project Title */}
                              <CardTitle className="text-sm sm:text-base font-semibold text-[#00171f] line-clamp-2">
                                {project.name}
                              </CardTitle>
                              
                              {/* Author Name */}
                              <p className="text-xs text-gray-500 mt-1">
                                {authorName}
                              </p>

                              {/* Description */}
                              <p className="mt-4 text-sm text-gray-600 leading-relaxed line-clamp-4 flex-grow">
                                {project.idea || 'No description provided.'}
                              </p>

                              {/* Clone Button with Counter */}
                              <CardFooter className="mt-4 p-0 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {createdDate}
                                </span>
                                {clonedSourceIds.has(project.id) ? (
                                  <div 
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 cursor-default"
                                    title="Cloned"
                                  >
                                    <Check className="h-3.5 w-3.5 text-[#00171f]" />
                                    <span className="text-xs font-medium text-[#00171f]">
                                      {cloneCount}
                                    </span>
                                  </div>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    title="Clone"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full transition-all duration-200 shadow-md bg-[#00171f] text-white hover:bg-[#00171f]/90 ${
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
                              </CardFooter>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100" />
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
                <h3 className="mt-6 text-2xl font-bold text-[#00171f]">No Projects Found</h3>
                <p className="mt-3 text-gray-600 font-medium">
                  Your search for "{searchTerm}" did not match any projects.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 bg-white hover:bg-gray-50 border-2 border-[#00171f] text-[#00171f] font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
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
