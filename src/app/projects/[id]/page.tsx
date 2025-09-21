
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Project, type Prompt as PromptType, type Role } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Users, Copy, Lock, Globe } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/share-dialog';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';

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
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Pass user?.uid which can be null if logged out
      // const projectData = await getProject(user?.uid || null, projectId);
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch(`/api/projects?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (res.status === 404){
        setError("This project could not be found. It may be private or have been deleted.");
        setProject(null);
        setPrompts([]);
        setUserRole(null);
        return;
      };
      if (!res.ok) {
        throw new Error(`Error fetching project: ${res.statusText}`);
      }
      const {project}  = await res.json();
      if (!project) {
        setError("This project could not be found. It may be private or have been deleted.");
        setProject(null);
        setPrompts([]);
        setUserRole(null);
        return;
      }
      setProject(project);
      setUserRole(user ? project.roles[user.uid] : null);

      // const promptsData = await getPromptsForProject(user?.uid || null, projectId);
      const url = `/api/projects?projectId=${encodeURIComponent(projectId)}&prompts=true`;
      const result = await fetch(url, {
        method: 'GET',
        headers:  {...(token ? { Authorization: `Bearer ${token}` } : {})},
        cache: 'no-store',
      });
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      const promptsData  = await result.json();
      setPrompts(promptsData.prompts);

    } catch (e: any) {
      console.error("Error fetching project data:", e);
      setError(e.message || "An unexpected error occurred while loading the project. Please try again later.");
    } finally {
        setLoading(false);
    }
  }, [projectId, user]);


  useEffect(() => {
    // We don't redirect if the user is not logged in, because they might be viewing a public project.
    // The fetchProjectData function handles access control.
    if (!authLoading) {
        fetchProjectData();
    }
  }, [authLoading, fetchProjectData]);

  const handleTogglePromptStatus = async (promptId: string, newStatus: boolean) => {
    if (!user || userRole === 'viewer') return;

    // Optimistic UI update
    const originalPrompts = [...prompts];
    setPrompts(prompts.map(p => p.id === promptId ? { ...p, isDone: newStatus } : p));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'updatePromptStatus',
          projectId,
          promptId,
          isDone:newStatus,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { ok } = await res.json();
      if(!ok) throw new Error('Failed to update prompt status');
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
             <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cannot Load Project</AlertTitle>
              <AlertDescription>{error || "This project could not be found."}</AlertDescription>
            </Alert>
            <Link href={user ? "/dashboard" : "/"} className="mt-4">
                <Button variant="outline">{user ? 'Back to Dashboard' : 'Back to Home'}</Button>
            </Link>
        </div>
     );
  }
  
  return (
    <>
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
            <img
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
          {user && <UserNav />}
          {!user && <Link href="/login"><Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">Sign In</Button></Link>}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
        {/* Enhanced navigation section */}
        <div className="my-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCopyAll}
              className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
            {userRole === 'owner' && (
              <Button 
                variant="outline" 
                onClick={() => setShareDialogOpen(true)}
                className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
            {canEdit && (
              <Link href={`/projects/${projectId}/edit`}>
                <Button 
                  variant="outline"
                  className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced project header */}
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mt-8 sm:mt-12">
          {project.imageUrl && (
            <div className="relative w-full h-64 md:h-80 mb-10 rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
              <Image
                src={project.imageUrl}
                alt={project.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <Badge 
              variant={project.isPublic ? "default" : "secondary"} 
              className={`text-base font-semibold px-4 py-2 rounded-full ${
                project.isPublic 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25'
              }`}
            >
              {project.isPublic ? <Globe className="mr-2 h-4 w-4"/> : <Lock className="mr-2 h-4 w-4"/>}
              {project.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl">
            {project.idea}
          </p>
        </div>
        
        {/* Enhanced content section */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-20">
          <div className="space-y-12">
            
            {prompts.length > 0 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold font-headline bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                    Development Plan
                  </h3>
                  <div className="mt-4 h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60" />
                </div>
                <div className="space-y-8">
                  {prompts.map((prompt, index) => (
                    <div key={prompt.id} className="relative">
                      <PromptCard 
                        {...prompt}
                        stepNumber={index + 1}
                        isReadOnly={!canEdit}
                        onStatusChange={handleTogglePromptStatus}
                      />
                    </div>
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
