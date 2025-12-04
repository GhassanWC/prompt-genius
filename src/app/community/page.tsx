'use client';

import { useEffect, useState, useMemo, useRef, useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import type { Project } from '@/lib/projects';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Search, Lock, Rocket } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { getTier, Tier } from '@/lib/tiers';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CommunityProject = Project & {
  cloneCount?: number;
};

function getInitials(name: string | null | undefined) {
  if (!name) return 'A';
  return name.charAt(0).toUpperCase();
}

function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center p-8 border-primary/20 shadow-lg">
        <CardContent className="p-0">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            Exclusive Feature
          </h2>
          <p className="mt-2 text-muted-foreground">
            Access to the community showcase is available for Plus and Pro members.
          </p>
          <Link href="/#pricing">
            <Button className="mt-6">
              <Rocket className="mr-2 h-4 w-4" />
              Upgrade Your Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

const PAGE_SIZE = 12; // number of projects to fetch per lazy-load batch

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

  // Data + lazy loading state
  const [publicProjects, setPublicProjects] = useState<CommunityProject[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [clonedSourceIds, setClonedSourceIds] = useState<Set<string>>(() => new Set());
  const [cloningProjectId, setCloningProjectId] = useState<string | null>(null);

  // Search remains client-side
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

  // Reset list when access toggles (or page reload)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] bg-gradient-to-tl from-purple-300/30 via-pink-300/20 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          {user ? (
            <UserNav />
          ) : (
            <Link href="/login">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">
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
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>

        <div className="text-center mb-10 sm:mb-14">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
            Community Spotlight
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
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
                  className="border border-slate-200/80 bg-white/90 shadow-md shadow-slate-200/80 rounded-2xl"
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
                  <Search className="h-5 w-5 text-black" />
                </div>
                <Input
                  type="search"
                  placeholder="Search community projects..."
                  className="w-full bg-white/80 text-base font-medium rounded-2xl border border-white/50 shadow-lg shadow-black/5 backdrop-blur-xl focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 pl-16 pr-4 py-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <section className="space-y-6">
                <div className="w-full space-y-6">
                  <div className="flex items-center justify-between px-1 sm:px-0">
                    <p className="text-sm text-slate-500">
                      Filtered results are paginated for easier browsing.
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Clones:{' '}
                      {filteredProjects
                        .reduce((sum, project) => sum + (project.cloneCount ?? 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>

                  <div className="grid w-full gap-6 grid-cols-1 md:grid-cols-4 lg:grid-cols-5">
                    {filteredProjects.map((project, index) => {
                      const rowIndex = index;
                      const createdDate = formatCommunityDate(project.createdAt as any);
                      const cloneCount = (project.cloneCount ?? 0).toLocaleString();
                      const authorName =
                        (project as any).author?.displayName || 'Community project';
                      const initials = getInitials((project as any).author?.displayName ?? project.name);

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="group block h-full"
                        >
                          <Card className="h-full border border-slate-200/80 bg-white/95 shadow-md shadow-slate-200/80 rounded-2xl transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                            <CardContent className="p-5 flex flex-col h-full">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-indigo-100 bg-indigo-50">
                                    <AvatarFallback className="text-xs font-semibold text-indigo-700">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">
                                      {project.name}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {authorName}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  #{rowIndex + 1}
                                </span>
                              </div>

                              <p className="mt-4 text-sm text-slate-700 leading-relaxed line-clamp-4">
                                {project.idea || 'No description provided.'}
                              </p>

                              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <span>Created: {createdDate}</span>
                                <span>
                                  Clones:{' '}
                                  <span className="font-semibold text-slate-900">
                                    {cloneCount}
                                  </span>
                                </span>
                              </div>

                              <CardFooter className="mt-4 p-0 flex items-center justify-end">
                                {clonedSourceIds.has(project.id) ? (
                                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                    Cloned
                                  </span>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] transition-all duration-200 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 ${
                                      cloningProjectId === project.id ? 'cursor-wait opacity-80' : ''
                                    }`}
                                    onClick={(event) => handleCloneProject(project.id, event)}
                                    disabled={!user || Boolean(cloningProjectId)}
                                  >
                                    {cloningProjectId === project.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Clone'
                                    )}
                                  </Button>
                                )}
                              </CardFooter>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100" />
                </div>

                <div ref={sentinelRef} className="flex h-16 items-center justify-center">
                  {loadingMore && (
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-3 rounded-full" />
                    </div>
                  )}
                  {!hasMore && !loadingMore && (
                    <p className="text-sm text-slate-500">You’ve reached the end.</p>
                  )}
                </div>
              </section>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-indigo-200 rounded-3xl bg-white/60 backdrop-blur-xl">
                <Search className="mx-auto h-16 w-16 text-indigo-300" />
                <h3 className="mt-6 text-2xl font-bold text-slate-800">No Projects Found</h3>
                <p className="mt-3 text-slate-600 font-medium">
                  Your search for "{searchTerm}" did not match any projects.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 text-indigo-700 font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
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
