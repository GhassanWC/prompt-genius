
'use client';

import { useState, type FormEvent, useEffect, useCallback } from "react";
import { Loader2, Sparkles, AlertTriangle, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { getTier } from "@/lib/tiers";
import { auth } from "@/lib/firebase";
import { UserNav } from "@/components/user-nav";

export default function NewProjectPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim() || !projectName.trim() || isLoading || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentPlan = subscriptionPlan || 'free';
      const tier = await getTier(currentPlan);
      const planLimit = tier?.features.projectLimit ?? 0;
      const token = await auth.currentUser?.getIdToken();

      const result = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!result.ok) {
        throw new Error('Failed to fetch existing projects.');
      }
      const existingProjects = await result.json();
      if (existingProjects.length >= planLimit) {
          throw new Error(`You have reached the ${planLimit}-project limit for the ${currentPlan} plan. Please upgrade to create more projects.`);
      }

      // Call decomposeIdea on the server
      const decomposeRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'decomposeIdea', idea }),
      });

      if (!decomposeRes.ok) {
        const errorData = await decomposeRes.json();
        throw new Error(errorData.error || 'Failed to generate project plan.');
      }

      const { plan } = await decomposeRes.json();

      if (!plan.developmentPlan || plan.developmentPlan.length === 0) {
        throw new Error(plan.enhancedIdea || "The AI could not generate a plan for this idea. Please make sure it's a software development topic and try rephrasing.");
      }
      
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'createProject', projectName, plan }),
      });
      console.log("Create project response:", res);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create project.');
      }
      const data = await res.json();
      const projectId = data.projectId;
      router.push(`/projects/${projectId}`);
    } catch (e: any) {
      console.error("Detailed error during project creation:", e);
      let errorMessage = e.message || "An unexpected error occurred while creating your project. Please try again.";
      setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const exampleIdea = "An app where people can find, review, and favorite coffee shops in their city.";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#00171f] relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-[#00171f] transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f]">
            Create a New Project
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start by giving your project a name and describing your idea.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-base font-semibold text-[#00171f]">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., 'Coffee Finder App'"
              className="p-4 text-base border-gray-200 focus:border-[#00171f] focus:ring-[#00171f] rounded-xl"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea" className="text-base font-semibold text-[#00171f]">
              Your Big Idea
            </Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={`e.g., "${exampleIdea}"`}
              className="min-h-[150px] text-base resize-none p-4 border-gray-200 focus:border-[#00171f] focus:ring-[#00171f] rounded-xl"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold text-lg py-6 rounded-full transition-all duration-200"
            size="lg"
            disabled={isLoading || !idea.trim() || !projectName.trim()}
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
          <Alert variant="destructive" className="mt-6 bg-red-50 border-red-200 text-red-800 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Error Creating Project</AlertTitle>
            <AlertDescription className="font-medium">
              {error}
              {error.includes('limit') && (
                <Link href="/#pricing" className="block mt-3">
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 rounded-xl">
                    <Lock className="mr-2 h-4 w-4"/> Upgrade Plan
                  </Button>
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}
