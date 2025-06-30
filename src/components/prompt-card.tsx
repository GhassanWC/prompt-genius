"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Pencil, X } from "lucide-react";
import { useState, useEffect } from "react";
import { PlatformIcon } from "./platform-icon";

type PromptCardProps = {
  title: string;
  platform: string;
  prompt: string;
};

export function PromptCard({ title, platform, prompt: initialPrompt }: PromptCardProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    // Reset prompt when a new idea is generated
    setPrompt(initialPrompt);
    setIsEditing(false); // Also exit edit mode
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
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Prompt Updated!",
      description: "Your changes have been saved locally.",
    });
  };

  const handleCancel = () => {
    setPrompt(initialPrompt);
    setIsEditing(false);
  };

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
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              aria-label="Edit prompt"
              className="flex-shrink-0 text-muted-foreground hover:text-accent-foreground"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy prompt"
            className="flex-shrink-0 text-muted-foreground hover:text-accent-foreground"
          >
            {hasCopied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
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
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" /> Save
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
