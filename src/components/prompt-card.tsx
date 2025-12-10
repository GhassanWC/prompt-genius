
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, CheckCircle2, MapPin, MessageSquare, ListChecks } from "lucide-react";
import { useState, useEffect } from "react";
import type { Prompt } from "@/lib/projects";
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
        "transition-all duration-300 print:break-inside-avoid bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300",
        isDone ? "opacity-60 bg-gray-50" : "bg-white"
    )}>
      <CardContent className="p-0">
        {/* Header section */}
        <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#00171f] text-base font-bold text-white shadow-md">
            {stepNumber}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg sm:text-xl font-bold text-[#00171f] truncate",
              isDone && "line-through text-gray-400"
            )}>
              {title}
            </h3>
          </div>
          <Checkbox 
            id={`done-${id}`}
            checked={!!isDone}
            onCheckedChange={(checked) => onStatusChange(id, !!checked)}
            className="h-5 w-5 flex-shrink-0 print:hidden border-gray-300 data-[state=checked]:bg-[#00171f] data-[state=checked]:border-[#00171f]"
            aria-label="Mark as done"
            disabled={isReadOnly}
          />
        </div>

        {/* Content section */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Logic Map */}
          {mapFlow && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-[#00171f] mb-2 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                Logic Map
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{mapFlow}</p>
            </div>
          )}
          
          {/* User Prompt */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 relative group">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy prompt"
              className="h-8 w-8 absolute top-3 right-3 text-gray-400 hover:text-[#00171f] hover:bg-gray-100 rounded-lg transition-all duration-200 print:hidden opacity-0 group-hover:opacity-100"
            >
              {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <div className="font-semibold text-[#00171f] mb-2 flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              User Prompt
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed pr-10">
              {userPrompt}
            </p>
          </div>

          {/* Acceptance Criteria */}
          {acceptanceCriteria && acceptanceCriteria.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-[#00171f] mb-3 flex items-center gap-2 text-sm">
                <ListChecks className="h-4 w-4 text-gray-500" />
                Acceptance Criteria
              </div>
              <ul className="space-y-2.5">
                {acceptanceCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#00171f] flex-shrink-0" />
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
