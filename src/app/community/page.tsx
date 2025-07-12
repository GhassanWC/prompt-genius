
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import type { Project } from '@/lib/projects';
import { getPublicProjects } from '@/lib/project-client';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

function getInitials(name: string | null | undefined) {
    if (!name) return 'A';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicProjects = async () => {
      setLoadingProjects(true);
      try {
        const projects = await getPublicProjects(50); // Fetch up to 50 public projects
        setPublicProjects(projects);
      } catch (error) {
        console.error("Failed to fetch public projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchPublicProjects();
  }, []);
  
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 py-4 flex justify-between items-center border-b">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
             <h1 className="font-headline text-xl font-bold tracking-tight hidden sm:block">
                PromptForge AI
            </h1>
         </Link>
        {user ? <UserNav /> : <Link href="/login"><Button>Sign In</Button></Link>}
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>
        <div className="text-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                Community Spotlight
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore public projects created by other innovators using PromptForge AI.
            </p>
        </div>

        <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search projects by name or idea..."
                    className="w-full pl-10 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {loadingProjects ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <div className="w-full h-40 bg-muted rounded-t-lg animate-pulse" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
                 <CardFooter>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                 </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="group block">
                <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-xl">
                  <div className="relative w-full h-40 bg-secondary">
                    {project.imageUrl ? (
                      <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                          <Logo className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <CardTitle className="font-headline text-xl text-white absolute bottom-4 left-4 right-4">{project.name}</CardTitle>
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">{project.idea}</p>
                      <div className="mt-4 text-sm font-semibold text-primary flex items-center group-hover:underline">
                          View Project <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                  </div>
                   <CardFooter className="border-t pt-4">
                        {project.author && (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={project.author.photoURL || undefined} />
                                    <AvatarFallback>{getInitials(project.author.displayName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">By {project.author.displayName}</span>
                            </div>
                        )}
                   </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium">No Projects Found</h3>
            <p className="mt-2 text-muted-foreground">Your search for "{searchTerm}" did not match any projects.</p>
            <Button variant="outline" className="mt-6" onClick={() => setSearchTerm('')}>Clear Search</Button>
          </div>
        )}
      </main>
    </div>
  );
}
