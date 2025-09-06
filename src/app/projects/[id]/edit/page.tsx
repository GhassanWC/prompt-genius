
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Project, Prompt, Role } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, PlusCircle, Save, Edit, ShieldAlert } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DndContext, closestCenter, type DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePromptItem } from '@/components/sortable-prompt-item';
import { PromptEditDialog } from '@/components/prompt-edit-dialog';
import { ProjectEditDialog } from '@/components/project-edit-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { auth } from '@/lib/firebase';

type FeatureKey =
  | 'projectLimit'
  | 'fullPromptGeneration'
  | 'publicProjects'
  | 'communityAccess'
  | 'aiPromptEnhancement'
  | 'support';

async function isFeatureEnabled(userId: string, feature: FeatureKey): Promise<boolean> {
  const res = await fetch('/api/subscription/features', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Important: disable caching for “current” entitlement checks
    cache: 'no-store',
    body: JSON.stringify({ userId, feature }),
  });

  if (!res.ok) return false;
  const data: { enabled: boolean } = await res.json();
  return data.enabled === true;
}

export default function EditProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isPromptsOrderDirty, setIsPromptsOrderDirty] = useState(false);
  const [isSavingPromptsOrder, setIsSavingPromptsOrder] = useState(false);

  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt> | null>(null);

  const [isProjectDetailsDialogOpen, setIsProjectDetailsDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const projectId = params.id as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const canEdit = userRole === 'owner' || userRole === 'editor';

  const fetchProjectData = useCallback(async () => {
    if (!projectId || !user) return;
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
      if (res.status === 404) {
        setError("Project not found or you don't have permission to view it.");
        setProject(null);
        setPrompts([]);
        setUserRole(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const {project}  = await res.json();
      if (!project) {
        setError("Project not found or you don't have permission to view it.");
        return;
      }
      setProject(project);
      const role = project.roles[user.uid] || null;
      setUserRole(role);
      const result = await fetch(
        `/api/projects?projectId=${encodeURIComponent(projectId)}&prompts=true`,
        { method: 'GET', 
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store' 
        }
      );
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      const promptsData = await result.json();
      setPrompts(promptsData.prompts);

    } catch (e: any) {
      setError(e.message || "Failed to load project data.");
    } finally {
      setLoading(false);
      setIsPromptsOrderDirty(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if(user) {
        fetchProjectData();
    }
  }, [user, authLoading, router, fetchProjectData]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPrompts((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over!.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    setIsPromptsOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    if (!user || !canEdit) return;
    setIsSavingPromptsOrder(true);
    try {
      const promptUpdates = prompts.map((p, index) => ({ id: p.id, order: index }));
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'reorderPrompts', projectId, prompts:promptUpdates }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast({ title: 'Success', description: 'Prompt order has been saved.' });
      setIsPromptsOrderDirty(false);
    } catch (error: any) {
      setError(error.message || 'Failed to save order.');
    } finally {
      setIsSavingPromptsOrder(false);
    }
  };
  
  const handleOpenPromptDialog = (prompt: Partial<Prompt> | null) => {
    if (!canEdit) return;
    setCurrentPrompt(prompt);
    setIsPromptDialogOpen(true);
  };

  const handleSavePrompt = async (promptData: Partial<Prompt>) => {
    if (!user || !canEdit) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (promptData.id) {
        const { id, ...updateData } = promptData;
        const res = await fetch('/api/projects', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'updatePrompt', projectId, promptId:id, data:updateData }),
        });
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        toast({ title: "Prompt Updated" });
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'addPrompt', projectId, prompt:promptData }),
        });
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        toast({ title: "Prompt Added" });
      }
      fetchProjectData();
    } catch (error: any)
{
      setError(error.message || "Failed to save prompt.");
    }
  };

  const handleOpenDeleteDialog = (promptId: string) => {
    if (!canEdit) return;
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleDeletePrompt = async () => {
    if (!user || !promptToDelete || !canEdit) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'deletePrompt', projectId, promptId:promptToDelete }),
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: 'Prompt Deleted' });
      fetchProjectData(); // Refresh list
    } catch (error: any) {
      setError(error.message || "Failed to delete prompt.");
    } finally {
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleSaveProjectDetails = async (data: { name: string, idea: string }) => {
    if (!user || !project || !canEdit) return;
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'updateProject', projectId, data:{ name: data.name, idea: data.idea } }),
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Project Updated", description: "Your project details have been saved." });
      fetchProjectData(); // Refreshes the project data on the page
    } catch (e: any) {
      setError(e.message || "Failed to update project details.");
      throw e; // Re-throw to allow dialog to handle its loading state
    }
  };


  if (loading || authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (error) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-2xl mx-auto"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            <Link href="/" className="mt-4"><Button variant="outline">Back to Projects</Button></Link>
        </div>
     );
  }
  
  return (
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
          <Link href="/" className="flex items-center gap-0 font-bold group">
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
          <UserNav />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
        {/* Enhanced navigation section */}
        <div className="my-8">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Project
          </Link>
        </div>

        {/* Enhanced header section */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 mb-8">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
              Edit Project
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-slate-600 font-medium">{project?.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsProjectDetailsDialogOpen(true)} 
            disabled={!canEdit}
            className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        </div>
        
        {!canEdit && (
          <Alert variant="destructive" className="max-w-4xl mx-auto mb-8 bg-red-50 border-red-200 text-red-800 rounded-2xl">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">View-Only Mode</AlertTitle>
            <AlertDescription className="font-medium">
              You have view-only permissions for this project. You cannot make any changes.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced content section */}
        <div className="max-w-4xl mx-auto mt-12 space-y-12">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                Development Plan
              </h2>
              {isPromptsOrderDirty && canEdit && (
                <Button 
                  onClick={handleSaveOrder} 
                  disabled={isSavingPromptsOrder}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold px-6 py-3 rounded-full transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingPromptsOrder ? 'Saving...' : 'Save Prompt Order'}
                </Button>
              )}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden p-6">
                  <SortableContext items={prompts} strategy={verticalListSortingStrategy} disabled={!canEdit}>
                    {prompts.length > 0 ? (
                      <div className="space-y-4">
                        {prompts.map((p, index) => (
                          <SortablePromptItem 
                            key={p.id} 
                            prompt={p} 
                            stepNumber={index + 1} 
                            onEdit={() => handleOpenPromptDialog(p)} 
                            onDelete={handleOpenDeleteDialog} 
                            isReadOnly={!canEdit} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50">
                        <p className="text-slate-600 font-medium">No prompts yet.</p>
                      </div>
                    )}
                  </SortableContext>
                </Card>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-4 rounded-xl transition-all duration-200 hover:shadow-lg" 
                  onClick={() => handleOpenPromptDialog(null)} 
                  disabled={!canEdit}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Prompt
                </Button>
              </div>
            </DndContext>
          </div>
        </div>
      </main>

      <ProjectEditDialog 
        open={isProjectDetailsDialogOpen} 
        onOpenChange={setIsProjectDetailsDialogOpen} 
        project={project} 
        onSave={handleSaveProjectDetails}
        isReadOnly={!canEdit}
      />

      <PromptEditDialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen} prompt={currentPrompt} userId={user.uid} onSave={handleSavePrompt} />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-800">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium leading-relaxed">
              This will permanently delete this prompt. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePrompt} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-xl shadow-red-500/25 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
