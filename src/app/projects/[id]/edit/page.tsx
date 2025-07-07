
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Project, Prompt, Role } from '@/lib/projects';
import { updatePromptsOrder, addPrompt, updatePrompt, deletePrompt, updateProject, getProject, getPromptsForProject, getProjectRole } from '@/lib/project-client';
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
      const projectData = await getProject(user.uid, projectId);
      if (!projectData) {
        setError("Project not found or you don't have permission to view it.");
        return;
      }
      setProject(projectData);
      const role = await getProjectRole(user.uid, projectId);
      setUserRole(role);

      const promptsData = await getPromptsForProject(user.uid, projectId);
      setPrompts(promptsData);

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
      await updatePromptsOrder(user.uid, projectId, promptUpdates);
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
      if (promptData.id) {
        const { id, ...updateData } = promptData;
        await updatePrompt(user.uid, projectId, id, updateData);
        toast({ title: "Prompt Updated" });
      } else {
        await addPrompt(user.uid, projectId, promptData as Omit<Prompt, 'id' | 'order'>);
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
      await deletePrompt(user.uid, projectId, promptToDelete);
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
      await updateProject(user.uid, projectId, { name: data.name, idea: data.idea });
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
    <div className="min-h-screen bg-background text-foreground">
       <header className="container mx-auto px-4 py-4 flex justify-between items-center border-b">
         <Link href="/" className="flex items-center gap-2"><Logo className="h-8 w-8 text-primary" /><h1 className="font-headline text-xl font-bold tracking-tight hidden sm:block">PromptForge AI</h1></Link>
        <UserNav />
      </header>

      <main className="container mx-auto px-4 pb-8 md:pb-16">
        <div className="my-6">
            <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Link>
        </div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Edit Project</h1>
            <p className="mt-2 text-lg text-muted-foreground">{project?.name}</p>
          </div>
          <Button variant="outline" onClick={() => setIsProjectDetailsDialogOpen(true)} disabled={!canEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
          </Button>
        </div>
        
        {!canEdit && (
            <Alert variant="destructive" className="max-w-4xl mx-auto mt-8">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>View-Only Mode</AlertTitle>
                <AlertDescription>
                    You have view-only permissions for this project. You cannot make any changes.
                </AlertDescription>
            </Alert>
        )}

        <div className="max-w-4xl mx-auto mt-12 space-y-12">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-headline">Development Plan</h2>
                    {isPromptsOrderDirty && canEdit && <Button onClick={handleSaveOrder} disabled={isSavingPromptsOrder}><Save className="mr-2 h-4 w-4" />{isSavingPromptsOrder ? 'Saving...' : 'Save Prompt Order'}</Button>}
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} >
                    <div className="space-y-4">
                        <Card className="p-4">
                            <SortableContext items={prompts} strategy={verticalListSortingStrategy} disabled={!canEdit}>
                                {prompts.length > 0 ? prompts.map((p, index) => (
                                    <SortablePromptItem key={p.id} prompt={p} stepNumber={index + 1} onEdit={() => handleOpenPromptDialog(p)} onDelete={handleOpenDeleteDialog} isReadOnly={!canEdit} />
                                )) : <p className="text-muted-foreground text-center p-4">No prompts yet.</p>}
                            </SortableContext>
                        </Card>
                        <Button variant="outline" className="w-full" onClick={() => handleOpenPromptDialog(null)} disabled={!canEdit}><PlusCircle className="mr-2 h-4 w-4" />Add Prompt</Button>
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

      <PromptEditDialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen} prompt={currentPrompt} onSave={handleSavePrompt} />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this prompt. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
