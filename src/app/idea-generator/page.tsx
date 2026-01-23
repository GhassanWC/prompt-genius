'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserNav } from '@/components/user-nav';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  Rocket,
  RefreshCw,
  Zap,
  Clock,
  Code2,
  ChevronRight,
  Wand2,
  Bot,
  Lightbulb,
  Target,
  Crown,
  Lock,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
} from 'lucide-react';

interface ProjectIdea {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  techStack: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  icon: string;
}

interface IdeaGenerationLimits {
  tier: 'free' | 'plus' | 'pro';
  ideasPerRequest: number;
  totalGenerations: number;
  usedGenerations: number;
  remainingGenerations: number;
}

const difficultyColors = {
  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const categoryLabels: Record<string, string> = {
  'web-app': 'Web App',
  'mobile-app': 'Mobile App',
  'ai-tool': 'AI Tool',
  'saas': 'SaaS',
  'chrome-extension': 'Chrome Extension',
  'api': 'API',
  'devtool': 'Dev Tool',
  'productivity': 'Productivity',
  'social': 'Social',
  'e-commerce': 'E-Commerce',
  'education': 'Education',
  'health': 'Health',
  'finance': 'Finance',
  'entertainment': 'Entertainment',
  'other': 'Other',
};

export default function IdeaGeneratorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [limits, setLimits] = useState<IdeaGenerationLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [savedIdeas, setSavedIdeas] = useState<ProjectIdea[]>([]);
  const [isSavedIdeasOpen, setIsSavedIdeasOpen] = useState(false);

  // Load saved ideas from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('savedProjectIdeas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedIdeas(parsed);
      } catch (e) {
        console.error('Failed to parse saved ideas:', e);
      }
    }
  }, []);

  // Save to localStorage whenever savedIdeas changes
  useEffect(() => {
    if (savedIdeas.length > 0) {
      localStorage.setItem('savedProjectIdeas', JSON.stringify(savedIdeas));
    } else {
      localStorage.removeItem('savedProjectIdeas');
    }
  }, [savedIdeas]);

  const isIdeaSaved = (ideaId: string) => {
    return savedIdeas.some((saved) => saved.id === ideaId);
  };

  const handleSaveIdea = (idea: ProjectIdea, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (isIdeaSaved(idea.id)) {
      setSavedIdeas(savedIdeas.filter((saved) => saved.id !== idea.id));
      toast({
        title: 'Idea Removed',
        description: `"${idea.title}" removed from saved ideas.`,
      });
    } else {
      setSavedIdeas([...savedIdeas, idea]);
      toast({
        title: 'Idea Saved!',
        description: `"${idea.title}" added to your saved ideas.`,
      });
    }
  };

  const handleRemoveSavedIdea = (ideaId: string, ideaTitle: string) => {
    setSavedIdeas(savedIdeas.filter((saved) => saved.id !== ideaId));
    toast({
      title: 'Idea Removed',
      description: `"${ideaTitle}" removed from saved ideas.`,
    });
  };

  const handleClearAllSaved = () => {
    setSavedIdeas([]);
    toast({
      title: 'All Cleared',
      description: 'All saved ideas have been removed.',
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch idea generation limits
  useEffect(() => {
    const fetchLimits = async () => {
      if (!user) return;
      
      setLoadingLimits(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'getIdeaGenerationLimits' }),
        });

        if (res.ok) {
          const data = await res.json();
          setLimits(data.limits);
        }
      } catch (e) {
        console.error('Failed to fetch limits:', e);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchLimits();
  }, [user]);

  const handleGenerateIdeas = async () => {
    if (!user) return;

    // Check if user has remaining generations
    if (limits && limits.remainingGenerations <= 0) {
      toast({
        variant: 'destructive',
        title: 'Generation Limit Reached',
        description: `You've used all your idea generations. ${limits.tier === 'free' ? 'Upgrade to Plus or Pro for more.' : limits.tier === 'plus' ? 'Upgrade to Pro for more.' : 'Your limit has been reached.'}`,
      });
      return;
    }

    setIsGenerating(true);
    setIdeas([]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'generateIdeas',
          context: context.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 402 && errorData.limits) {
          setLimits(errorData.limits);
        }
        throw new Error(errorData.error || 'Failed to generate ideas');
      }

      const data = await res.json();
      setIdeas(data.ideas);
      setHasGenerated(true);
      
      // Update limits from response
      if (data.limits) {
        setLimits(data.limits);
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: e.message || 'Could not generate ideas. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = async (idea: ProjectIdea) => {
    if (!user || isCreatingProject) return;

    setIsCreatingProject(idea.id);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'createProjectFromIdea',
          ideaTitle: idea.title,
          ideaDescription: `${idea.description}\n\nTech Stack: ${idea.techStack.join(', ')}\nCategory: ${categoryLabels[idea.category] || idea.category}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 402) {
          toast({
            variant: 'destructive',
            title: 'Project Limit Reached',
            description: errorData.error || 'Upgrade your plan to create more projects.',
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await res.json();
      
      toast({
        title: 'Project Created!',
        description: `"${data.projectName}" created with ${data.promptCount} prompts.`,
      });

      router.push(`/projects/${data.projectId}`);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: e.message || 'Could not create project. Please try again.',
      });
      setIsCreatingProject(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-16 w-16 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-fuchsia-950/20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-white tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Hero section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Bot className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">AI-Powered Idea Agent</span>
          </div>
          
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Spark Your Next
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Big Idea
            </span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Let AI generate creative project ideas tailored to your interests. 
            Click on any idea and we'll automatically create your entire project with prompts.
          </p>

          {/* Limits display */}
          {!loadingLimits && limits && (
            <div className="max-w-xl mx-auto mb-6">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <Crown className={`h-4 w-4 ${limits.tier === 'pro' ? 'text-amber-400' : limits.tier === 'plus' ? 'text-violet-400' : 'text-zinc-400'}`} />
                  <span className="text-sm font-medium text-zinc-300 capitalize">{limits.tier} Plan</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <Sparkles className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">{limits.ideasPerRequest}</span> ideas per request
                  </span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${limits.remainingGenerations > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  {limits.remainingGenerations > 0 ? (
                    <Zap className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm ${limits.remainingGenerations > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    <span className="font-semibold text-white">{limits.remainingGenerations}</span>/{limits.totalGenerations} generations left
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Input section */}
          <div className="max-w-xl mx-auto space-y-4">
            <div className="relative">
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What kind of project interests you? (optional)"
                className="h-14 pl-5 pr-5 text-base bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                disabled={isGenerating || (limits?.remainingGenerations === 0)}
              />
            </div>
            
            {limits?.remainingGenerations === 0 ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <Lock className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-300 mb-1">You've used all your idea generations</p>
                  <p className="text-xs text-red-400/80">
                    {limits.tier === 'free' ? 'Upgrade to Plus for 30 generations or Pro for 40 generations.' : 
                     limits.tier === 'plus' ? 'Upgrade to Pro for 40 total generations.' : 
                     'You have reached the maximum generations for your plan.'}
                  </p>
                </div>
                {limits.tier !== 'pro' && (
                  <Link href="/#pricing">
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Upgrade Plan
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Button
                onClick={handleGenerateIdeas}
                disabled={isGenerating || loadingLimits}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 rounded-2xl shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating {limits?.ideasPerRequest || 6} Ideas...
                  </>
                ) : loadingLimits ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : hasGenerated ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate {limits?.ideasPerRequest || 6} New Ideas
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate {limits?.ideasPerRequest || 6} Ideas
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Saved Ideas Section */}
        {savedIdeas.length > 0 && (
          <div className="mb-8">
            <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 transition-all duration-200">
              {/* Clickable area for toggle */}
              <button
                onClick={() => setIsSavedIdeasOpen(!isSavedIdeasOpen)}
                className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <BookmarkCheck className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Saved Ideas</h3>
                  <p className="text-sm text-amber-300/80">{savedIdeas.length} idea{savedIdeas.length !== 1 ? 's' : ''} saved</p>
                </div>
              </button>
              <div className="flex items-center gap-3">
                {isSavedIdeasOpen && (
                  <button
                    onClick={handleClearAllSaved}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsSavedIdeasOpen(!isSavedIdeasOpen)}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {isSavedIdeasOpen ? (
                    <ChevronUp className="h-5 w-5 text-amber-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-amber-400" />
                  )}
                </button>
              </div>
            </div>
            
            {isSavedIdeasOpen && (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedIdeas.map((idea, index) => (
                  <Card
                    key={idea.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] border-amber-500/20 hover:border-amber-500/40 rounded-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                    onClick={() => handleSelectIdea(idea)}
                  >
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSavedIdea(idea.id, idea.title);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="Remove from saved"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{idea.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{idea.title}</h4>
                          <p className="text-xs text-amber-300/70 truncate">{idea.tagline}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] font-semibold uppercase ${difficultyColors[idea.difficulty]}`}
                            >
                              {idea.difficulty}
                            </Badge>
                            <span className="text-[10px] text-zinc-500">{idea.timeEstimate}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Click to create indicator */}
                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-amber-500/10 text-xs font-medium text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCreatingProject === idea.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3" />
                            Click to Create Project
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* How it works - shown before first generation */}
        {!hasGenerated && !isGenerating && (
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Lightbulb className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Generate Ideas</h3>
              <p className="text-sm text-zinc-400">AI creates 6 unique project ideas based on your preferences</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Pick Your Favorite</h3>
              <p className="text-sm text-zinc-400">Click on any idea that resonates with you</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Rocket className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Instant Project</h3>
              <p className="text-sm text-zinc-400">AI automatically creates your project with all prompts ready</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: Math.min(limits?.ideasPerRequest || 6, 12) }).map((_, i) => (
              <div
                key={i}
                className="h-[280px] rounded-3xl bg-white/5 border border-white/10 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {/* Ideas grid */}
        {ideas.length > 0 && !isGenerating && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {ideas.map((idea, index) => (
              <Card
                key={idea.id}
                className={`group relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-violet-500/50 rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/10 cursor-pointer ${
                  isCreatingProject === idea.id ? 'ring-2 ring-violet-500 border-violet-500' : ''
                } ${isCreatingProject && isCreatingProject !== idea.id ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleSelectIdea(idea)}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative pb-2">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{idea.icon}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSaveIdea(idea, e)}
                        className={`p-2 rounded-xl transition-all duration-200 border ${
                          isIdeaSaved(idea.id)
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30 shadow-lg shadow-amber-500/10'
                            : 'bg-white/10 text-zinc-300 border-white/20 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40'
                        }`}
                        title={isIdeaSaved(idea.id) ? 'Remove from saved' : 'Save idea'}
                      >
                        {isIdeaSaved(idea.id) ? (
                          <BookmarkCheck className="h-5 w-5" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </button>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-semibold uppercase tracking-wider ${difficultyColors[idea.difficulty]}`}
                      >
                        {idea.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">
                    {idea.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-violet-300/80 font-medium">
                    {idea.tagline}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <p className="text-sm text-zinc-400 line-clamp-3">
                    {idea.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {idea.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-white/5 text-xs text-zinc-300 border border-white/5"
                      >
                        <Code2 className="h-3 w-3 mr-1 text-zinc-500" />
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{idea.timeEstimate}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-zinc-400">
                      {categoryLabels[idea.category] || idea.category}
                    </Badge>
                  </div>

                  {/* Click to create indicator */}
                  <div className="flex items-center justify-center gap-2 pt-3 text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isCreatingProject === idea.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Click to Create Project
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state after generation fails or returns empty */}
        {hasGenerated && ideas.length === 0 && !isGenerating && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Ideas Generated</h3>
            <p className="text-zinc-400 mb-6">Something went wrong. Please try again.</p>
            <Button
              onClick={handleGenerateIdeas}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

