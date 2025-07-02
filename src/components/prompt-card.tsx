"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Pencil, X, MoreVertical, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { PlatformIcon } from "./platform-icon";
import { updatePrompt, deletePrompt } from "@/lib/projects";

type PromptCardProps = {
  userId: string;
  projectId: string;
  promptId: string;
  title: string;
  platform: string;
  prompt: string;
  onPromptUpdate: () => void;
};

export function PromptCard({ userId, projectId, promptId, title, platform, prompt: initialPrompt, onPromptUpdate }: PromptCardProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setPrompt(initialPrompt);
    setIsEditing(false);
  }, [initialPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setHasCopied(true);
    toast({
      title: "Prompt Copied!",
      description: `The prompt for ${platform} is on your clipboard.`,
    });
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setPrompt(initialPrompt);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updatePrompt(userId, projectId, promptId, prompt);
      setIsEditing(false);
      onPromptUpdate(); // Refresh parent state
      toast({
        title: "Prompt Updated!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Saving",
        description: "Could not save your changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
        await deletePrompt(userId, projectId, promptId);
        onPromptUpdate(); // No need to call this if component unmounts
        toast({
            title: "Prompt Deleted",
            description: "The prompt has been successfully removed.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Deleting",
            description: "Could not delete the prompt. Please try again.",
        });
        setIsDeleting(false);
    }
  }


  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 bg-secondary/30">
        <div className="flex-shrink-0">
          <PlatformIcon platform={platform} className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg font-headline">{title}</CardTitle>
          <CardDescription>Platform: {platform}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy prompt"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-accent-foreground"
          >
            {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>

          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent-foreground">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this prompt from your project.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {isEditing ? (
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-full min-h-[150px] resize-y font-code text-sm"
            autoFocus
          />
        ) : (
          <div className="bg-muted text-muted-foreground rounded-md p-3 h-full">
            <pre className="whitespace-pre-wrap break-words font-code text-sm">
              <code>{prompt}</code>
            </pre>
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="justify-end gap-2 p-4 pt-0">
          <Button variant="ghost" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Check className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
