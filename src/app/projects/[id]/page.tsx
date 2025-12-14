
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Project, type Prompt as PromptType, type Role } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Users, Copy, Lock, Globe, Sparkles } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/share-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { auth } from '@/lib/firebase';

export default function ProjectPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [hasExecutionFollowUpAccess, setHasExecutionFollowUpAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const projectId = params.id as string;

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
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
    if (!authLoading) {
        fetchProjectData();
    }
  }, [authLoading, fetchProjectData]);

  // Check if user has access to execution follow-up agent
  useEffect(() => {
    if (authLoading) {
      setCheckingAccess(true);
      return;
    }

    if (!user) {
      setHasExecutionFollowUpAccess(false);
      setCheckingAccess(false);
      return;
    }

    // If user is on pro tier, they have access
    // We verify via API but also fallback to subscriptionPlan check
    const isProTier = subscriptionPlan === 'pro';
    
    if (isProTier) {
      // Optimistically set to true since user is on pro tier
      setHasExecutionFollowUpAccess(true);
      setCheckingAccess(false);

      // Verify via API in background (optional, for logging/debugging)
      (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/subscription/features', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
            body: JSON.stringify({ 
              userId: user.uid, 
              feature: 'executionFollowUpAgent' 
            }),
          });

          if (res.ok) {
            const data: { enabled: boolean } = await res.json();
            if (!data.enabled) {
              console.warn('[Execution Follow-Up] User is on pro tier but feature flag is disabled in Firebase. Please update the tier document.');
            }
            setHasExecutionFollowUpAccess(data.enabled === true);
          }
        } catch (error) {
          console.error('[Execution Follow-Up] Error verifying feature access:', error);
          // Keep access enabled since user is on pro tier
        }
      })();
    } else {
      setHasExecutionFollowUpAccess(false);
      setCheckingAccess(false);
    }
  }, [user, subscriptionPlan, authLoading]);

  const handleTogglePromptStatus = async (promptId: string, newStatus: boolean) => {
    if (!user || userRole === 'viewer') return;

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f]" />
      </div>
    );
  }

  if (error || !project) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
             <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-50 border-red-200 text-red-800 rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Cannot Load Project</AlertTitle>
              <AlertDescription className="font-medium">{error || "This project could not be found."}</AlertDescription>
            </Alert>
            <Link href={user ? "/dashboard" : "/"} className="mt-4">
                <Button variant="outline" className="border-gray-200 text-[#00171f] hover:bg-gray-50">
                  {user ? 'Back to Dashboard' : 'Back to Home'}
                </Button>
            </Link>
        </div>
     );
  }
  
  return (
    <>
    <div className="min-h-screen bg-white text-[#00171f] relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          {user && <UserNav />}
          {!user && (
            <Link href="/login">
              <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-medium px-6 py-2 rounded-full transition-all duration-200">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
        {/* Navigation section */}
        <div className="my-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm text-gray-600 hover:text-[#00171f] transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCopyAll}
              className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#00171f] font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
            {userRole === 'owner' && (
              <Button 
                variant="outline" 
                onClick={() => setShareDialogOpen(true)}
                className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#00171f] font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <Users className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
            {canEdit && (
              <Link href={`/projects/${projectId}/edit`}>
                <Button 
                  variant="outline"
                  className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#00171f] font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
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
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active project
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f]">
                {project.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl">
                This page contains the AI role, original idea, and step‑by‑step prompts you can paste into any builder.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {project.imageUrl && (
                <div className="relative h-24 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm md:h-28 md:w-48">
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
                    ? 'bg-[#00171f] text-white'
                    : 'bg-gray-100 text-[#00171f] border border-gray-200'
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
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
                      AI Role
                    </h2>
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      Persona for your builder
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-gray-200 text-gray-500 hover:text-[#00171f] hover:border-gray-300 bg-white"
                    onClick={handleCopyAiRole}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3 max-h-[360px] overflow-y-auto border border-gray-100">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#00171f] leading-relaxed font-mono">
                    {project.aiRole}
                  </pre>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
                  Project Idea
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-gray-200 text-gray-500 hover:text-[#00171f] hover:border-gray-300 bg-white"
                  onClick={handleCopyIdea}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-sm sm:text-base text-[#00171f] leading-relaxed">
                {project.idea}
              </p>
            </div>
          </div>

          {/* High-level summary */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                Project Summary
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-gray-200 text-gray-500 hover:text-[#00171f] hover:border-gray-300 bg-white"
                onClick={handleCopySummary}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {project.summary && project.summary.trim().length > 0 ? (
              <p className="whitespace-pre-wrap text-sm sm:text-base text-[#00171f] leading-relaxed">
                {project.summary}
              </p>
            ) : (
              <>
                <p className="text-sm sm:text-base text-[#00171f] leading-relaxed mb-3">
                  This project, <span className="font-semibold">{project.name}</span>, turns the idea above into a
                  structured set of AI-ready build steps that you can paste into any coding assistant or app builder.
                </p>
                <p className="text-sm sm:text-base text-[#00171f] leading-relaxed mb-3">
                  The development plan currently contains{' '}
                  <span className="font-semibold">
                    {prompts.length} step{prompts.length === 1 ? '' : 's'}
                  </span>
                  , each one focused on a concrete feature or enhancement—such as specific screens, flows, API
                  endpoints, or behaviours—that together implement the full experience described in the idea.
                </p>
                <p className="text-sm sm:text-base text-[#00171f] leading-relaxed">
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
        <section className="w-full mt-14 sm:mt-18 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          {prompts.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-headline text-[#00171f]">
                    Development plan
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Follow these prompts in order. You can copy the whole plan or work step‑by‑step.
                  </p>
                </div>
                <p className="text-xs font-medium text-gray-500">
                  {prompts.length} step{prompts.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {prompts.map((prompt, index) => (
                  <div key={prompt.id}>
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
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                This project doesn&apos;t have any prompts yet.
              </p>
              {canEdit && (
                <p className="mt-2 text-xs text-gray-500">
                  Open the project editor to generate or add steps for your development plan.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Floating Execution Follow-Up Agent Button */}
      {/* Show button if user is on pro tier (either via API check or subscriptionPlan check) */}
      {!checkingAccess && (hasExecutionFollowUpAccess || subscriptionPlan === 'pro') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/execution-follow-up">
                <Button
                  className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#00171f] hover:bg-[#00171f]/90 text-white shadow-2xl shadow-[#00171f]/30 hover:shadow-[#00171f]/40 border-0 transition-all duration-300 hover:scale-110 group"
                  size="icon"
                >
                  <Sparkles className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#00171f] text-white border-0 shadow-lg">
              <p className="font-medium">Execution Follow-Up Agent</p>
              <p className="text-xs text-white/80 mt-1">Repair prompts when AI doesn&apos;t follow instructions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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
