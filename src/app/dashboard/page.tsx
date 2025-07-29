
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { deleteProject, updateProject } from '@/lib/project-client';
import type { Project } from '@/lib/projects';
import { getProjectsForUser, PLAN_LIMITS } from '@/lib/project-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, PlusCircle, FolderOpen, AlertTriangle, MoreVertical, Trash2, Globe, Lock, Rocket } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';


export default function DashboardPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);


  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    setError(null);
    try {
      const userProjects = await getProjectsForUser(user.uid);
      console.log('userProjects', userProjects);
      setProjects(userProjects);
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setError(err.message || "An unknown error occurred. Please refresh the page.");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const openDeleteDialog = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDialogOpen(true);
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete || !user) return;
    setIsDeleting(true);
    setError(null);

    try {
      await deleteProject(user.uid, projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" has been removed.`,
      });
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleToggleVisibility = async (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const newVisibility = !project.isPublic;

    try {
        await updateProject(user.uid, project.id, { isPublic: newVisibility });
        toast({
            title: "Visibility Updated",
            description: `"${project.name}" is now ${newVisibility ? 'public' : 'private'}.`,
        });
        fetchProjects(); // Refresh the list to show the new state
    } catch (err: any) {
        console.error("Failed to update visibility:", err);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: err.message,
        });
    }
  };

  const currentPlanLimit = subscriptionPlan ? PLAN_LIMITS[subscriptionPlan] : PLAN_LIMITS.free;
  const projectsUsed = projects.length;
  const projectsRemaining = currentPlanLimit - projectsUsed;
  const usagePercentage = (projectsUsed / currentPlanLimit) * 100;
  const atLimit = projectsRemaining <= 0;


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
                Prompt Genius AI
            </h1>
         </Link>
        <UserNav />
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold font-headline">My Projects</h2>
          <Link href="/projects/new">
            <Button disabled={atLimit}>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {error && (
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could Not Load Projects</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )}

        {subscriptionPlan && (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="capitalize">{subscriptionPlan} Plan</CardTitle>
                    <CardDescription>You have created {projectsUsed} of {currentPlanLimit} available projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={usagePercentage} className="h-2" />
                </CardContent>
                {atLimit && (
                    <CardFooter>
                       <div className="w-full text-center text-sm text-muted-foreground mt-4">
                           You've reached your project limit.
                           <Link href="/#pricing" className="ml-1 text-primary hover:underline font-medium">
                               Upgrade your plan
                           </Link>
                           to create more.
                       </div>
                    </CardFooter>
                )}
            </Card>
        )}

        {loadingProjects ? (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card><CardHeader><div className="h-5 w-3/4 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
              <Card><CardHeader><div className="h-5 w-2/3 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
              <Card><CardHeader><div className="h-5 w-3/5 bg-muted rounded animate-pulse" /><CardDescription><div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-1" /></CardDescription></CardHeader></Card>
           </div>
        ) : projects.length === 0 && !error ? (
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
            {projects.map((project) => {
              const isOwner = project.roles[user.uid] === 'owner';
              return (
                <div key={project.id} className="relative">
                  <Link href={`/projects/${project.id}`} className="block group h-full">
                      <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all flex flex-col overflow-hidden">
                        {project.imageUrl ? (
                          <div className="relative w-full h-40">
                            <Image
                              src={project.imageUrl}
                              alt={project.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-40 w-full bg-secondary rounded-t-lg flex items-center justify-center">
                              <Logo className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col flex-grow p-6">
                            <CardTitle className="font-headline">{project.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-4 flex-grow">{project.idea}</p>
                        </div>
                      </Card>
                  </Link>
                  <div className="absolute top-3 right-3">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">Project options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            {isOwner && (
                                <>
                                    <DropdownMenuItem onClick={(e) => handleToggleVisibility(project, e)}>
                                        {project.isPublic ? (
                                            <><Lock className="mr-2 h-4 w-4" /><span>Make Private</span></>
                                        ) : (
                                            <><Globe className="mr-2 h-4 w-4" /><span>Make Public</span></>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => openDeleteDialog(project, e)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project <span className="font-bold">"{projectToDelete?.name}"</span> and all of its associated prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
