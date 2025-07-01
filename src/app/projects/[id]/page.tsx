'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProject, getPromptsForProject, type Project, type Prompt as PromptType } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id;

  const fetchProjectData = useCallback(async () => {
    try {
      const projectData = await getProject(projectId);
      if (!projectData) {
        setError("Project not found.");
        return;
      }
      setProject(projectData);

      const promptsData = await getPromptsForProject(projectId);
      setPrompts(promptsData);

    } catch (e: any) {
      setError("Failed to load project data.");
    }
  }, [projectId]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if(user) {
        setLoading(true);
        fetchProjectData().finally(() => setLoading(false));
    }
  }, [user, authLoading, router, fetchProjectData]);

  const handlePromptUpdate = () => {
    toast({ title: "Refreshing prompts..."});
    fetchProjectData();
  }

  const frontendSteps = prompts.filter(p => p.phase === 'Frontend') || [];
  const backendSteps = prompts.filter(p => p.phase === 'Backend') || [];

  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
             <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Link href="/" className="mt-4">
                <Button variant="outline">Back to Projects</Button>
            </Link>
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

      <main className="container mx-auto px-4 pb-8 md:pb-16">
        <div className="my-6">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Projects
            </Link>
        </div>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            {project?.name}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            {project?.idea}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto mt-12">
            <div className="space-y-10">
              <div className="text-center p-6 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Recommended Stack</p>
                <h2 className="mt-2 text-3xl font-bold font-headline text-primary">{project?.stack}</h2>
              </div>
              
              {frontendSteps.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold font-headline text-center">Frontend Phase</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                      {frontendSteps.map((prompt) => (
                          <PromptCard 
                            key={prompt.id} 
                            projectId={projectId}
                            promptId={prompt.id}
                            onPromptUpdate={handlePromptUpdate}
                            {...prompt} 
                          />
                      ))}
                  </div>
                </div>
              )}
              
              {backendSteps.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold font-headline text-center">Backend Phase</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        {backendSteps.map((prompt) => (
                            <PromptCard 
                                key={prompt.id} 
                                projectId={projectId}
                                promptId={prompt.id}
                                onPromptUpdate={handlePromptUpdate}
                                {...prompt} 
                            />
                        ))}
                    </div>
                  </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
