"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PageAccessGuard } from "@/components/page-access-guard";

interface ExecutionFollowUpResult {
  gapAnalysis: string;
  correctivePrompt: string;
  keyIssues: string[];
  recommendations: string;
}

export default function ExecutionFollowUpPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [originalPrompt, setOriginalPrompt] = useState("");
  const [actualOutput, setActualOutput] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutionFollowUpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalPrompt.trim() || !actualOutput.trim() || !user) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await (await import("@/lib/firebase")).auth.currentUser?.getIdToken();

      const response = await fetch("/api/execution-follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          originalPrompt,
          actualOutput,
          desiredOutcome: desiredOutcome.trim() || undefined,
          aiTool: aiTool.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze execution gap");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleReset = () => {
    setOriginalPrompt("");
    setActualOutput("");
    setDesiredOutcome("");
    setAiTool("");
    setResult(null);
    setError(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f]" />
      </div>
    );
  }

  return (
    <PageAccessGuard>
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
            <Link href="/" className="flex items-center gap-0 font-bold group">
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

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#00171f]/10 rounded-2xl">
                <Sparkles className="h-6 w-6 text-[#00171f]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#00171f]">
                  Execution Follow-Up Agent
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  Repair prompts when AI tools don't follow instructions
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              When AI tools like Cursor, ChatGPT, or Gemini drift from your original prompt or get stuck, 
              paste what actually happened. This agent analyzes the execution gap and generates corrective 
              prompts that realign the AI with your intent.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 rounded-2xl">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Analysis Failed</AlertTitle>
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-2xl font-bold text-[#00171f]">Analyze Execution Gap</CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                Provide the original prompt and what the AI actually did
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="originalPrompt" className="text-sm font-semibold text-[#00171f]">
                    Original Prompt *
                  </Label>
                  <Textarea
                    id="originalPrompt"
                    placeholder="Paste the original prompt you gave to the AI..."
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    className="min-h-[120px] resize-y border-gray-200 focus:border-[#00171f] focus:ring-[#00171f]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualOutput" className="text-sm font-semibold text-[#00171f]">
                    What the AI Actually Did *
                  </Label>
                  <Textarea
                    id="actualOutput"
                    placeholder="Paste what the AI actually produced or how it behaved..."
                    value={actualOutput}
                    onChange={(e) => setActualOutput(e.target.value)}
                    className="min-h-[120px] resize-y border-gray-200 focus:border-[#00171f] focus:ring-[#00171f]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredOutcome" className="text-sm font-semibold text-[#00171f]">
                    Desired Outcome <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="desiredOutcome"
                    placeholder="What you actually wanted to achieve (if not clear from the original prompt)..."
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    className="min-h-[100px] resize-y border-gray-200 focus:border-[#00171f] focus:ring-[#00171f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiTool" className="text-sm font-semibold text-[#00171f]">
                    AI Tool Used <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="aiTool"
                    placeholder="e.g., Cursor, ChatGPT, Gemini, Copilot..."
                    value={aiTool}
                    onChange={(e) => setAiTool(e.target.value)}
                    className="border-gray-200 focus:border-[#00171f] focus:ring-[#00171f]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !originalPrompt.trim() || !actualOutput.trim()}
                    className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Analyze Execution Gap
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Key Issues */}
              {result.keyIssues && result.keyIssues.length > 0 && (
                <Card className="bg-amber-50 border-amber-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-amber-100 border-b border-amber-200">
                    <CardTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Key Issues Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {result.keyIssues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2 text-amber-800">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                          <span className="font-medium">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Corrective Prompt */}
              <Card className="bg-green-50 border-green-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-green-100 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Corrective Prompt
                      </CardTitle>
                      <CardDescription className="text-green-700 font-medium mt-1">
                        Copy and paste this prompt to realign the AI
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(result.correctivePrompt, "Corrective prompt")}
                      className="border-green-300 text-green-900 hover:bg-green-100"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-white rounded-xl border border-green-200 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-[#00171f] font-mono leading-relaxed">
                      {result.correctivePrompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Gap Analysis */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-[#00171f]">Gap Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {result.gapAnalysis}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {result.recommendations && (
                <Card className="bg-blue-50 border-blue-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-blue-100 border-b border-blue-200">
                    <CardTitle className="text-xl font-bold text-blue-900">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none text-blue-800 leading-relaxed whitespace-pre-wrap">
                      {result.recommendations}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </PageAccessGuard>
  );
}

