
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTier, Tier } from '@/lib/tiers';

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


export default function CommunityPage() {
  const { user, subscriptionPlan, loading: authLoading } = useAuth();
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tier, setTier] = useState<Tier | null>(null);

  const canAccessCommunity = useMemo(() => {
    return tier?.features.communityAccess === true;
  }, [tier]);
  
  useEffect(() => {
    const fetchTierInfo = async () => {
      if (subscriptionPlan) {
        const tierData = await getTier(subscriptionPlan);
        setTier(tierData);
      }
    };
    fetchTierInfo();
  }, [subscriptionPlan]);

  useEffect(() => {
    if (canAccessCommunity) {
      const fetchPublicProjects = async () => {
        setLoadingProjects(true);
        try {
          const res = await fetch('/api/projects?public=true&count=50');
          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }
          const {projects} = await res.json();
          setPublicProjects(projects);
        } catch (error) {
          console.error("Failed to fetch public projects:", error);
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchPublicProjects();
    } else {
        setLoadingProjects(false);
    }
  }, [canAccessCommunity]);
  
  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return publicProjects;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return publicProjects.filter(project => 
      project.name.toLowerCase().includes(lowercasedTerm) || 
      project.idea.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, publicProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 relative overflow-x-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] bg-gradient-to-tl from-purple-300/30 via-pink-300/20 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Modern header with glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
             className='ml-1 mr-1'
            />
            <h1 className="font-headline text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          {user ? <UserNav /> : <Link href="/login"><Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">Sign In</Button></Link>}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>

        {/* Enhanced hero section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
            Community Spotlight
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Explore public projects created by other innovators using Prompt Genius AI.
          </p>
        </div>

        {authLoading ? (
          <div className="text-center">
            <Skeleton className="h-12 w-full max-w-2xl mx-auto mb-12 rounded-full" />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg overflow-hidden">
                  <div className="w-full h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl animate-pulse" />
                  <CardContent className="pt-6">
                    <Skeleton className="h-7 w-3/4 mb-3 rounded-lg" />
                    <Skeleton className="h-5 w-full rounded-lg" />
                    <Skeleton className="h-5 w-2/3 mt-3 rounded-lg" />
                  </CardContent>
                  <CardFooter className="pt-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-28 rounded-lg" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : !canAccessCommunity ? (
          <AccessDenied />
        ) : (
          <>
            {/* Enhanced search section */}
            <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search projects by name or idea..."
                  className="w-full pl-12 pr-4 py-4 text-base bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg shadow-black/5 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loadingProjects ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl animate-pulse" />
                    <CardContent className="pt-6">
                      <Skeleton className="h-7 w-3/4 mb-3 rounded-lg" />
                      <Skeleton className="h-5 w-full rounded-lg" />
                      <Skeleton className="h-5 w-2/3 mt-3 rounded-lg" />
                    </CardContent>
                    <CardFooter className="pt-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-lg" />
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <Link href={`/projects/${project.id}`} key={project.id} className="group block">
                    <Card className="h-full flex flex-col overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl">
                      <div className="relative w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
                        {project.imageUrl ? (
                          <Image src={project.imageUrl} alt={project.name} fill className="object-cover rounded-t-2xl" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Logo className="h-16 w-16 text-indigo-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-t-2xl" />
                        <CardTitle className="font-headline text-xl sm:text-2xl text-white absolute bottom-4 left-4 right-4 font-bold">{project.name}</CardTitle>
                      </div>
                      <div className="p-6 flex-grow flex flex-col">
                        <p className="text-sm sm:text-base text-slate-600 line-clamp-3 flex-grow font-medium leading-relaxed">{project.idea}</p>
                        <div className="mt-6 text-sm font-semibold text-indigo-600 flex items-center group-hover:text-indigo-700 transition-colors duration-200">
                          View Project <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                      <CardFooter className="border-t border-white/50 pt-4 px-6 pb-6">
                        {project.author && (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-300">
                              <AvatarImage src={project.author.photoURL || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                                {getInitials(project.author.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-slate-500 font-medium">By {project.author.displayName}</span>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-indigo-200 rounded-3xl bg-white/60 backdrop-blur-xl">
                <Search className="mx-auto h-16 w-16 text-indigo-300" />
                <h3 className="mt-6 text-2xl font-bold text-slate-800">No Projects Found</h3>
                <p className="mt-3 text-slate-600 font-medium">Your search for "{searchTerm}" did not match any projects.</p>
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
