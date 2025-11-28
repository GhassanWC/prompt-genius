
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

    let fullText = '';

    if (project.aiRole) {
      fullText += `AI Role:\n${project.aiRole}\n\n`;
    }

    fullText += `Project Idea:\n${project.idea}\n\n`;
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

  const handleCopyAiRole = () => {
    if (!project?.aiRole) return;
    navigator.clipboard.writeText(project.aiRole);
    toast({
      title: 'AI role copied',
      description: 'The AI persona has been copied to your clipboard.',
    });
  };

  const handleCopyIdea = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.idea);
    toast({
      title: 'Project idea copied',
      description: 'The project idea has been copied to your clipboard.',
    });
  };

  const handleCopySummary = () => {
    if (!project) return;
    const text =
      project.summary && project.summary.trim().length > 0
        ? project.summary
        : `Project: ${project.name}\n\nIdea:\n${project.idea}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Project summary copied',
      description: 'The summary text has been copied to your clipboard.',
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

        {/* Project hero + summary */}
        <section className="max-w-5xl mx-auto mt-8 sm:mt-12 space-y-8">
          {/* Hero */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active project
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                This page contains the AI role, original idea, and step‑by‑step prompts you can paste into any builder.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {project.imageUrl && (
                <div className="relative h-24 w-40 overflow-hidden rounded-2xl border border-white/60 bg-slate-100 shadow-md shadow-slate-300/50 md:h-28 md:w-48">
                  <Image
                    src={project.imageUrl}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Badge
                variant={project.isPublic ? 'default' : 'secondary'}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  project.isPublic
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md shadow-slate-600/30'
                }`}
              >
                {project.isPublic ? <Globe className="mr-1 h-3.5 w-3.5" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
                {project.isPublic ? 'Public project' : 'Private project'}
              </Badge>
            </div>
          </div>

          {/* Overview: AI role + idea stacked */}
          <div className="flex flex-col gap-6">
            {project.aiRole && (
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 sm:p-6 shadow-lg shadow-slate-200/80">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      AI Role (persona for your builder)
                    </h2>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Shown first when you copy everything
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white"
                    onClick={handleCopyAiRole}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 max-h-[360px] overflow-y-auto ring-1 ring-slate-100">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-slate-800 leading-relaxed font-mono">
                    {project.aiRole}
                  </pre>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 sm:p-6 shadow-lg shadow-slate-200/80">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Project Idea
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white"
                  onClick={handleCopyIdea}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {project.idea}
              </p>
            </div>
          </div>

          {/* High-level summary */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-5 sm:p-6 shadow-lg shadow-slate-200/80">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Project Summary
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white"
                onClick={handleCopySummary}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {project.summary && project.summary.trim().length > 0 ? (
              <p className="whitespace-pre-wrap text-sm sm:text-base text-slate-700 leading-relaxed">
                {project.summary}
              </p>
            ) : (
              <>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
                  This project, <span className="font-semibold">{project.name}</span>, turns the idea above into a
                  structured set of AI-ready build steps that you can paste into any coding assistant or app builder.
                </p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
                  The development plan currently contains{' '}
                  <span className="font-semibold">
                    {prompts.length} step{prompts.length === 1 ? '' : 's'}
                  </span>
                  , each one focused on a concrete feature or enhancement—such as specific screens, flows, API
                  endpoints, or behaviours—that together implement the full experience described in the idea.
                </p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  The AI role at the top gives any model clear instructions about how to behave (coding style,
                  architecture, security, performance, UX, and more), while each prompt in the plan is a single,
                  well-scoped action with acceptance criteria. This combination makes it easy for the AI to understand
                  what to build and in what order, without you needing to re-explain the project every time.
                </p>
              </>
            )}
          </div>
        </section>
        
        {/* Development plan */}
        <section className="max-w-5xl mx-auto mt-14 sm:mt-18">
          {prompts.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-headline bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                    Development plan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Follow these prompts in order. You can copy the whole plan or work step‑by‑step.
                  </p>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {prompts.length} step{prompts.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="space-y-6">
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
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center shadow-sm">
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                This project doesn&apos;t have any prompts yet.
              </p>
              {canEdit && (
                <p className="mt-2 text-xs text-slate-500">
                  Open the project editor to generate or add steps for your development plan.
                </p>
              )}
            </div>
          )}
        </section>
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
