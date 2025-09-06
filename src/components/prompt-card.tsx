
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, CheckCircle } from "lucide-react";
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
        "transition-all duration-500 print:break-inside-avoid bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200",
        isDone ? "opacity-75 bg-slate-50/90" : "bg-white/90"
    )}>
      <CardContent className="p-0">
        {/* Enhanced header section */}
        <div className="flex items-center gap-4 p-6 border-b border-white/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
            {stepNumber}
          </div>
          <div className="flex-1">
            <h3 className={cn("text-xl sm:text-2xl font-headline font-bold text-indigo-800", isDone && "line-through text-slate-500")}>
              {title}
            </h3>
          </div>
          <Checkbox 
            id={`done-${id}`}
            checked={!!isDone}
            onCheckedChange={(checked) => onStatusChange(id, !!checked)}
            className="h-6 w-6 flex-shrink-0 print:hidden data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            aria-label="Mark as done"
            disabled={isReadOnly}
          />
        </div>

        {/* Enhanced content section */}
        <div className="p-6 space-y-8">
            {mapFlow && (
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-xl border border-blue-100 rounded-2xl p-5">
                    <div className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Logic Map
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{mapFlow}</p>
                </div>
            )}
            
            <div className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 backdrop-blur-xl border border-slate-100 rounded-2xl p-5 relative">
                <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy prompt"
                className="h-10 w-10 absolute top-4 right-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 print:hidden"
                >
                {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </Button>
                <div className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  User Prompt
                </div>
                <p className="whitespace-pre-wrap text-sm sm:text-base text-slate-600 font-medium leading-relaxed pr-14">
                {userPrompt}
                </p>
            </div>

            {acceptanceCriteria && acceptanceCriteria.length > 0 && (
                <div className="space-y-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-xl border border-green-100 rounded-2xl p-5">
                <div className="font-bold text-green-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Acceptance Criteria
                </div>
                <ul className="space-y-3">
                    {acceptanceCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                        <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
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
