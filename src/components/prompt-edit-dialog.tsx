'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Prompt } from "@/lib/projects";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type PromptData = Partial<Omit<Prompt, 'id' | 'order'>> & { id?: string, order?: number };

interface PromptEditDialogProps {
  prompt: PromptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (promptData: PromptData) => void;
}

export function PromptEditDialog({ prompt, open, onOpenChange, onSave }: PromptEditDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [mapFlow, setMapFlow] = useState('');
  const [promptText, setPromptText] = useState('');
  
  useEffect(() => {
    if (open && prompt) {
      setTitle(prompt.title || '');
      setPlatform(prompt.platform || '');
      setMapFlow(prompt.mapFlow || '');
      setPromptText(prompt.prompt || '');
    } else if (!open) {
      // Reset form when dialog is closed
      setTitle('');
      setPlatform('');
      setMapFlow('');
      setPromptText('');
    }
  }, [prompt, open]);

  const handleSave = () => {
    if (!title.trim() || !platform.trim() || !promptText.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all fields before saving.",
      });
      return;
    }

    onSave({
      ...prompt,
      title,
      platform,
      mapFlow,
      prompt: promptText
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{prompt?.id ? 'Edit Prompt' : 'Add New Prompt'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Create Login Form" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right">Platform</Label>
            <Input id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="col-span-3" placeholder="e.g., Firebase, Lovable" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="mapflow-text" className="text-right pt-2">Logic Map</Label>
            <Textarea id="mapflow-text" value={mapFlow} onChange={(e) => setMapFlow(e.target.value)} className="col-span-3 min-h-[100px]" placeholder="Explain the logic behind this prompt..." />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="prompt-text" className="text-right pt-2">Prompt</Label>
            <Textarea id="prompt-text" value={promptText} onChange={(e) => setPromptText(e.target.value)} className="col-span-3 min-h-[200px]" placeholder="Enter the detailed prompt..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
