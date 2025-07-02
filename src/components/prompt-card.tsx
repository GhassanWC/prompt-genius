"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { PlatformIcon } from "./platform-icon";

type PromptCardProps = {
  title: string;
  platform: string;
  prompt: string;
};

export function PromptCard({ title, platform, prompt }: PromptCardProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

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
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <div className="bg-muted text-muted-foreground rounded-md p-3 h-full">
          <pre className="whitespace-pre-wrap break-words font-code text-sm">
            <code>{prompt}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
