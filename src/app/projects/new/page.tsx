
'use client';

import { useState, type FormEvent, useEffect, Suspense } from "react";
import { Loader2, Sparkles, AlertTriangle, Lock, ArrowLeft, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tag-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { auth } from "@/lib/firebase";
import { UserNav } from "@/components/user-nav";
import { useSearchParams } from 'next/navigation';
import { getTemplateById } from '@/lib/templates';
import { FeatureSelector, type FeatureCategory, type CustomFeature } from '@/components/feature-selector';
import type { DecomposeIdeaOutput } from '@/ai/flows/decompose-idea';

type Step = 'input' | 'clarify' | 'features' | 'review' | 'creating';

function NewProjectPageContent() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const template = templateId ? getTemplateById(templateId) : null;

  const [step, setStep] = useState<Step>('input');
  const [projectName, setProjectName] = useState(template?.name || "");
  const [idea, setIdea] = useState(template?.idea || "");
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Feature selection state
  const [initialPlan, setInitialPlan] = useState<DecomposeIdeaOutput | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, string>>({});
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<CustomFeature[]>([]);
  const [featureLimit, setFeatureLimit] = useState(8);
  const [finalPlan, setFinalPlan] = useState<DecomposeIdeaOutput | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Fetch feature limit
    const fetchFeatureLimit = async () => {
      if (!user) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'getFeatureLimit' }),
        });
        if (res.ok) {
          const data = await res.json();
          setFeatureLimit(data.featureLimit || 8);
        }
      } catch (e) {
        console.error('Failed to fetch feature limit:', e);
      }
    };
    fetchFeatureLimit();
  }, [user]);

  const handleInitialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim() || !projectName.trim() || isLoading || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();

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
        throw new Error(errorData.error || 'Failed to analyze your idea.');
      }

      const { plan } = await decomposeRes.json();
      setInitialPlan(plan);

      // Check if clarification steps exist
      if (plan.clarificationSteps && plan.clarificationSteps.length > 0) {
        setStep('clarify');
      } else {
        // No clarifications needed, go to feature selection
        setStep('features');
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!initialPlan) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      // Build enhanced idea with clarification answers
      let enhancedIdea = idea;
      if (Object.keys(clarificationAnswers).length > 0) {
        const answersText = initialPlan.clarificationSteps!
          .map((step, idx) => {
            const answer = clarificationAnswers[step.step];
            return answer ? `Q${step.step}: ${step.userPrompt}\nA${step.step}: ${answer}` : null;
          })
          .filter(Boolean)
          .join('\n\n');
        enhancedIdea = `${idea}\n\nClarifications:\n${answersText}`;
      }

      // Regenerate plan with clarifications
      const decomposeRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'decomposeIdea', idea: enhancedIdea }),
      });

      if (!decomposeRes.ok) {
        const errorData = await decomposeRes.json();
        throw new Error(errorData.error || 'Failed to regenerate plan with clarifications.');
      }

      const { plan } = await decomposeRes.json();
      setInitialPlan(plan);
      setStep('features');
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureSelectionNext = async () => {
    if (!initialPlan || selectedFeatureIds.length === 0) {
      setError('Please select at least one feature to continue.');
      return;
    }

    if (selectedFeatureIds.length + customFeatures.length > featureLimit) {
      setError(`You can only select up to ${featureLimit} features. Please remove some selections.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();

      // Generate prompts for selected features
      const generateRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'generatePlanFromFeatures',
          enhancedIdea: initialPlan.enhancedIdea,
          aiRole: initialPlan.aiRole,
          selectedFeatureIds,
          allFeatures: initialPlan.featureCategories || [],
          customFeatures: customFeatures.length > 0 ? customFeatures : undefined,
        }),
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json();
        throw new Error(errorData.error || 'Failed to generate prompts for selected features.');
      }

      const { developmentPlan } = await generateRes.json();

      // Create final plan with generated prompts
      const plan: DecomposeIdeaOutput = {
        ...initialPlan,
        developmentPlan,
      };

      setFinalPlan(plan);
      setStep('review');
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!finalPlan || !user) return;

    setIsLoading(true);
    setStep('creating');
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'createProject', projectName, plan: finalPlan, tags }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        let errorMessage = errorData.error || errorData.message || 'Failed to create project.';
        
        if (errorData.currentCount !== undefined && errorData.limit !== undefined) {
          errorMessage = errorData.error || `You've reached your project limit (${errorData.currentCount}/${errorData.limit} projects) on the ${errorData.tierName || 'current'} plan. Upgrade to create more projects and unlock additional features.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const projectId = data.projectId;
      router.push(`/projects/${projectId}`);
    } catch (e: any) {
      setStep('review');
      setError(e.message || "An unexpected error occurred while creating your project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleIdea = "An app where people can find, review, and favorite coffee shops in their city.";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-foreground" />
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-foreground mx-auto" />
          <p className="text-lg text-muted-foreground">Creating your project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-foreground tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-all duration-200 font-medium group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Create a New Project
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {step === 'input' && "Start by giving your project a name and describing your idea."}
            {step === 'clarify' && "Help us understand your project better."}
            {step === 'features' && "Select the features you want to include in your project."}
            {step === 'review' && "Review your project plan before creating it."}
          </p>
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <form onSubmit={handleInitialSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-base font-semibold">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., 'Coffee Finder App'"
                className="p-4 text-base rounded-xl"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea" className="text-base font-semibold">
                Your Big Idea
              </Label>
              <Textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={`e.g., "${exampleIdea}"`}
                className="min-h-[150px] text-base resize-none p-4 rounded-xl"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-base font-semibold">
                Tags (Optional)
              </Label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="e.g., web-app, saas, mobile..."
                maxTags={10}
              />
              <p className="text-sm text-muted-foreground">
                Add tags to organize and filter your projects. Press Enter to add a tag.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold text-lg py-6 rounded-full transition-all duration-200"
              size="lg"
              disabled={isLoading || !idea.trim() || !projectName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Idea...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyze Idea & Continue
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Clarification */}
        {step === 'clarify' && initialPlan?.clarificationSteps && (
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle>Clarification Questions</CardTitle>
              <CardDescription>
                Please answer these questions to help us create a better plan for your project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {initialPlan.clarificationSteps.map((clarStep) => (
                <div key={clarStep.step} className="space-y-2">
                  <Label className="text-base font-medium">
                    {clarStep.step}. {clarStep.userPrompt}
                  </Label>
                  <Textarea
                    value={clarificationAnswers[clarStep.step] || ''}
                    onChange={(e) => setClarificationAnswers({
                      ...clarificationAnswers,
                      [clarStep.step]: e.target.value,
                    })}
                    placeholder="Your answer..."
                    className="min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('input')}
                  disabled={isLoading}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleClarificationSubmit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Feature Selection */}
        {step === 'features' && initialPlan && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription className="whitespace-pre-wrap">
                  {initialPlan.enhancedIdea}
                </CardDescription>
              </CardHeader>
            </Card>

            <FeatureSelector
              features={initialPlan.featureCategories || []}
              selectedFeatureIds={selectedFeatureIds}
              onSelectionChange={setSelectedFeatureIds}
              customFeatures={customFeatures}
              onCustomFeaturesChange={setCustomFeatures}
              maxFeatures={featureLimit}
              disabled={isLoading}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(initialPlan.clarificationSteps?.length ? 'clarify' : 'input')}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleFeatureSelectionNext}
                disabled={isLoading || selectedFeatureIds.length === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Prompts...
                  </>
                ) : (
                  <>
                    Generate Prompts
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && finalPlan && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Review</CardTitle>
                <CardDescription>
                  Review your project plan before creating it. You can edit prompts later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Project Name</h3>
                  <p className="text-muted-foreground">{projectName}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Enhanced Idea</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{finalPlan.enhancedIdea}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Development Plan</h3>
                  <div className="space-y-3">
                    {finalPlan.developmentPlan?.map((prompt, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {index + 1}. {prompt.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium mb-1">Prompt:</p>
                            <p className="text-sm text-muted-foreground">{prompt.userPrompt}</p>
                          </div>
                          {prompt.acceptanceCriteria && prompt.acceptanceCriteria.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Acceptance Criteria:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {prompt.acceptanceCriteria.map((criteria, idx) => (
                                  <li key={idx}>{criteria}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('features')}
                    disabled={isLoading}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Features
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription className="font-medium">
              <p>{error}</p>
              {(error.includes('limit') || error.includes('reached')) && (
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <Link href="/#pricing" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl">
                      <Lock className="mr-2 h-4 w-4"/> Upgrade Plan
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full sm:w-auto rounded-xl"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-foreground" />
      </div>
    }>
      <NewProjectPageContent />
    </Suspense>
  );
}
