
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Terminal, Folder, Clock, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import type { Prompt } from "@/lib/projects";
import { PlatformIcon } from "./platform-icon";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type PromptCardProps = Prompt & {
  onStatusChange: (promptId: string, isDone: boolean) => void;
  isReadOnly?: boolean;
};

export function PromptCard({ 
  id,
  title,
  prompt,
  mapFlow,
  environment,
  complexity,
  timeEstimate,
  command,
  dir,
  isDone,
  onStatusChange,
  isReadOnly = false,
}: PromptCardProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
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
        <PlatformIcon platform={environment} className="h-6 w-6 text-muted-foreground mt-1" />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy prompt"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-accent-foreground"
          >
            {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        {mapFlow && (
            <div className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3 py-1">
              <p className="font-semibold text-foreground/90 not-italic mb-1">Logic Map:</p>
              {mapFlow}
            </div>
        )}
        {(command || dir) && (
          <div className="space-y-2 text-sm">
            {command && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <code className="font-code text-muted-foreground">{command}</code>
              </div>
            )}
            {dir && (
               <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <code className="font-code text-muted-foreground">{dir}</code>
              </div>
            )}
          </div>
        )}
        <div className="bg-muted text-muted-foreground rounded-md p-3 h-full flex-grow">
          <pre className="whitespace-pre-wrap font-code text-sm">
            <code>{prompt}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
