
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/projects";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { enhanceAiRole } from "@/ai/flows/enhance-ai-role";

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

interface ProjectEditDialogProps {
  project: Pick<Project, 'name' | 'idea' | 'aiRole' | 'summary'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; idea: string; aiRole: string; summary: string }) => Promise<void>;
  isReadOnly?: boolean;
  userId: string;
}

export function ProjectEditDialog({ project, open, onOpenChange, onSave, isReadOnly = false, userId }: ProjectEditDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingRole, setIsEnhancingRole] = useState(false);
  
  useEffect(() => {
    if (open && project) {
      setName(project.name || '');
      setIdea(project.idea || '');
      setAiRole(project.aiRole || '');
      setSummary(project.summary || '');
    } else if (!open) {
      // Reset form when dialog is closed
      setName('');
      setIdea('');
      setAiRole('');
      setSummary('');
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
        await onSave({ name, idea, aiRole, summary });
        onOpenChange(false);
    } catch (e) {
        // Error toast is handled by the parent component's catch block
    } finally {
        setIsSaving(false);
    }
  }

  const handleEnhanceRole = async () => {
    if (isReadOnly) return;

    const isAiRoleEnhancementAllowed = await isFeatureEnabled(userId, 'aiPromptEnhancement');
    if (!isAiRoleEnhancementAllowed) {
      toast({
        variant: "destructive",
        title: "Feature Unavailable",
        description: "AI Role Enhancement is only available on the Pro plan. Please upgrade to access this feature.",
      });
      return;
    }

    if (!aiRole.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot Enhance",
        description: "Please enter an AI role before enhancing.",
      });
      return;
    }

    setIsEnhancingRole(true);
    try {
      const result = await enhanceAiRole({ role: aiRole });
      setAiRole(result.enhancedRole);
      toast({
        title: "AI Role Enhanced",
        description: "The persona has been refined for better use with your builder.",
      });
    } catch (error: any) {
      console.error("Error enhancing AI role:", error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: error?.message || "Could not enhance the AI role. Please try again.",
      });
    } finally {
      setIsEnhancingRole(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Keep your project name, AI role, and original idea in sync. Changes here update what you see on the
            project page and what gets copied with &quot;Copy All&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Project name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-base"
              placeholder="e.g., Prompt Genius AI"
              disabled={isReadOnly}
            />
          </div>

          {/* AI Role / persona */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="project-ai-role"
                className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500"
              >
                AI Role (persona)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  This is the first thing your AI builder will read.
                </span>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 bg-white"
                    onClick={handleEnhanceRole}
                    disabled={isEnhancingRole}
                  >
                    {isEnhancingRole ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              id="project-ai-role"
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              className="min-h-[220px] font-mono text-xs sm:text-sm leading-relaxed resize-y"
              placeholder="You are an expert full‑stack web developer, proficient in..."
              disabled={isReadOnly}
            />
          </div>

          {/* Project idea */}
          <div className="space-y-2">
            <Label
              htmlFor="project-idea"
              className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500"
            >
              Project Idea
            </Label>
            <Textarea
              id="project-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[200px] text-sm sm:text-base leading-relaxed resize-y"
              placeholder="Describe the problem you want to solve, who it is for, and the core features..."
              disabled={isReadOnly}
            />
          </div>

          {/* Project summary */}
          <div className="space-y-2">
            <Label
              htmlFor="project-summary"
              className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500"
            >
              Project Summary (shown under AI role &amp; idea)
            </Label>
            <Textarea
              id="project-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[140px] text-sm sm:text-base leading-relaxed resize-y"
              placeholder="Optional: summarize the project idea, key features, and how the AI should use the prompts to implement it."
              disabled={isReadOnly}
            />
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
