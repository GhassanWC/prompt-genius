"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { decomposeIdea, type DecomposeIdeaOutput } from "@/ai/flows/decompose-idea";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PromptCard } from "@/components/prompt-card";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/user-nav";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [plan, setPlan] = useState<DecomposeIdeaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      const result = await decomposeIdea({ idea });
      setPlan(result);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const exampleIdea = "An app where people can find, review, and favorite coffee shops in their city.";

  const frontendSteps = plan?.steps.filter(p => p.phase === 'Frontend') || [];
  const backendSteps = plan?.steps.filter(p => p.phase === 'Backend') || [];
  
  if (authLoading || !user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 py-4 flex justify-end items-center">
        <UserNav />
      </header>
      <main className="container mx-auto px-4 pb-8 md:pb-16">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <Logo className="h-16 w-16 mb-4 text-primary" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            PromptForge AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn your complex project ideas into clear, actionable prompts for your favorite platforms.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mt-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={`e.g., "${exampleIdea}"`}
              className="min-h-[120px] text-base resize-none p-4"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              className="w-full text-lg py-6"
              size="lg"
              disabled={isLoading || !idea.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Prompts
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg md:col-span-2" />
            </div>
          )}

          {plan && (
            <div className="space-y-10 animate-in fade-in-0 slide-in-from-bottom-8 duration-500">
              <div className="text-center p-6 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Recommended Stack</p>
                <h2 className="mt-2 text-3xl font-bold font-headline text-primary">{plan.stack}</h2>
              </div>
              
              {frontendSteps.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold font-headline text-center">Frontend Phase</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                      {frontendSteps.map((prompt, index) => (
                          <PromptCard key={`frontend-${index}`} {...prompt} />
                      ))}
                  </div>
                </div>
              )}
              
              {backendSteps.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold font-headline text-center">Backend Phase</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        {backendSteps.map((prompt, index) => (
                            <PromptCard key={`backend-${index}`} {...prompt} />
                        ))}
                    </div>
                  </div>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="text-center py-6 border-t">
        <p className="text-sm text-muted-foreground">Built with Firebase and Genkit</p>
      </footer>
    </div>
  );
}
