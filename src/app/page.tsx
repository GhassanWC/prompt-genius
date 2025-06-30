"use client";

import { useState, type FormEvent } from "react";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { decomposeIdea, type DecomposeIdeaOutput } from "@/ai/flows/decompose-idea";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PromptCard } from "@/components/prompt-card";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [prompts, setPrompts] = useState<DecomposeIdeaOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setPrompts([]);

    try {
      const result = await decomposeIdea({ idea });
      setPrompts(result);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const exampleIdea = "An app where people can find, review, and favorite coffee shops in their city.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 md:py-16">
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

          {prompts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 animate-in fade-in-0 slide-in-from-bottom-8 duration-500">
              {prompts.map((prompt, index) => (
                <PromptCard key={index} {...prompt} />
              ))}
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
