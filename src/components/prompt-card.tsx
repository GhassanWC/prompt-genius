
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Clock, Zap, CheckCircle, MessageSquareQuote } from "lucide-react";
import { useState, useEffect } from "react";
import type { Prompt } from "@/lib/projects";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type PromptCardProps = Prompt & {
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
        "flex flex-col overflow-hidden transition-all hover:shadow-lg",
        isDone && "bg-secondary/30 opacity-70"
    )}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 bg-secondary/50">
        <MessageSquareQuote className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
          <CardTitle className={cn("text-lg font-headline", isDone && "line-through")}>{title}</CardTitle>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
            {complexity && <Badge variant="outline" className="capitalize"><Zap className="mr-1 h-3 w-3"/>{complexity}</Badge>}
            {timeEstimate && <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{timeEstimate}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1">
           <Checkbox 
            id={`done-${id}`}
            checked={!!isDone}
            onCheckedChange={(checked) => onStatusChange(id, !!checked)}
            className="h-6 w-6"
            aria-label="Mark as done"
            disabled={isReadOnly}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        {mapFlow && (
            <div className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3 py-1">
              <p className="font-semibold text-foreground/90 not-italic mb-1">Logic Map:</p>
              {mapFlow}
            </div>
        )}
        <div className="bg-muted text-muted-foreground rounded-md p-3 h-full flex-grow relative">
           <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy prompt"
            className="h-8 w-8 absolute top-2 right-2 flex-shrink-0 text-muted-foreground hover:text-accent-foreground"
          >
            {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
          <p className="font-semibold text-foreground/90 mb-2">User Prompt:</p>
          <p className="whitespace-pre-wrap text-sm pr-10">
            {userPrompt}
          </p>
        </div>
        {acceptanceCriteria && acceptanceCriteria.length > 0 && (
          <div className="text-sm space-y-2">
            <p className="font-semibold text-foreground/90">Acceptance Criteria:</p>
            <ul className="space-y-1.5 pl-1">
              {acceptanceCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
