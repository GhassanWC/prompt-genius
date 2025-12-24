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
import { auth } from "@/lib/firebase";


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
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);


  const resetState = () => {
    setTitle('');
    setMapFlow('');
    setUserPrompt('');
    setAcceptanceCriteria('');
    setIsEnhancing(false);
  }
  
  useEffect(() => {
    if (open && prompt) {
      setTitle(prompt.title || '');
      setMapFlow(prompt.mapFlow || '');
      setUserPrompt(prompt.userPrompt || '');
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
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'enhancePrompt', prompt: userPrompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to enhance prompt.');
      }

      const { enhancedPrompt } = await res.json();
      setUserPrompt(enhancedPrompt);
      toast({
        title: "Prompt Enhanced",
        description: "The user prompt has been improved by AI.",
      });
    } catch (error: any) {
      console.error("Error enhancing prompt:", error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: error?.message || "Could not enhance the prompt. Please try again.",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {prompt?.id ? 'Edit Prompt' : 'Add New Prompt'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:gap-6 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 pl-2 pr-2 md:grid-cols-2">
           <div className="space-y-4 md:col-span-2">
             <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Create Login Form"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
             </div>
           </div>

           <div className="space-y-6 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="mapflow-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">Logic Map</Label>
                <Textarea 
                  id="mapflow-text" 
                  value={mapFlow} 
                  onChange={(e) => setMapFlow(e.target.value)} 
                  className="w-full min-h-[100px] sm:min-h-[120px] max-h-[200px] sm:max-h-[250px] px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y overflow-y-auto"
                  placeholder="Explain the logic behind this prompt..."
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="userprompt-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">User Prompt</Label>
                 <div className="relative">
                    <Textarea 
                        id="userprompt-text" 
                        value={userPrompt} 
                        onChange={(e) => setUserPrompt(e.target.value)} 
                        className="w-full min-h-[150px] sm:min-h-[180px] max-h-[250px] sm:max-h-[300px] px-3 py-2 pr-12 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y overflow-y-auto"
                        placeholder="Enter the plain-English user prompt..." 
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              onClick={handleEnhancePrompt}
                              disabled={isEnhancing}
                            >
                               {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              <span className="sr-only">Enhance prompt with AI</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white rounded-md">
                          <p className="text-sm">Enhance with AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptance-criteria-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">Acceptance Criteria (one per line)</Label>
                <Textarea 
                    id="acceptance-criteria-text" 
                    value={acceptanceCriteria} 
                    onChange={(e) => setAcceptanceCriteria(e.target.value)} 
                    className="w-full min-h-[100px] sm:min-h-[120px] max-h-[200px] sm:max-h-[250px] px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y overflow-y-auto"
                    placeholder="e.g., Renders on mobile&#x0a;Handles empty state" 
                />
              </div>
           </div>
        </div>
        <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-800 gap-2">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#00171f] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
