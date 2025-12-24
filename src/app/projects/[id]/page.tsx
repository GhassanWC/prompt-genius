
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Project, type Prompt as PromptType, type Role } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Users, Copy, Lock, Globe, Sparkles, Download, FileText } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { PromptCard } from '@/components/prompt-card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/share-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { auth } from '@/lib/firebase';
import { exportToMarkdown, downloadMarkdown } from '@/lib/export';

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
      // Pro tier users always have access - set immediately
      setHasExecutionFollowUpAccess(true);
      setCheckingAccess(false);

      // Verify via API in background (optional, for logging/debugging)
      // But don't override the access setting for pro users
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
              // Don't change hasExecutionFollowUpAccess - pro users should always have access
            }
            // For pro users, we keep access enabled regardless of API response
            // The button visibility is also checked via subscriptionPlan === 'pro' as a fallback
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

  const handleExportMarkdown = () => {
    if (!project || prompts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Export',
        description: 'This project does not have any prompts to export.',
      });
      return;
    }
    
    try {
      const markdown = exportToMarkdown(project, prompts);
      const filename = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      downloadMarkdown(markdown, filename);
      toast({
        title: 'Project exported',
        description: 'Your project has been exported as Markdown.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error.message || 'Could not export the project. Please try again.',
      });
    }
  };

  const handleExportPDF = () => {
    if (!project || prompts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Export',
        description: 'This project does not have any prompts to export.',
      });
      return;
    }
    
    try {
      // Use browser's print functionality for PDF export
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          variant: 'destructive',
          title: 'Export failed',
          description: 'Please allow pop-ups to export as PDF.',
        });
        return;
      }

      const markdown = exportToMarkdown(project, prompts);
      // Convert markdown to HTML (simple conversion)
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${project.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { margin-top: 30px; color: #444; }
            h3 { margin-top: 20px; color: #666; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            ul { padding-left: 20px; }
            hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[hul])/gm, '<p>')
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.endsWith('>')) {
                return line;
              }
              return line + '</p>';
            })
            .join('\n')
            .replace(/<p><\/p>/g, '')
            .replace(/---/g, '<hr>')}
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      toast({
        title: 'Opening PDF export',
        description: 'Use your browser\'s print dialog to save as PDF.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error.message || 'Could not export the project. Please try again.',
      });
    }
  };

  const canEdit = userRole === 'owner' || userRole === 'editor';

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#00171f]">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f] dark:text-white" />
      </div>
    );
  }

  if (error || !project) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#00171f] p-4">
             <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Cannot Load Project</AlertTitle>
              <AlertDescription className="font-medium">{error || "This project could not be found."}</AlertDescription>
            </Alert>
            <Link href={user ? "/dashboard" : "/"} className="mt-4">
                <Button variant="outline" className="border-gray-200 dark:border-gray-700 text-[#00171f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
                  {user ? 'Back to Dashboard' : 'Back to Home'}
                </Button>
            </Link>
        </div>
     );
  }
  
  return (
    <>
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user && <UserNav />}
            {!user && (
              <Link href="/login">
                <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-medium px-6 py-2 rounded-full transition-all duration-200">
                  Sign In
                </Button>
              </Link>
            )}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
        {/* Navigation section */}
        <div className="my-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={handleCopyAll}
              className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-[#00171f] dark:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
            <Button
              variant="outline"
              onClick={handleExportMarkdown}
              className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-[#00171f] dark:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export Markdown
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-[#00171f] dark:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            {userRole === 'owner' && (
              <Button 
                variant="outline" 
                onClick={() => setShareDialogOpen(true)}
                className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-[#00171f] dark:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <Users className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
            {canEdit && (
              <Link href={`/projects/${projectId}/edit`}>
                <Button 
                  variant="outline"
                  className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-[#00171f] dark:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
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
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active project
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f] dark:text-white">
                {project.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl">
                This page contains the AI role, original idea, and step‑by‑step prompts you can paste into any builder.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {project.imageUrl && (
                <div className="relative h-24 w-40 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-sm md:h-28 md:w-48">
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
                    ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f]'
                    : 'bg-gray-100 dark:bg-gray-900 text-[#00171f] dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {project.isPublic ? <Globe className="mr-1 h-3.5 w-3.5" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
                {project.isPublic ? 'Public project' : 'Private project'}
              </Badge>
            </div>
          </div>

          {/* Tabs for Project Info & Development Plan */}
          <Tabs defaultValue="project-info" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 h-auto w-full justify-start gap-0 mb-6">
              <TabsTrigger 
                value="project-info" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
              >
                Project Info & AI role
              </TabsTrigger>
              <TabsTrigger 
                value="development-plan" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
              >
                Development plan
                {prompts.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({prompts.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project-info" className="mt-0">
              {/* Overview: AI role + idea stacked */}
              <div className="flex flex-col gap-6">
                {project.aiRole && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold tracking-[0.15em] text-gray-500 dark:text-gray-400 uppercase">
                          AI Role
                        </h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                          Persona for your builder
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#00171f]"
                        onClick={handleCopyAiRole}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-900 px-4 py-3 max-h-[360px] overflow-y-auto border border-gray-100 dark:border-gray-800">
                      <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#00171f] dark:text-white leading-relaxed font-mono">
                        {project.aiRole}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-5 sm:p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-[0.15em] text-gray-500 dark:text-gray-400 uppercase">
                      Project Idea
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#00171f]"
                      onClick={handleCopyIdea}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm sm:text-base text-[#00171f] dark:text-white leading-relaxed">
                    {project.idea}
                  </p>
                </div>
              </div>

              {/* High-level summary */}
              <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-5 sm:p-6 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold tracking-[0.15em] text-gray-500 dark:text-gray-400 uppercase">
                    Project Summary
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#00171f]"
                    onClick={handleCopySummary}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {project.summary && project.summary.trim().length > 0 ? (
                  <p className="whitespace-pre-wrap text-sm sm:text-base text-[#00171f] dark:text-white leading-relaxed">
                    {project.summary}
                  </p>
                ) : (
                  <>
                    <p className="text-sm sm:text-base text-[#00171f] dark:text-white leading-relaxed mb-3">
                      This project, <span className="font-semibold">{project.name}</span>, turns the idea above into a
                      structured set of AI-ready build steps that you can paste into any coding assistant or app builder.
                    </p>
                    <p className="text-sm sm:text-base text-[#00171f] dark:text-white leading-relaxed mb-3">
                      The development plan currently contains{' '}
                      <span className="font-semibold">
                        {prompts.length} step{prompts.length === 1 ? '' : 's'}
                      </span>
                      , each one focused on a concrete feature or enhancement—such as specific screens, flows, API
                      endpoints, or behaviours—that together implement the full experience described in the idea.
                    </p>
                    <p className="text-sm sm:text-base text-[#00171f] dark:text-white leading-relaxed">
                      The AI role at the top gives any model clear instructions about how to behave (coding style,
                      architecture, security, performance, UX, and more), while each prompt in the plan is a single,
                      well-scoped action with acceptance criteria. This combination makes it easy for the AI to understand
                      what to build and in what order, without you needing to re-explain the project every time.
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="development-plan" className="mt-0">
              {/* Development plan */}
              <div className="w-full">
                {prompts.length > 0 ? (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold font-headline text-[#00171f] dark:text-white">
                          Development plan
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Follow these prompts in order. You can copy the whole plan or work step‑by‑step.
                        </p>
                      </div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
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
                  <div className="mt-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-10 text-center">
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                      This project doesn&apos;t have any prompts yet.
                    </p>
                    {canEdit && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Open the project editor to generate or add steps for your development plan.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
