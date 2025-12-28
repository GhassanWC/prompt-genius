'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Copy, Check, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PromptPlaygroundProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  promptTitle?: string;
  aiRole?: string;
  onSaveResult?: (response: string) => void;
}

export function PromptPlayground({
  open,
  onOpenChange,
  prompt,
  promptTitle,
  aiRole,
  onSaveResult,
}: PromptPlaygroundProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setResponse('');
      setAccessDenied(false);
      setHasSaved(false);
    }
  }, [open]);

  const handleTest = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Prompt cannot be empty.',
      });
      return;
    }

    setIsLoading(true);
    setResponse('');
    setHasSaved(false);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/prompts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, aiRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 402) {
          // Payment required - upgrade needed
          setAccessDenied(true);
          toast({
            variant: 'destructive',
            title: 'Upgrade Required',
            description: error.error || 'The Prompt Playground feature is only available for Plus and Pro users. Upgrade your plan to test prompts and see AI responses in real-time.',
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  router.push('/#pricing');
                }}
                className="ml-2"
              >
                View Pricing
              </Button>
            ),
          });
          return;
        }
        throw new Error(error.error || 'Failed to test prompt');
      }
      
      setAccessDenied(false);

      const data = await res.json();
      setResponse(data.response || 'No response generated.');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error.message || 'Failed to test prompt. Please try again.',
      });
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setHasCopied(true);
    toast({
      title: 'Response Copied!',
      description: 'The AI response has been copied to your clipboard.',
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSaveResult = () => {
    if (!response || !onSaveResult) return;
    onSaveResult(response);
    setHasSaved(true);
    toast({
      title: 'Result Saved!',
      description: 'The test result has been saved as an example.',
    });
    setTimeout(() => setHasSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#00171f] dark:text-white">
            Prompt Playground
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {promptTitle ? `Testing: ${promptTitle}` : 'Test your prompt and see the AI response in real-time'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* Left side - Prompt */}
          <div className="flex-1 md:border-r border-b md:border-b-0 border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#00171f] dark:text-white">
                  Your Prompt
                </h3>
                <Button
                  onClick={handleTest}
                  disabled={isLoading || !prompt.trim()}
                  className="bg-[#00171f] dark:bg-white dark:text-[#00171f] hover:bg-[#00171f]/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Test Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {prompt}
                  </p>
                </div>
                {aiRole && (
                  <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                      AI Role Context
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {aiRole}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Response */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#00171f] dark:text-white">
                  AI Response
                </h3>
                {response && (
                  <div className="flex items-center gap-2">
                    {onSaveResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveResult}
                        disabled={hasSaved}
                        className="h-8"
                      >
                        {hasSaved ? (
                          <>
                            <Check className="mr-2 h-3.5 w-3.5" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-3.5 w-3.5" />
                            Save Result
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyResponse}
                      className="h-8"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="mr-2 h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00171f] dark:text-white mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Testing prompt with AI...
                    </p>
                  </div>
                ) : accessDenied ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
                    <Lock className="h-16 w-16 text-amber-500 dark:text-amber-400 mb-4" />
                    <h4 className="text-lg font-bold text-[#00171f] dark:text-white mb-2">
                      Upgrade Required
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md">
                      The Prompt Playground feature is only available for Plus and Pro users. Upgrade your plan to test your prompts and see AI responses in real-time.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          onOpenChange(false);
                          router.push('/#pricing');
                        }}
                        className="bg-[#00171f] dark:bg-white dark:text-[#00171f] text-white hover:bg-[#00171f]/90"
                      >
                        View Pricing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : response ? (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {response}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                    <Play className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click "Test Prompt" to see the AI response
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white dark:bg-[#00171f]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

