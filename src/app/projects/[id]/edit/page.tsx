
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
      fetchProjectData();
    } catch (error: any) {
      setError(error.message || "Failed to delete prompt.");
    } finally {
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleSaveProjectDetails = async (data: { name: string; idea: string; aiRole: string; summary: string }) => {
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
        body: JSON.stringify({
          action: 'updateProject',
          projectId,
          data: { name: data.name, idea: data.idea, aiRole: data.aiRole, summary: data.summary },
        }),
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Project Updated", description: "Your project details have been saved." });
      fetchProjectData();
    } catch (e: any) {
      setError(e.message || "Failed to update project details.");
      throw e;
    }
  };


  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f]" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
            <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-50 border-red-200 text-red-800 rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
            <Link href="/" className="mt-4">
              <Button variant="outline" className="border-gray-200 text-[#00171f] hover:bg-gray-50">
                Back to Projects
              </Button>
            </Link>
        </div>
     );
  }
  
  return (
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
          <Link href="/" className="flex items-center gap-0 font-bold group">
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
          <UserNav />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
        {/* Navigation section */}
        <div className="my-8">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-gray-600 hover:text-[#00171f] transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Project
          </Link>
        </div>

        {/* Header section */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 mb-6">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f]">
              Edit Project
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-gray-600 font-medium">{project?.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsProjectDetailsDialogOpen(true)} 
            disabled={!canEdit}
            className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#00171f] font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-md"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        </div>

        {/* Project details preview: AI role + idea + summary */}
        {project && (
          <section className="max-w-4xl mx-auto space-y-4 mb-8">
            {project.aiRole && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                    AI Role
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    Persona for your builder
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3 max-h-64 overflow-y-auto border border-gray-100">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#00171f] leading-relaxed font-mono">
                    {project.aiRole}
                  </pre>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                Project Idea
              </h2>
              <p className="text-sm sm:text-base text-[#00171f] leading-relaxed">
                {project.idea}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                Project Summary
              </h2>
              <p className="whitespace-pre-wrap text-sm sm:text-base text-[#00171f] leading-relaxed">
                {project.summary && project.summary.trim().length > 0
                  ? project.summary
                  : 'You can add an editable summary in the Edit Details dialog. It will appear under the AI role and idea on the project page.'}
              </p>
            </div>
          </section>
        )}
        
        {!canEdit && (
          <Alert variant="destructive" className="max-w-4xl mx-auto mb-8 bg-red-50 border-red-200 text-red-800 rounded-2xl">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">View-Only Mode</AlertTitle>
            <AlertDescription className="font-medium">
              You have view-only permissions for this project. You cannot make any changes.
            </AlertDescription>
          </Alert>
        )}

        {/* Content section */}
        <div className="max-w-4xl mx-auto mt-12 space-y-12">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#00171f]">
                Development Plan
              </h2>
              {isPromptsOrderDirty && canEdit && (
                <Button 
                  onClick={handleSaveOrder} 
                  disabled={isSavingPromptsOrder}
                  className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold px-6 py-3 rounded-full transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingPromptsOrder ? 'Saving...' : 'Save Prompt Order'}
                </Button>
              )}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden p-6">
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
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <p className="text-gray-600 font-medium">No prompts yet.</p>
                      </div>
                    )}
                  </SortableContext>
                </Card>
                <Button 
                  variant="outline" 
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#00171f] font-medium py-4 rounded-xl transition-all duration-200 hover:shadow-md" 
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
        userId={user.uid}
      />

      <PromptEditDialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen} prompt={currentPrompt} userId={user.uid} onSave={handleSavePrompt} />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-[#00171f]">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 font-medium leading-relaxed">
              This will permanently delete this prompt. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePrompt} 
              className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/25 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
