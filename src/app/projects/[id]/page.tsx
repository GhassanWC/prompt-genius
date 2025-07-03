'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProject, getPromptsForProject, type Project, type Prompt as PromptType } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Copy, Check } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';

export default function ProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frontendMagicCopied, setFrontendMagicCopied] = useState(false);
  const [backendMagicCopied, setBackendMagicCopied] = useState(false);

  const projectId = params.id as string;

  const fetchProjectData = useCallback(async () => {
    if (!projectId || !user) return;
    setError(null);
    try {
      const projectData = await getProject(user.uid, projectId);
      if (!projectData) {
        setError("Project not found or you don't have permission to view it.");
        return;
      }
      setProject(projectData);

      const promptsData = await getPromptsForProject(user.uid, projectId);
      setPrompts(promptsData);

    } catch (e: any) {
      console.error("Error fetching project data:", e);
      if (e.code === 'permission-denied') {
        setError("Permission Denied: Your security rules are blocking access.");
      } else if (e.code === 'failed-precondition') {
        setError("Database Index Required: This query requires a Firestore index. Check the developer console for a link to create it.");
      } else {
        setError(e.message || "Failed to load project data. Please try again later.");
      }
    }
  }, [projectId, user]);


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

  const handleCopyMagic = (text: string, type: 'frontend' | 'backend') => {
    navigator.clipboard.writeText(text);
    if (type === 'frontend') {
      setFrontendMagicCopied(true);
      setTimeout(() => setFrontendMagicCopied(false), 2500);
    } else {
      setBackendMagicCopied(true);
      setTimeout(() => setBackendMagicCopied(false), 2500);
    }
    toast({
      title: "Combined Prompt Copied!",
      description: `The combined ${type} prompt is on your clipboard.`,
    });
  };

  const frontendSteps = prompts.filter(p => p.phase === 'Frontend') || [];
  const backendSteps = prompts.filter(p => p.phase === 'Backend') || [];

  const frontendMagicPrompt = frontendSteps
    .map((p, index) => `--- Step ${index + 1}: ${p.title} ---\n\n${p.prompt}`)
    .join('\n\n');

  const backendMagicPrompt = backendSteps
    .map((p, index) => `--- Step ${index + 1}: ${p.title} ---\n\n${p.prompt}`)
    .join('\n\n');

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
            <Link href="/dashboard" className="mt-4">
                <Button variant="outline">Back to Dashboard</Button>
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
        <div className="my-6 flex justify-between items-center">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
            <Link href={`/projects/${projectId}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
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
                  <Accordion type="single" collapsible className="w-full bg-card border rounded-lg">
                    <AccordionItem value="item-1" className="border-b-0">
                      <AccordionTrigger className="px-4 hover:no-underline">Show Combined Frontend Prompt</AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="relative">
                          <Textarea
                            readOnly
                            value={frontendMagicPrompt}
                            className="h-64 font-code text-sm bg-muted"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleCopyMagic(frontendMagicPrompt, 'frontend')}
                          >
                            {frontendMagicCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="grid gap-6 md:grid-cols-2">
                      {frontendSteps.map((prompt) => (
                          <PromptCard 
                            key={prompt.id} 
                            {...prompt} 
                          />
                      ))}
                  </div>
                </div>
              )}
              
              {backendSteps.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold font-headline text-center">Backend Phase</h3>
                    <Accordion type="single" collapsible className="w-full bg-card border rounded-lg">
                      <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="px-4 hover:no-underline">Show Combined Backend Prompt</AccordionTrigger>
                        <AccordionContent className="px-4">
                          <div className="relative">
                            <Textarea
                              readOnly
                              value={backendMagicPrompt}
                              className="h-64 font-code text-sm bg-muted"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => handleCopyMagic(backendMagicPrompt, 'backend')}
                            >
                              {backendMagicCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="grid gap-6 md:grid-cols-2">
                        {backendSteps.map((prompt) => (
                            <PromptCard 
                                key={prompt.id} 
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
