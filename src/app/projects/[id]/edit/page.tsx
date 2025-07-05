'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProject, getPromptsForProject, type Project, type Prompt, updatePromptsOrder, addPrompt, updatePrompt, deletePrompt } from '@/lib/projects';
import { Loader2, ArrowLeft, AlertTriangle, PlusCircle, Save, GripVertical } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DndContext, closestCenter, type DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePromptItem } from '@/components/sortable-prompt-item';
import { PromptEditDialog } from '@/components/prompt-edit-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function EditProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [frontendPrompts, setFrontendPrompts] = useState<Prompt[]>([]);
  const [backendPrompts, setBackendPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt> | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const projectId = params.id as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

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

      const promptsData = await getPromptsForProject(user.uid, projectId);
      setFrontendPrompts(promptsData.filter(p => p.phase === 'Frontend'));
      setBackendPrompts(promptsData.filter(p => p.phase === 'Backend'));

    } catch (e: any) {
      setError(e.message || "Failed to load project data.");
    } finally {
      setLoading(false);
      setIsDirty(false);
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
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isFrontend = frontendPrompts.some(p => p.id === active.id);
    const isBackend = backendPrompts.some(p => p.id === active.id);

    if (isFrontend) {
      const overIsFrontend = frontendPrompts.some(p => p.id === over.id);
      if (!overIsFrontend) return;
      setFrontendPrompts((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over!.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsDirty(true);
    } else if (isBackend) {
      const overIsBackend = backendPrompts.some(p => p.id === over.id);
      if (!overIsBackend) return;
      setBackendPrompts((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over!.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsDirty(true);
    }
  };

  const handleSaveOrder = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const frontendUpdates = frontendPrompts.map((p, index) => ({ id: p.id, order: index }));
      const backendUpdates = backendPrompts.map((p, index) => ({ id: p.id, order: index }));
      await updatePromptsOrder(user.uid, projectId, [...frontendUpdates, ...backendUpdates]);
      toast({ title: 'Success', description: 'Prompt order has been saved.' });
      setIsDirty(false);
    } catch (error: any) {
      setError(error.message || 'Failed to save order.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenDialog = (prompt: Partial<Prompt> | null, phase?: 'Frontend' | 'Backend') => {
    setCurrentPrompt(prompt ? prompt : { phase });
    setDialogOpen(true);
  };

  const handleSavePrompt = async (promptData: Partial<Prompt>) => {
    if (!user) return;
    try {
      if (promptData.id) { // Editing existing prompt
        const { id, projectId, ...updateData } = promptData;
        await updatePrompt(user.uid, projectId!, id, updateData);
        toast({ title: "Prompt Updated" });
      } else { // Adding new prompt
        await addPrompt(user.uid, projectId, promptData as Omit<Prompt, 'id' | 'projectId' | 'order'>);
        toast({ title: "Prompt Added" });
      }
      fetchProjectData();
    } catch (error: any) {
      setError(error.message || "Failed to save prompt.");
    }
  };

  const handleOpenDeleteDialog = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleDeletePrompt = async () => {
    if (!user || !promptToDelete) return;
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
        <div className="my-6 flex justify-between items-center">
            <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Link>
            {isDirty && <Button onClick={handleSaveOrder} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : 'Save Order'}</Button>}
        </div>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Edit Prompts</h1>
          <p className="mt-2 text-lg text-muted-foreground">{project?.name}</p>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold font-headline text-center">Frontend Phase</h3>
                    <Card className="p-4">
                        <SortableContext items={frontendPrompts} strategy={verticalListSortingStrategy}>
                            {frontendPrompts.length > 0 ? frontendPrompts.map(p => (
                                <SortablePromptItem key={p.id} prompt={p} onEdit={() => handleOpenDialog(p)} onDelete={handleOpenDeleteDialog} />
                            )) : <p className="text-muted-foreground text-center p-4">No frontend prompts yet.</p>}
                        </SortableContext>
                    </Card>
                    <Button variant="outline" className="w-full" onClick={() => handleOpenDialog(null, 'Frontend')}><PlusCircle className="mr-2 h-4 w-4" />Add Frontend Prompt</Button>
                </div>
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold font-headline text-center">Backend Phase</h3>
                    <Card className="p-4">
                       <SortableContext items={backendPrompts} strategy={verticalListSortingStrategy}>
                            {backendPrompts.length > 0 ? backendPrompts.map(p => (
                                <SortablePromptItem key={p.id} prompt={p} onEdit={() => handleOpenDialog(p)} onDelete={handleOpenDeleteDialog}/>
                            )) : <p className="text-muted-foreground text-center p-4">No backend prompts yet.</p>}
                        </SortableContext>
                    </Card>
                    <Button variant="outline" className="w-full" onClick={() => handleOpenDialog(null, 'Backend')}><PlusCircle className="mr-2 h-4 w-4" />Add Backend Prompt</Button>
                </div>
            </div>
        </DndContext>
      </main>

      <PromptEditDialog open={dialogOpen} onOpenChange={setDialogOpen} prompt={currentPrompt} onSave={handleSavePrompt} />
      
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
