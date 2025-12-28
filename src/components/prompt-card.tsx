
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, CheckCircle2, MapPin, MessageSquare, ListChecks, Play, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import type { Prompt } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { PromptPlayground } from "@/components/prompt-playground";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

type PromptCardProps = Prompt & {
  stepNumber: number;
  onStatusChange: (promptId: string, isDone: boolean) => void;
  isReadOnly?: boolean;
  aiRole?: string;
};

export function PromptCard({ 
  id,
  title,
  userPrompt,
  mapFlow,
  isDone,
  acceptanceCriteria,
  stepNumber,
  onStatusChange,
  isReadOnly = false,
  aiRole,
}: PromptCardProps) {
  const { toast } = useToast();
  const { user, subscriptionPlan } = useAuth();
  const router = useRouter();
  const [hasCopied, setHasCopied] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  
  const hasAccess = subscriptionPlan === 'plus' || subscriptionPlan === 'pro';

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

  const handleTestClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAccess) {
      toast({
        variant: 'destructive',
        title: 'Upgrade Required',
        description: 'The Prompt Playground feature is only available for Plus and Pro users. Upgrade your plan to test prompts and see AI responses in real-time.',
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/#pricing')}
            className="ml-2"
          >
            View Pricing
          </Button>
        ),
      });
      return;
    }
    
    setIsPlaygroundOpen(true);
  };

  return (
    <Card className={cn(
        "transition-all duration-300 print:break-inside-avoid bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700",
        isDone ? "opacity-60 bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-[#00171f]"
    )}>
      <CardContent className="p-0">
        {/* Header section */}
        <div className="flex items-start gap-4 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#00171f] dark:bg-white text-base font-bold text-white dark:text-[#00171f] shadow-md mt-0.5">
            {stepNumber}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg sm:text-xl font-bold text-[#00171f] dark:text-white break-words leading-tight",
              isDone && "line-through text-gray-400 dark:text-gray-500"
            )}>
              {title}
            </h3>
          </div>
          <Checkbox 
            id={`done-${id}`}
            checked={!!isDone}
            onCheckedChange={(checked) => onStatusChange(id, !!checked)}
            className="h-5 w-5 flex-shrink-0 print:hidden border-gray-300 dark:border-gray-700 data-[state=checked]:bg-[#00171f] dark:data-[state=checked]:bg-white data-[state=checked]:border-[#00171f] dark:data-[state=checked]:border-white mt-0.5"
            aria-label="Mark as done"
            disabled={isReadOnly}
          />
        </div>

        {/* Content section */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Logic Map */}
          {mapFlow && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="font-semibold text-[#00171f] dark:text-white mb-2 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Logic Map
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{mapFlow}</p>
            </div>
          )}
          
          {/* User Prompt */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-4 relative group">
            <div className="font-semibold text-[#00171f] dark:text-white mb-2 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                User Prompt
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestClick}
                  disabled={!hasAccess}
                  className={cn(
                    "h-7 text-xs print:hidden border-0 flex-shrink-0",
                    hasAccess 
                      ? "bg-[#00171f] dark:bg-white dark:text-[#00171f] text-white hover:bg-[#00171f]/90 dark:hover:bg-gray-100"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  )}
                  title={hasAccess ? "Test Prompt" : "Upgrade to Plus or Pro to test prompts"}
                >
                  {hasAccess ? (
                    <>
                      <Play className="mr-1.5 h-3 w-3" />
                      Test Prompt
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1.5 h-3 w-3" />
                      Test Prompt
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy prompt"
                  className="h-7 w-7 print:hidden text-gray-400 dark:text-gray-500 hover:text-[#00171f] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {userPrompt}
            </p>
          </div>

          {/* Acceptance Criteria */}
          {acceptanceCriteria && acceptanceCriteria.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="font-semibold text-[#00171f] dark:text-white mb-3 flex items-center gap-2 text-sm">
                <ListChecks className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Acceptance Criteria
              </div>
              <ul className="space-y-2.5">
                {acceptanceCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#00171f] dark:text-white flex-shrink-0" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Prompt Playground Dialog */}
      <PromptPlayground
        open={isPlaygroundOpen}
        onOpenChange={setIsPlaygroundOpen}
        prompt={userPrompt}
        promptTitle={title}
        aiRole={aiRole}
      />
    </Card>
  );
}
