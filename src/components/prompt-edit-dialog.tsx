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
import { Loader2, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";

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
  const [userPrompt, setUserPrompt] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [complexity, setComplexity] = useState<Prompt['complexity'] | undefined>(undefined);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);


  const resetState = () => {
    setTitle('');
    setMapFlow('');
    setUserPrompt('');
    setTimeEstimate('');
    setComplexity(undefined);
    setAcceptanceCriteria('');
    setIsEnhancing(false);
  }
  
  useEffect(() => {
    if (open && prompt) {
      setTitle(prompt.title || '');
      setMapFlow(prompt.mapFlow || '');
      setUserPrompt(prompt.userPrompt || '');
      setTimeEstimate(prompt.timeEstimate || '');
      setComplexity(prompt.complexity || undefined);
      setAcceptanceCriteria(prompt.acceptanceCriteria?.join('\n') || '');
    } else if (!open) {
      resetState();
    }
  }, [prompt, open]);

  const handleSave = () => {
    if (!title.trim() || !userPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and User Prompt fields cannot be empty.",
      });
      return;
    }

    onSave({
      ...prompt,
      title,
      mapFlow,
      userPrompt,
      timeEstimate: timeEstimate || undefined,
      complexity: complexity || undefined,
      acceptanceCriteria: acceptanceCriteria.split('\n').filter(line => line.trim() !== ''),
    });
    onOpenChange(false);
  }

  const handleEnhancePrompt = async () => {
    if (!userPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot Enhance",
        description: "Please enter a prompt to enhance.",
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhancePrompt({ prompt: userPrompt });
      setUserPrompt(result.enhancedPrompt);
      toast({
        title: "Prompt Enhanced",
        description: "The user prompt has been improved by AI.",
      });
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: "Could not enhance the prompt. Please try again.",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

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
            <Label htmlFor="time">Time Estimate</Label>
            <Input id="time" value={timeEstimate} onChange={(e) => setTimeEstimate(e.target.value)} placeholder="e.g., 30m, 1h" />
          </div>

           <div className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="mapflow-text">Logic Map</Label>
                <Textarea id="mapflow-text" value={mapFlow} onChange={(e) => setMapFlow(e.target.value)} className="min-h-[80px]" placeholder="Explain the logic behind this prompt..." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="userprompt-text">User Prompt</Label>
                 <div className="relative">
                    <Textarea 
                        id="userprompt-text" 
                        value={userPrompt} 
                        onChange={(e) => setUserPrompt(e.target.value)} 
                        className="min-h-[160px] pr-12"
                        placeholder="Enter the plain-English user prompt..." 
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 text-muted-foreground"
                              onClick={handleEnhancePrompt}
                              disabled={isEnhancing}
                            >
                               {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              <span className="sr-only">Enhance prompt with AI</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enhance with AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
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
