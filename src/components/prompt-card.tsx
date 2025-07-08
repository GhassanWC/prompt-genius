"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Clock, Zap, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { Prompt } from "@/lib/projects";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type PromptCardProps = Prompt & {
  stepNumber: number;
  onStatusChange: (promptId: string, isDone: boolean) => void;
  isReadOnly?: boolean;
};

export function PromptCard({ 
  id,
  title,
  userPrompt,
  mapFlow,
  complexity,
  timeEstimate,
  isDone,
  acceptanceCriteria,
  stepNumber,
  onStatusChange,
  isReadOnly = false,
}: PromptCardProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userPrompt);
    setHasCopied(true);
    toast({
      title: "Prompt Copied!",
      description: `The prompt for "${title}" is on your clipboard.`,
    });
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  return (
    <Card className={cn(
        "transition-all duration-300",
        isDone ? "bg-card/80 opacity-70" : "bg-card hover:bg-secondary/20"
    )}>
      <CardContent className="p-6">
        {/* Header section */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {stepNumber}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className={cn("text-xl font-headline", isDone && "line-through")}>
                {title}
              </CardTitle>
              <Checkbox 
                id={`done-${id}`}
                checked={!!isDone}
                onCheckedChange={(checked) => onStatusChange(id, !!checked)}
                className="h-6 w-6 flex-shrink-0 mt-1"
                aria-label="Mark as done"
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              {complexity && <Badge variant="outline" className="capitalize"><Zap className="mr-1 h-3 w-3"/>{complexity}</Badge>}
              {timeEstimate && <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{timeEstimate}</Badge>}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="pl-14 pt-4 mt-4 border-t border-border/50 space-y-6">
            {mapFlow && (
                <div className="text-sm">
                    <p className="font-semibold text-foreground/90 mb-1">Logic Map</p>
                    <p className="text-muted-foreground italic">{mapFlow}</p>
                </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4 relative">
                <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy prompt"
                className="h-8 w-8 absolute top-3 right-3 text-muted-foreground hover:text-accent-foreground"
                >
                {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </Button>
                <p className="font-semibold text-foreground/90 mb-2">User Prompt</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground pr-10">
                {userPrompt}
                </p>
            </div>

            {acceptanceCriteria && acceptanceCriteria.length > 0 && (
                <div className="space-y-3">
                <p className="font-semibold text-foreground/90">Acceptance Criteria</p>
                <ul className="space-y-2">
                    {acceptanceCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{criterion}</span>
                    </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
