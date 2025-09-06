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
  userId:string;
  onOpenChange: (open: boolean) => void;
  onSave: (promptData: PromptData) => void;
}


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

export function PromptEditDialog({ prompt, userId, open, onOpenChange, onSave }: PromptEditDialogProps) {
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
    const isAiPromptEnhancementAllowed = await isFeatureEnabled(userId, 'aiPromptEnhancement');
    if(!isAiPromptEnhancementAllowed){
      toast({
        variant: "destructive",
        title: "Feature Unavailable",
        description: "AI Prompt Enhancement is not available on your current plan. Please upgrade to access this feature.",
      });
      return;
    }
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-white border-0 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {prompt?.id ? 'Edit Prompt' : 'Add New Prompt'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto pl-2 pr-2 md:grid-cols-2">
           <div className="space-y-4 md:col-span-2">
             <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Create Login Form"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
             </div>
           </div>

          <div className="space-y-2">
            <Label htmlFor="complexity" className="text-sm font-medium text-gray-700">Complexity</Label>
             <Select value={complexity} onValueChange={(v) => setComplexity(v as Prompt['complexity'])}>
                <SelectTrigger 
                  id="complexity"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                    <SelectItem value="low" className="hover:bg-gray-50">Low</SelectItem>
                    <SelectItem value="medium" className="hover:bg-gray-50">Medium</SelectItem>
                    <SelectItem value="high" className="hover:bg-gray-50">High</SelectItem>
                </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time Estimate</Label>
            <Input 
              id="time" 
              value={timeEstimate} 
              onChange={(e) => setTimeEstimate(e.target.value)} 
              placeholder="e.g., 30m, 1h"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

           <div className="space-y-6 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="mapflow-text" className="text-sm font-medium text-gray-700">Logic Map</Label>
                <Textarea 
                  id="mapflow-text" 
                  value={mapFlow} 
                  onChange={(e) => setMapFlow(e.target.value)} 
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Explain the logic behind this prompt..."
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="userprompt-text" className="text-sm font-medium text-gray-700">User Prompt</Label>
                 <div className="relative">
                    <Textarea 
                        id="userprompt-text" 
                        value={userPrompt} 
                        onChange={(e) => setUserPrompt(e.target.value)} 
                        className="w-full min-h-[180px] px-3 py-2 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Enter the plain-English user prompt..." 
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              onClick={handleEnhancePrompt}
                              disabled={isEnhancing}
                            >
                               {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              <span className="sr-only">Enhance prompt with AI</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 text-white rounded-md">
                          <p className="text-sm">Enhance with AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptance-criteria-text" className="text-sm font-medium text-gray-700">Acceptance Criteria (one per line)</Label>
                <Textarea 
                    id="acceptance-criteria-text" 
                    value={acceptanceCriteria} 
                    onChange={(e) => setAcceptanceCriteria(e.target.value)} 
                    className="w-full min-h-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="e.g., Renders on mobile&#x0a;Handles empty state" 
                />
              </div>
           </div>
        </div>
        <DialogFooter className="pt-6 border-t border-gray-200">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
