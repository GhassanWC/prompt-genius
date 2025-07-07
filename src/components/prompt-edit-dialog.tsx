'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Prompt } from "@/lib/projects";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PromptData = Partial<Prompt>;

interface PromptEditDialogProps {
  prompt: PromptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (promptData: PromptData) => void;
}

export function PromptEditDialog({ prompt, open, onOpenChange, onSave }: PromptEditDialogProps) {
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [mapFlow, setMapFlow] = useState('');
  const [promptText, setPromptText] = useState('');
  const [environment, setEnvironment] = useState<Prompt['environment']>('Generic');
  const [dir, setDir] = useState('');
  const [command, setCommand] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [complexity, setComplexity] = useState<Prompt['complexity'] | undefined>(undefined);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');

  const resetState = () => {
    setTitle('');
    setMapFlow('');
    setPromptText('');
    setEnvironment('Generic');
    setDir('');
    setCommand('');
    setTimeEstimate('');
    setComplexity(undefined);
    setAcceptanceCriteria('');
  }
  
  useEffect(() => {
    if (open && prompt) {
      setTitle(prompt.title || '');
      setMapFlow(prompt.mapFlow || '');
      setPromptText(prompt.prompt || '');
      setEnvironment(prompt.environment || 'Generic');
      setDir(prompt.dir || '');
      setCommand(prompt.command || '');
      setTimeEstimate(prompt.timeEstimate || '');
      setComplexity(prompt.complexity || undefined);
      setAcceptanceCriteria(prompt.acceptanceCriteria?.join('\n') || '');
    } else if (!open) {
      resetState();
    }
  }, [prompt, open]);

  const handleSave = () => {
    if (!title.trim() || !promptText.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and Prompt fields cannot be empty.",
      });
      return;
    }

    onSave({
      ...prompt,
      title,
      mapFlow,
      prompt: promptText,
      environment,
      dir: dir || undefined,
      command: command || undefined,
      timeEstimate: timeEstimate || undefined,
      complexity: complexity || undefined,
      acceptanceCriteria: acceptanceCriteria.split('\n').filter(line => line.trim() !== ''),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{prompt?.id ? 'Edit Prompt' : 'Add New Prompt'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-4 py-4 overflow-y-auto pr-4 md:grid-cols-2">
           <div className="space-y-4 md:col-span-2">
             <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Create Login Form" />
             </div>
           </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as Prompt['environment'])}>
                <SelectTrigger id="environment"><SelectValue placeholder="Select an environment" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Generic">Generic</SelectItem>
                    <SelectItem value="Replit">Replit</SelectItem>
                    <SelectItem value="Blob">Blob</SelectItem>
                    <SelectItem value="Supabase">Supabase</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complexity">Complexity</Label>
             <Select value={complexity} onValueChange={(v) => setComplexity(v as Prompt['complexity'])}>
                <SelectTrigger id="complexity"><SelectValue placeholder="Select complexity" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dir">Directory / Path</Label>
            <Input id="dir" value={dir} onChange={(e) => setDir(e.target.value)} placeholder="e.g., src/components/auth" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Input id="command" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="e.g., npm install react-hook-form" />
          </div>

           <div className="space-y-2">
            <Label htmlFor="time">Time Estimate</Label>
            <Input id="time" value={timeEstimate} onChange={(e) => setTimeEstimate(e.target.value)} placeholder="e.g., 30m, 1h" />
          </div>

           <div className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="mapflow-text">Logic Map</Label>
                <Textarea id="mapflow-text" value={mapFlow} onChange={(e) => setMapFlow(e.target.value)} className="min-h-[80px]" placeholder="Explain the logic behind this prompt..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptance-criteria-text">Acceptance Criteria (one per line)</Label>
                <Textarea 
                    id="acceptance-criteria-text" 
                    value={acceptanceCriteria} 
                    onChange={(e) => setAcceptanceCriteria(e.target.value)} 
                    className="min-h-[100px]" 
                    placeholder="e.g., Renders on mobile&#x0a;Handles empty state" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-text">Prompt</Label>
                <Textarea id="prompt-text" value={promptText} onChange={(e) => setPromptText(e.target.value)} className="min-h-[160px]" placeholder="Enter the detailed prompt..." />
              </div>
           </div>
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
