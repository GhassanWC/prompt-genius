'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProjectsForUser, type Project } from '@/lib/projects';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, PlusCircle, FolderOpen } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
          const userProjects = await getProjectsForUser(user.uid);
          setProjects(userProjects);
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          // If fetching fails, assume no projects exist. This handles cases
          // where the collection hasn't been created yet.
          setProjects([]);
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 py-4 flex justify-between items-center border-b">
         <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
             <h1 className="font-headline text-xl font-bold tracking-tight hidden sm:block">
                PromptForge AI
            </h1>
         </Link>
        <UserNav />
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-headline">My Projects</h2>
          <Link href="/projects/new">
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {loadingProjects ? (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card><CardHeader><div className="h-5 w-3/4 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
              <Card><CardHeader><div className="h-5 w-2/3 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
              <Card><CardHeader><div className="h-5 w-3/5 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
           </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium">No projects yet</h3>
            <p className="mt-2 text-muted-foreground">Get started by creating your first project.</p>
            <Link href="/projects/new" className="mt-6 inline-block">
                <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Project
                </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="block">
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
                  <CardHeader>
                    <CardTitle className="font-headline">{project.name}</CardTitle>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.idea}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
