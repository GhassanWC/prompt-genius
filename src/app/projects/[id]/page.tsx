
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Project, type Prompt as PromptType, type Role } from '@/lib/projects';
import { getProject, getPromptsForProject, updatePromptStatus } from '@/lib/project-client';
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Users, Copy } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/share-dialog';

export default function ProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);

  const projectId = params.id as string;

  const fetchProjectData = useCallback(async () => {
    if (!projectId || !user) return;
    setError(null);
    try {
      const projectData = await getProject(user.uid, projectId);
      if (!projectData) {
        setError("Project not found or you don't have permission to view it.");
        setProject(null);
        setPrompts([]);
        setUserRole(null);
        return;
      }
      setProject(projectData);
      setUserRole(projectData.roles[user.uid]);

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

  const handleTogglePromptStatus = async (promptId: string, newStatus: boolean) => {
    if (!user || userRole === 'viewer') return;

    // Optimistic UI update
    const originalPrompts = [...prompts];
    setPrompts(prompts.map(p => p.id === promptId ? { ...p, isDone: newStatus } : p));

    try {
      await updatePromptStatus(user.uid, projectId, promptId, newStatus);
      toast({
        title: `Prompt marked as ${newStatus ? 'done' : 'not done'}`,
      });
    } catch (error: any) {
      // Revert on error
      setPrompts(originalPrompts);
      toast({
        variant: 'destructive',
        title: 'Error updating status',
        description: error.message || 'Could not update prompt status. Please try again.',
      });
    }
  };

  const handleCopyAll = () => {
    if (!project || prompts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Content to Copy',
        description: 'This project does not have an idea or any prompts yet.',
      });
      return;
    }

    let fullText = `Project Idea:\n${project.idea}\n\n`;
    fullText += '========================================\n\n';
    fullText += 'Development Plan:\n\n';

    const allPromptsText = prompts
      .map((p, index) => {
        let promptText = `--- Step ${index + 1}: ${p.title} ---\n\n`;
        promptText += `User Prompt:\n${p.userPrompt}`;

        if (p.acceptanceCriteria && p.acceptanceCriteria.length > 0) {
          promptText += `\n\nAcceptance Criteria:\n${p.acceptanceCriteria.map(ac => ` - ${ac}`).join('\n')}`;
        }
        return promptText;
      })
      .join('\n\n');
    
    fullText += allPromptsText;

    navigator.clipboard.writeText(fullText);
    toast({
      title: 'Project Copied!',
      description: 'The idea and all prompts are on your clipboard.',
    });
  };

  const canEdit = userRole === 'owner' || userRole === 'editor';

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
    <>
    <div className="min-h-screen bg-background text-foreground print:bg-white">
       <header className="container mx-auto px-4 py-4 flex justify-between items-center border-b print:hidden">
         <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
             <h1 className="font-headline text-xl font-bold tracking-tight hidden sm:block">
                PromptForge AI
            </h1>
         </Link>
        <UserNav />
      </header>

      <main className="container mx-auto px-4 pb-8 md:pb-16">
        <div className="my-6 flex justify-between items-center gap-4 print:hidden">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
               <Button variant="outline" onClick={handleCopyAll}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
              </Button>
               <Button variant="outline" onClick={() => window.print()}>
                  Export
              </Button>
              {userRole === 'owner' && (
                <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Share
                </Button>
              )}
              {canEdit && (
                <Link href={`/projects/${projectId}/edit`}>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Project
                  </Button>
                </Link>
              )}
            </div>
        </div>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mt-6">
          {project?.imageUrl && (
            <div className="relative w-full h-64 md:h-80 mb-8 rounded-xl overflow-hidden shadow-lg print:shadow-none print:h-auto print:aspect-video">
              <Image
                src={project.imageUrl}
                alt={project.name ?? 'Project image'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            {project?.name}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            {project?.idea}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto mt-12 print:mt-8">
            <div className="space-y-10">
              
              {prompts.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold font-headline text-center print:text-left">Development Plan</h3>
                  <div className="space-y-6 print:space-y-6">
                      {prompts.map((prompt, index) => (
                          <PromptCard 
                            key={prompt.id} 
                            {...prompt}
                            stepNumber={index + 1}
                            isReadOnly={!canEdit}
                            onStatusChange={handleTogglePromptStatus}
                          />
                      ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
    {project && user && userRole === 'owner' && (
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setShareDialogOpen}
        project={project}
        currentUser={user}
        onRolesChange={fetchProjectData}
      />
    )}
    </>
  );
}
