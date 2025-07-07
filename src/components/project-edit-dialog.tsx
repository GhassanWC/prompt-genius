
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/projects";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProjectEditDialogProps {
  project: Pick<Project, 'name' | 'idea'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string, idea: string }) => Promise<void>;
  isReadOnly?: boolean;
}

export function ProjectEditDialog({ project, open, onOpenChange, onSave, isReadOnly = false }: ProjectEditDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (open && project) {
      setName(project.name || '');
      setIdea(project.idea || '');
    } else if (!open) {
      // Reset form when dialog is closed
      setName('');
      setIdea('');
      setIsSaving(false);
    }
  }, [project, open]);

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!name.trim() || !idea.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Project name and idea cannot be empty.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
        await onSave({ name, idea });
        onOpenChange(false);
    } catch (e) {
        // Error toast is handled by the parent component's catch block
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>Update your project's name and original idea.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">Project Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g., Coffee Finder App" disabled={isReadOnly} />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="project-idea" className="text-right pt-2">Project Idea</Label>
            <Textarea id="project-idea" value={idea} onChange={(e) => setIdea(e.target.value)} className="col-span-3 min-h-[240px]" placeholder="Describe your big idea..." disabled={isReadOnly} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          {!isReadOnly && (
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
