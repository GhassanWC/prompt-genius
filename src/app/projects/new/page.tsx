'use client';

import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { decomposeIdea } from "@/ai/flows/decompose-idea";
import { createProjectWithPrompts, generateAndSaveProjectImage } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAvailableModels } from "@/ai/flows/get-available-models";
import type { ModelDefinition } from "@/ai/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchModels() {
        if (!user) return;
        setLoadingModels(true);
        try {
            const models = await getAvailableModels();
            setAvailableModels(models);
            if (models.length > 0) {
                setSelectedModel(models[0].id); // Default to the first available model
            }
        } catch (error) {
            console.error("Failed to fetch available models:", error);
            setError("Could not load AI models. Please check your API key and configuration.");
        } finally {
            setLoadingModels(false);
        }
    }
    fetchModels();
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim() || !projectName.trim() || isLoading || !user || !selectedModel) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate the plan first, passing the selected model
      const plan = await decomposeIdea({ idea, model: selectedModel });
      
      // Create the project and prompts
      const projectId = await createProjectWithPrompts(user.uid, projectName, plan.enhancedIdea, plan);

      // Fire-and-forget the image generation. Do not `await` it.
      generateAndSaveProjectImage(user.uid, projectId, plan.enhancedIdea).catch(err => {
        console.error("Failed to generate project image in the background:", err);
      });
      
      // Redirect immediately to the new project page
      router.push(`/projects/${projectId}`);

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
      setIsLoading(false); // Only set loading false on error; on success, we navigate away.
    }
  };

  const exampleIdea = "An app where people can find, review, and favorite coffee shops in their city.";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="text-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                Create a New Project
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Start by giving your project a name and describing your idea.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-lg font-medium">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., 'Coffee Finder App'"
              className="p-4 text-base"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="idea" className="text-lg font-medium">Your Big Idea</Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={`e.g., "${exampleIdea}"`}
              className="min-h-[120px] text-base resize-none p-4"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model-select" className="text-lg font-medium">AI Model</Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={isLoading || loadingModels || availableModels.length === 0}
            >
              <SelectTrigger id="model-select" className="p-4 text-base h-auto">
                <SelectValue placeholder={loadingModels ? "Loading models..." : "Select a model"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">({model.provider})</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-models" disabled>
                    {loadingModels ? "Loading..." : "No configured models found."}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full text-lg py-6"
            size="lg"
            disabled={isLoading || !idea.trim() || !projectName.trim() || !selectedModel}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Project...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Prompts & Create Project
              </>
            )}
          </Button>
        </form>

        {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Creating Project</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
