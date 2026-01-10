'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code, ArrowRight, MessageSquare, Rocket, XCircle, Loader2, Mail, Bot, Wrench, Users, Lightbulb, ListChecks, Share2, Twitter, Instagram, Play, Zap, FileText, GitFork, BookOpen, TrendingUp, Shield, Sparkles as SparklesIcon, Layers, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useMemo } from 'react';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { getPublicFeedback, type Testimonial } from '@/lib/feedback';
import { createCheckout } from '@/lib/lemon';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Tier } from '@/lib/tiers';

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

export default function LandingPage() {
  const { user, loading, subscriptionPlan } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  const navLinks = [
    { name: 'How It Works', href: '#workflow' },
    { name: 'Templates', href: '/templates' },
    { name: 'Community', href: '/community' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'Pricing', href: '#pricing' },
  ];

  // Comprehensive features list with tier information
  const allFeatures = [
    {
      icon: Lightbulb,
      title: 'AI-Powered Idea Decomposition',
      tier: 'Free',
      description: 'Transform your product idea into a structured development plan with AI-generated prompts.',
      example: 'Input: "Build a todo app with user authentication" → Output: Step-by-step prompts for login, database setup, CRUD operations, and UI components.',
      advantages: [
        'No more blank page syndrome',
        'Get complete project breakdowns in seconds',
        'Each prompt includes specific AI roles and context',
        'Copy-paste ready for any AI builder'
      ],
      badge: 'FREE'
    },
    {
      icon: Play,
      title: 'Prompt Playground & Live Testing',
      tier: 'Plus & Pro',
      description: 'Test your prompts in real-time and see AI responses before using them in production.',
      example: 'Click "Test Prompt" on any prompt card → See instant AI response → Verify it works correctly → Use with confidence.',
      advantages: [
        'Instant feedback loop',
        'No context switching between tools',
        'Build trust in prompt quality',
        'Iterate and refine quickly'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: SparklesIcon,
      title: 'AI Prompt Enhancement',
      tier: 'Plus & Pro',
      description: 'Refine rough prompts into clear, specific, and unambiguous instructions for AI models.',
      example: 'Input: "make a button" → Enhanced: "Create a primary action button component with hover states, loading indicators, and accessibility attributes."',
      advantages: [
        'Improve prompt clarity automatically',
        'Better AI understanding and execution',
        'Professional-grade prompt engineering',
        'Save time on prompt refinement'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: ListChecks,
      title: 'Step-by-Step Development Plans',
      tier: 'Free',
      description: 'Get sequential roadmaps with atomic, actionable prompts for every development task.',
      example: 'Each step includes: Title, User Prompt, Logic Map (how it fits), and Acceptance Criteria (what "done" looks like).',
      advantages: [
        'Clear project structure',
        'No missing steps or dependencies',
        'Track progress with checkboxes',
        'Export entire plans as Markdown/PDF'
      ],
      badge: 'FREE'
    },
    {
      icon: BookOpen,
      title: 'Project Templates Library',
      tier: 'All Tiers',
      description: 'Start faster with pre-built project templates for common app types and use cases.',
      example: 'Choose from templates like "E-commerce Store", "SaaS Dashboard", "Mobile App", or "Chrome Extension" and customize.',
      advantages: [
        'Jumpstart your projects',
        'Learn from proven structures',
        'Save hours of planning',
        'Best practices built-in'
      ],
      badge: 'ALL TIERS'
    },
    {
      icon: Globe,
      title: 'Public Projects & Showcase',
      tier: 'Plus & Pro',
      description: 'Make your projects public to showcase your work, get feedback, and inspire others.',
      example: 'Share your project → Others can view, like, comment, and clone → Build your portfolio → Get discovered.',
      advantages: [
        'Build your developer portfolio',
        'Get community feedback',
        'Inspire other builders',
        'Increase project visibility'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: Users,
      title: 'Community Access',
      tier: 'Plus & Pro',
      description: 'Access the community feed to discover trending projects, get inspired, and learn from others.',
      example: 'Browse trending projects → See what others are building → Learn new prompt patterns → Clone successful projects.',
      advantages: [
        'Discover trending projects',
        'Learn from community examples',
        'Find inspiration for your next build',
        'Connect with other builders'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: GitFork,
      title: 'Project Cloning',
      tier: 'All Tiers',
      description: 'Clone any public project to use as a starting point or learn from successful implementations.',
      example: 'Find a project you like → Click "Clone" → Get your own copy → Customize and build upon it.',
      advantages: [
        'Learn from proven projects',
        'Start with working foundations',
        'Save time on setup',
        'Build upon community knowledge'
      ],
      badge: 'ALL TIERS'
    },
    {
      icon: Share2,
      title: 'Team Collaboration & Sharing',
      tier: 'All Tiers',
      description: 'Share projects with team members, assign roles (owner, editor, viewer), and collaborate seamlessly.',
      example: 'Invite team members via email → Set permissions → Work together on prompts → Keep everyone in sync.',
      advantages: [
        'Collaborate with your team',
        'Control access levels',
        'Share knowledge internally',
        'Streamline team workflows'
      ],
      badge: 'ALL TIERS'
    },
    {
      icon: Layers,
      title: 'Project Collections',
      tier: 'Plus & Pro',
      description: 'Organize projects into collections (like playlists) for better organization and sharing.',
      example: 'Create "Mobile Apps" collection → Add related projects → Share entire collections → Organize by theme.',
      advantages: [
        'Better project organization',
        'Group related projects',
        'Share curated collections',
        'Build themed portfolios'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: TrendingUp,
      title: 'Trending & Discovery',
      tier: 'Plus & Pro',
      description: 'Discover trending projects based on likes, clones, comments, and recency.',
      example: 'See what\'s hot in the community → Sort by trending, most liked, or most cloned → Find inspiration.',
      advantages: [
        'Stay updated with trends',
        'Find popular project patterns',
        'Discover what works',
        'Get inspired by top projects'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: FileText,
      title: 'Export & Documentation',
      tier: 'All Tiers',
      description: 'Export your entire project as Markdown or PDF for documentation, sharing, or offline use.',
      example: 'Click export → Get formatted Markdown with all prompts → Download as PDF → Share with stakeholders.',
      advantages: [
        'Create project documentation',
        'Share offline',
        'Archive projects',
        'Present to stakeholders'
      ],
      badge: 'ALL TIERS'
    },
    {
      icon: Bot,
      title: 'Execution Follow-Up Agent',
      tier: 'Pro',
      description: 'When AI tools drift from your instructions, this agent analyzes the gap and generates corrective prompts.',
      example: 'AI built something wrong → Paste the output → Agent identifies the gap → Generates fix prompts → Get back on track.',
      advantages: [
        'Fix broken implementations',
        'Realign AI with your intent',
        'Save time on corrections',
        'Maintain project quality'
      ],
      badge: 'PRO ONLY'
    },
    {
      icon: Shield,
      title: 'AI Role & Persona Management',
      tier: 'Free',
      description: 'Define custom AI roles with coding style, architecture, security, and best practices for consistent outputs.',
      example: 'Set AI role: "Expert React developer using TypeScript, following Material Design" → All prompts use this context.',
      advantages: [
        'Consistent AI behavior',
        'Enforce coding standards',
        'Maintain project style',
        'Better AI understanding'
      ],
      badge: 'FREE'
    },
    {
      icon: MessageSquare,
      title: 'Comments & Discussions',
      tier: 'Plus & Pro',
      description: 'Engage with the community through comments, threaded discussions, and feedback on public projects.',
      example: 'Ask questions on projects → Get help from creators → Share improvements → Build relationships.',
      advantages: [
        'Get community feedback',
        'Learn from discussions',
        'Help other builders',
        'Build your reputation'
      ],
      badge: 'PLUS & PRO'
    },
    {
      icon: Star,
      title: 'Likes & Favorites',
      tier: 'Plus & Pro',
      description: 'Like projects you find useful and save favorites to your personal collection for quick access.',
      example: 'Like projects you find helpful → Save favorites → Build your curated library → Quick access later.',
      advantages: [
        'Bookmark useful projects',
        'Show appreciation',
        'Build personal library',
        'Track what you love'
      ],
      badge: 'PLUS & PRO'
    }
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoadingTestimonials(true);
      try {
        const fetchedTestimonials = await getPublicFeedback(6);
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoadingTestimonials(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoadingTiers(true);
      try {
        const res = await fetch('/api/tiers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch tiers');
        const data = await res.json();
        setTiers(data.tiers || []);
      } catch (error) {
        console.error("Failed to fetch tiers:", error);
        // Fallback to empty array on error
        setTiers([]);
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  // Predefined feature keys
  const PREDEFINED_FEATURES = [
    'projectLimit',
    'fullPromptGeneration',
    'publicProjects',
    'communityAccess',
    'aiPromptEnhancement',
    'executionFollowUpAgent',
    'promptPlayground',
    'support',
  ];

  // Helper function to get tier by ID
  const getTierById = (tierId: string) => {
    return tiers.find(t => t.id === tierId);
  }

  // Helper function to get price display for tier
  const getTierPrice = (tierId: string) => {
    switch (tierId) {
      case 'free':
        return 'Free';
      case 'plus':
        return '$7';
      case 'pro':
        return '$15';
      default:
        return 'Free';
    }
  }

  // Helper function to get custom features (not in predefined list)
  const getCustomFeatures = (features: any) => {
    return Object.keys(features)
      .filter(key => !PREDEFINED_FEATURES.includes(key))
      .map(key => ({ key, value: features[key] }));
  }

  // Helper function to format feature value for display
  const formatFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  }

  const handleCheckout = async (plan: 'plus' | 'pro') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsCheckoutLoading(plan);

    try {
      if (subscriptionPlan == 'plus' || subscriptionPlan == 'pro') {
        toast({
          variant: 'destructive',
          title: 'Checkout Error',
          description: `Please unsubscribe from the ${subscriptionPlan} plan to upgrade to the new ${plan} plan.`,
        });
        setIsCheckoutLoading(null);
        return;
      }
      const checkoutUrl = await createCheckout(plan, user.uid, user.email!, user.displayName!, subscriptionPlan);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: error.message || 'Could not create a checkout session. Please try again.',
      });
      setIsCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
      {/* Dotted grid background pattern matching the image */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #00171f 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
      </div>
      
      {/* Large circular outlines for visual interest */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-full opacity-20" />
        <div className="absolute top-40 right-20 w-80 h-80 border border-gray-200 dark:border-gray-700 rounded-full opacity-15" />
        <div className="absolute bottom-40 left-1/4 w-72 h-72 border border-gray-200 dark:border-gray-700 rounded-full opacity-15" />
      </div>

      {/* Modern header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <span className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight">
              Prompt Genius AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[#00171f] dark:after:bg-white after:transition-all transition-all duration-300 hover:text-[#00171f] dark:hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            {loading ? (
              <Skeleton className="h-10 w-24 rounded-full" />
            ) : user ? (
              <UserNav />
            ) : (
              <Button asChild className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION - Marketing Focused */}
        <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28 text-center relative">
          <h1 className="animate-fade-in-up font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-[#00171f] dark:text-white leading-tight mb-6">
            Build Your First Project Now<br />
            <span className="text-[#00171f] dark:text-white">With Ready-to-Use AI Prompts</span>
          </h1>
          <p className="mt-6 mx-auto max-w-3xl text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in-up delay-100 font-medium">
            Give us your idea. We plan it, let you customize it, generate brilliant features, and deliver one ready-to-use prompt. Copy, paste into your AI coding agent, and start building — all in seconds.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up delay-200">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-xl shadow-[#00171f]/20 group active:scale-95 transition-all duration-200 font-semibold px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform inline-block" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-[#00171f] dark:border-white text-[#00171f] dark:text-white hover:bg-[#00171f] dark:hover:bg-white hover:text-white dark:hover:text-[#00171f] transition-all duration-200 font-medium px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg">
              <Link href="#workflow">See How It Works</Link>
            </Button>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-gray-300 dark:bg-gray-600 mb-16" />

        {/* HOW IT WORKS SECTION - Clean & Simple */}
        <section id="workflow" className="py-20 sm:py-28 relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-[#00171f]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f] dark:text-white mb-4">
                How It Works
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                From idea to ready-to-use prompt in 5 simple steps
              </p>
            </div>

            {/* Steps - Clean Card Layout */}
            <div className="grid gap-6 md:gap-8">
              {/* Step 1 */}
              <div className="flex items-start gap-5 p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 bg-[#00171f] dark:bg-white rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white dark:text-[#00171f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-[#00171f]/50 dark:text-white/50">Step 1</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#00171f] dark:text-white mb-1">Share Your Idea</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Describe your project in plain English — a SaaS app, blog, or any vision you have.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-5 p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 bg-[#00171f] dark:bg-white rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-white dark:text-[#00171f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-[#00171f]/50 dark:text-white/50">Step 2</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#00171f] dark:text-white mb-1">We Plan It For You</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Our AI creates a comprehensive development plan with organized feature categories.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-5 p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 bg-[#00171f] dark:bg-white rounded-xl flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-white dark:text-[#00171f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-[#00171f]/50 dark:text-white/50">Step 3</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#00171f] dark:text-white mb-1">Customize Your Plan</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Select features, adjust priorities, add custom requirements to fit your exact needs.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-5 p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 bg-[#00171f] dark:bg-white rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white dark:text-[#00171f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-[#00171f]/50 dark:text-white/50">Step 4</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#00171f] dark:text-white mb-1">Generate Brilliant Features</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">AI generates detailed, production-ready features with clear specs for each component.</p>
                </div>
              </div>

              {/* Step 5 - Highlighted */}
              <div className="flex items-start gap-5 p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Final Step</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#00171f] dark:text-white mb-1">Copy, Paste & Build</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Get one optimized prompt. Paste it into Claude, GPT, Cursor, or any AI agent and start building.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 sm:py-24 lg:py-32 bg-gray-50/50 dark:bg-[#00171f]/50 overflow-visible">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f] dark:text-white">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium">
                Start free. No credit card required. Upgrade when you're ready to build more projects and unlock advanced features.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Start with Free Tier - No commitment</span>
              </div>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto overflow-visible">
              {/* Hobbyist */}
              {(() => {
                const freeTier = getTierById('free');
                if (!freeTier && loadingTiers) {
                  return <div className="text-center text-gray-500">Loading...</div>;
                }
                const tier = freeTier || { id: 'free', name: 'Hobbyist', features: { projectLimit: 1, fullPromptGeneration: true, publicProjects: false, communityAccess: false, aiPromptEnhancement: false, executionFollowUpAgent: false, promptPlayground: false, cloning: false, support: 'none' } } as Tier;
                const price = getTierPrice('free');
                return (
                  <Card className="flex flex-col bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 dark:hover:border-white/30 transition-all duration-500 group rounded-2xl overflow-hidden">
                    <CardHeader className="text-center">
                      <CardTitle className="font-headline text-2xl text-[#00171f] dark:text-white font-bold">{tier.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">Perfect for getting started and trying out ideas.</CardDescription>
                      <p className="text-5xl font-bold pt-6 text-[#00171f] dark:text-white">{price}</p>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="space-y-3">
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> <span className="font-semibold">{tier.features.projectLimit} project{tier.features.projectLimit > 1 ? 's' : ''}</span></p>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> Convert ideas into projects</p>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> Step-by-step prompts & AI roles</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Share projects with team
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Public projects
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.promptPlayground ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.promptPlayground ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Prompt Playground & Live Testing
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.aiPromptEnhancement ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.aiPromptEnhancement ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} AI Prompt Enhancement
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.executionFollowUpAgent ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.executionFollowUpAgent ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Execution Follow-Up Agent
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.support !== 'none' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.support !== 'none' ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} {tier.features.support === 'none' ? 'No Support' : tier.features.support === 'community' ? 'Community Support' : 'Priority Support'}
                        </p>
                        {/* Custom Features - Display inline with predefined features */}
                        {getCustomFeatures(tier.features).map(({ key, value }) => {
                          const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                          const valueType = typeof value;
                          const hasFeature = valueType === 'boolean' ? value === true : value !== undefined && value !== null && value !== '';
                          return (
                            <p key={key} className={`flex items-center font-medium ${hasFeature ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                              {hasFeature ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} {displayName}{valueType !== 'boolean' && `: ${formatFeatureValue(value)}`}
                            </p>
                          );
                        })}
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button asChild className="w-full bg-white dark:bg-[#00171f] hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-[#00171f] dark:border-white text-[#00171f] dark:text-white font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg">
                        <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                          {user ? subscriptionPlan == 'free' ? 'Go to Dashboard' : `You are subscribed to ${subscriptionPlan} plan` : 'Get Started'}
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })()}
              
              {/* Plus (highlighted) */}
              {(() => {
                const plusTier = getTierById('plus');
                if (!plusTier && loadingTiers) {
                  return <div className="text-center text-gray-500">Loading...</div>;
                }
                const tier = plusTier || { id: 'plus', name: 'Plus', features: { projectLimit: 10, fullPromptGeneration: true, publicProjects: true, communityAccess: true, aiPromptEnhancement: true, executionFollowUpAgent: false, promptPlayground: true, cloning: true, support: 'community' } } as Tier;
                const price = getTierPrice('plus');
                return (
                  <Card className="flex flex-col bg-[#00171f] text-white border-2 border-[#00171f] shadow-2xl shadow-[#00171f]/30 relative scale-105 z-10 rounded-2xl overflow-visible">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-white/30 rounded-t-2xl" />
                    {/* Most Popular Badge - Positioned outside card to avoid clipping */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                      <div className="text-xs font-bold uppercase text-white bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 rounded-full shadow-2xl border-2 border-white/30 whitespace-nowrap">
                        Most Popular
                      </div>
                    </div>
                    <CardHeader className="text-center relative pt-8">
                      <CardTitle className="font-headline text-2xl text-white font-bold">{tier.name}</CardTitle>
                      <CardDescription className="text-gray-300 font-medium">For individuals and small teams shipping projects.</CardDescription>
                      <p className="pt-6">
                        <span className="text-5xl font-bold text-white">{price}</span>
                        <span className="text-gray-300 font-medium">/month</span>
                      </p>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="space-y-3">
                        <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> <span className="font-semibold text-white">{tier.features.projectLimit}+ projects per month</span></p>
                        <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Convert ideas into projects</p>
                        <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Step-by-step prompts & AI roles</p>
                      </div>
                      <div className="pt-2 border-t border-white/20 space-y-3">
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} <span className={tier.features.publicProjects ? 'font-semibold text-white' : ''}>Share projects with team</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} <span className={tier.features.publicProjects ? 'font-semibold text-white' : ''}>Public projects & sharing</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.promptPlayground ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.promptPlayground ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} <span className={tier.features.promptPlayground ? 'font-semibold text-white' : ''}>Prompt Playground & Live Testing</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.aiPromptEnhancement ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.aiPromptEnhancement ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} <span className={tier.features.aiPromptEnhancement ? 'font-semibold text-white' : ''}>AI Prompt Enhancement</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.executionFollowUpAgent ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.executionFollowUpAgent ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} Execution Follow-Up Agent
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.support !== 'none' ? 'text-gray-200' : 'text-gray-400'}`}>
                          {tier.features.support !== 'none' ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} {tier.features.support === 'none' ? 'No Support' : tier.features.support === 'community' ? 'Community Support' : 'Priority Support'}
                        </p>
                        {/* Custom Features - Display inline with predefined features */}
                        {getCustomFeatures(tier.features).map(({ key, value }) => {
                          const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                          const valueType = typeof value;
                          const hasFeature = valueType === 'boolean' ? value === true : value !== undefined && value !== null && value !== '';
                          return (
                            <p key={key} className={`flex items-center font-medium ${hasFeature ? 'text-gray-200' : 'text-gray-400'}`}>
                              {hasFeature ? <CheckCircle className="h-5 w-5 mr-3 text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-500" />} <span className={hasFeature ? 'font-semibold text-white' : ''}>{displayName}{valueType !== 'boolean' && `: ${formatFeatureValue(value)}`}</span>
                            </p>
                          );
                        })}
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button onClick={() => {
                        if (user && subscriptionPlan == 'plus') {
                          router.push('/dashboard');
                        } else {
                          handleCheckout('plus');
                        }
                      }} className="w-full bg-white hover:bg-gray-100 text-[#00171f] border-0 shadow-lg font-semibold py-3 rounded-full transition-all duration-200" disabled={isCheckoutLoading === 'plus'}>
                        {isCheckoutLoading === 'plus' ? <Loader2 className="animate-spin" /> :
                          user ? subscriptionPlan == 'plus' ? 'Go to Dashboard' :
                            subscriptionPlan == 'pro' ?
                              `You are subscribed to ${subscriptionPlan} plan`
                              : 'Get Plus'
                            : 'Get Started'}
                      </Button>
                    </div>
                  </Card>
                );
              })()}
              
              {/* Pro */}
              {(() => {
                const proTier = getTierById('pro');
                if (!proTier && loadingTiers) {
                  return <div className="text-center text-gray-500">Loading...</div>;
                }
                const tier = proTier || { id: 'pro', name: 'Pro', features: { projectLimit: 30, fullPromptGeneration: true, publicProjects: true, communityAccess: true, aiPromptEnhancement: true, executionFollowUpAgent: true, promptPlayground: true, cloning: true, support: 'priority' } } as Tier;
                const price = getTierPrice('pro');
                return (
                  <Card className="flex flex-col bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 dark:hover:border-white/30 transition-all duration-500 group rounded-2xl overflow-hidden">
                    <CardHeader className="text-center">
                      <CardTitle className="font-headline text-2xl text-[#00171f] dark:text-white font-bold">{tier.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">For serious builders who want to ship faster.</CardDescription>
                      <p className="pt-6">
                        <span className="text-5xl font-bold text-[#00171f] dark:text-white">{price}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">/month</span>
                      </p>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="space-y-3">
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> <span className="font-semibold">{tier.features.projectLimit}+ projects per month</span></p>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> Convert ideas into projects</p>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> Step-by-step prompts & AI roles</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Share projects with team
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.publicProjects ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.publicProjects ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} Public projects & sharing
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.promptPlayground ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.promptPlayground ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} <span className={tier.features.promptPlayground ? 'font-semibold text-[#00171f] dark:text-white' : ''}>Prompt Playground & Live Testing</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.aiPromptEnhancement ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.aiPromptEnhancement ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} AI Prompt Enhancement
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.executionFollowUpAgent ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.executionFollowUpAgent ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} <span className={tier.features.executionFollowUpAgent ? 'font-semibold text-[#00171f] dark:text-white' : ''}>Execution Follow-Up Agent</span>
                        </p>
                        <p className={`flex items-center font-medium ${tier.features.support !== 'none' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {tier.features.support !== 'none' ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} <span className={tier.features.support === 'priority' ? 'font-semibold text-[#00171f] dark:text-white' : ''}>{tier.features.support === 'none' ? 'No Support' : tier.features.support === 'community' ? 'Community Support' : 'Priority Support'}</span>
                        </p>
                        {/* Custom Features - Display inline with predefined features */}
                        {getCustomFeatures(tier.features).map(({ key, value }) => {
                          const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                          const valueType = typeof value;
                          const hasFeature = valueType === 'boolean' ? value === true : value !== undefined && value !== null && value !== '';
                          return (
                            <p key={key} className={`flex items-center font-medium ${hasFeature ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                              {hasFeature ? <CheckCircle className="h-5 w-5 mr-3 text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mr-3 text-gray-300 dark:text-gray-600" />} <span className={hasFeature ? 'font-semibold text-[#00171f] dark:text-white' : ''}>{displayName}{valueType !== 'boolean' && `: ${formatFeatureValue(value)}`}</span>
                            </p>
                          );
                        })}
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button onClick={() => {
                        if (user && subscriptionPlan == 'pro') {
                          router.push('/dashboard');
                        } else {
                          handleCheckout('pro');
                        }
                      }} className="w-full bg-white dark:bg-[#00171f] hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-[#00171f] dark:border-white text-[#00171f] dark:text-white font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg" disabled={isCheckoutLoading === 'pro'}>
                        {isCheckoutLoading === 'pro' ? <Loader2 className="animate-spin" /> :
                          user && subscriptionPlan == 'pro' ? 'Go to Dashboard' : `Get Pro`}
                      </Button>
                    </div>
                  </Card>
                );
              })()}
            </div>
            
            {/* Feature Comparison Table */}
            <div className="mt-20 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="font-headline text-2xl font-bold text-[#00171f] dark:text-white mb-2">
                  Compare Plans Side-by-Side
                </h3>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  See exactly what each plan includes
                </p>
              </div>
              <div className="bg-white dark:bg-[#00171f] rounded-2xl border-2 border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <th className="text-left p-4 font-headline font-bold text-[#00171f] dark:text-white">Feature</th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f] dark:text-white">
                          {(() => {
                            const freeTier = getTierById('free');
                            return freeTier?.name || 'Hobbyist';
                          })()}
                        </th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f] dark:text-white relative">
                          <div className="flex items-center justify-center gap-2">
                            {(() => {
                              const plusTier = getTierById('plus');
                              return plusTier?.name || 'Plus';
                            })()}
                            <span className="text-xs font-bold uppercase text-white bg-[#00171f] dark:bg-white dark:text-[#00171f] px-2 py-1 rounded-full">Most Popular</span>
                          </div>
                        </th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f] dark:text-white">
                          {(() => {
                            const proTier = getTierById('pro');
                            return proTier?.name || 'Pro';
                          })()}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(() => {
                        const freeTier = getTierById('free');
                        const plusTier = getTierById('plus');
                        const proTier = getTierById('pro');
                        const free = freeTier || { id: 'free', name: 'Hobbyist', features: { projectLimit: 1, fullPromptGeneration: true, publicProjects: false, communityAccess: false, aiPromptEnhancement: false, executionFollowUpAgent: false, promptPlayground: false, cloning: false, support: 'none' } } as Tier;
                        const plus = plusTier || { id: 'plus', name: 'Plus', features: { projectLimit: 10, fullPromptGeneration: true, publicProjects: true, communityAccess: true, aiPromptEnhancement: true, executionFollowUpAgent: false, promptPlayground: true, cloning: true, support: 'community' } } as Tier;
                        const pro = proTier || { id: 'pro', name: 'Pro', features: { projectLimit: 30, fullPromptGeneration: true, publicProjects: true, communityAccess: true, aiPromptEnhancement: true, executionFollowUpAgent: true, promptPlayground: true, cloning: true, support: 'priority' } } as Tier;
                        const renderCell = (hasFeature: boolean) => hasFeature ? <CheckCircle className="h-5 w-5 mx-auto text-[#00171f] dark:text-white" /> : <XCircle className="h-5 w-5 mx-auto text-gray-300 dark:text-gray-600" />;
                        return (
                          <>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Projects per month</td>
                              <td className="p-4 text-center text-gray-600 dark:text-gray-400">{free.features.projectLimit}</td>
                              <td className="p-4 text-center text-[#00171f] dark:text-white font-semibold">{plus.features.projectLimit}+</td>
                              <td className="p-4 text-center text-[#00171f] dark:text-white font-semibold">{pro.features.projectLimit}+</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Convert ideas into projects</td>
                              <td className="p-4 text-center">{renderCell(free.features.fullPromptGeneration)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.fullPromptGeneration)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.fullPromptGeneration)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Step-by-step prompts & AI roles</td>
                              <td className="p-4 text-center">{renderCell(free.features.fullPromptGeneration)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.fullPromptGeneration)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.fullPromptGeneration)}</td>
                            </tr>
                            <tr className="hover:bg-amber-50/50 dark:hover:bg-amber-900/30 transition-colors bg-amber-50/30 dark:bg-amber-900/20">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Share projects with team</td>
                              <td className="p-4 text-center">{renderCell(free.features.publicProjects)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.publicProjects)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.publicProjects)}</td>
                            </tr>
                            <tr className="hover:bg-amber-50/50 dark:hover:bg-amber-900/30 transition-colors bg-amber-50/30 dark:bg-amber-900/20">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Public projects & sharing</td>
                              <td className="p-4 text-center">{renderCell(free.features.publicProjects)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.publicProjects)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.publicProjects)}</td>
                            </tr>
                            <tr className="hover:bg-amber-50/50 dark:hover:bg-amber-900/30 transition-colors bg-amber-50/30 dark:bg-amber-900/20">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Prompt Playground & Live Testing</td>
                              <td className="p-4 text-center">{renderCell(free.features.promptPlayground)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.promptPlayground)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.promptPlayground)}</td>
                            </tr>
                            <tr className="hover:bg-amber-50/50 dark:hover:bg-amber-900/30 transition-colors bg-amber-50/30 dark:bg-amber-900/20">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">AI Prompt Enhancement</td>
                              <td className="p-4 text-center">{renderCell(free.features.aiPromptEnhancement)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.aiPromptEnhancement)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.aiPromptEnhancement)}</td>
                            </tr>
                            <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-colors bg-blue-50/30 dark:bg-blue-900/20">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Execution Follow-Up Agent</td>
                              <td className="p-4 text-center">{renderCell(free.features.executionFollowUpAgent)}</td>
                              <td className="p-4 text-center">{renderCell(plus.features.executionFollowUpAgent)}</td>
                              <td className="p-4 text-center">{renderCell(pro.features.executionFollowUpAgent)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Support</td>
                              <td className="p-4 text-center text-gray-400 dark:text-gray-500">{free.features.support === 'none' ? 'None' : free.features.support === 'community' ? 'Community' : 'Priority'}</td>
                              <td className="p-4 text-center text-[#00171f] dark:text-white font-medium">{plus.features.support === 'none' ? 'None' : plus.features.support === 'community' ? 'Community' : 'Priority'}</td>
                              <td className="p-4 text-center text-[#00171f] dark:text-white font-semibold">{pro.features.support === 'none' ? 'None' : pro.features.support === 'community' ? 'Community' : 'Priority'}</td>
                            </tr>
                            {/* Custom Features Rows */}
                            {(() => {
                              const freeCustom = getCustomFeatures(free.features);
                              const plusCustom = getCustomFeatures(plus.features);
                              const proCustom = getCustomFeatures(pro.features);
                              const allCustomKeys = Array.from(new Set([
                                ...freeCustom.map(f => f.key),
                                ...plusCustom.map(f => f.key),
                                ...proCustom.map(f => f.key),
                              ]));
                              
                              return allCustomKeys.map(customKey => {
                                const freeValue = free.features[customKey];
                                const plusValue = plus.features[customKey];
                                const proValue = pro.features[customKey];
                                const displayName = customKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                                
                                // Helper to render cell value based on type
                                const renderCustomCell = (value: any) => {
                                  if (value === undefined || value === null) {
                                    return <span className="text-gray-400 dark:text-gray-500">—</span>;
                                  }
                                  const valueType = typeof value;
                                  if (valueType === 'boolean') {
                                    return value ? (
                                      <CheckCircle className="h-5 w-5 mx-auto text-[#00171f] dark:text-white" />
                                    ) : (
                                      <XCircle className="h-5 w-5 mx-auto text-gray-300 dark:text-gray-600" />
                                    );
                                  }
                                  return <span>{formatFeatureValue(value)}</span>;
                                };
                                
                                return (
                                  <tr key={customKey} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-t border-gray-200 dark:border-gray-700">
                                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 capitalize">{displayName}</td>
                                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                                      {renderCustomCell(freeValue)}
                                    </td>
                                    <td className="p-4 text-center text-[#00171f] dark:text-white">
                                      {renderCustomCell(plusValue)}
                                    </td>
                                    <td className="p-4 text-center text-[#00171f] dark:text-white">
                                      {renderCustomCell(proValue)}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-gray-300 dark:bg-gray-600 my-16" />

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 sm:py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f] dark:text-white">
                Loved by Developers and Builders
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium">
                See how developers and builders are shipping products faster with ready-to-use AI prompts.
              </p>
              <div className="mt-10">
                <Button
                  onClick={() => setIsFeedbackDialogOpen(true)}
                  className="bg-white dark:bg-[#00171f] hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-[#00171f] dark:border-white text-[#00171f] dark:text-white font-medium px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Leave a Review
                </Button>
              </div>
            </div>
            <div className="mt-16">
              {loadingTestimonials ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                      <CardContent className="pt-6">
                        <Skeleton className="h-24 w-full rounded-lg" />
                      </CardContent>
                      <CardHeader>
                        <Skeleton className="h-16 w-full rounded-lg" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : testimonials.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="relative bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 hover:border-[#00171f]/30 dark:hover:border-white/30 transition-all duration-500 group hover:shadow-xl rounded-2xl overflow-hidden">
                      <div className="absolute top-4 right-4 text-[#00171f]/10 dark:text-white/10 text-6xl font-serif">"</div>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="ring-2 ring-gray-100 group-hover:ring-[#00171f]/20 transition-all duration-300 h-12 w-12">
                            <AvatarImage src={testimonial.author.photoURL || undefined} alt={testimonial.author.name} />
                            <AvatarFallback className="bg-[#00171f] text-white font-semibold">
                              {getInitials(testimonial.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-bold text-[#00171f] dark:text-white">{testimonial.author.name}</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400 font-medium">User</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-[#00171f] dark:fill-white text-[#00171f] dark:text-white" />
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed">"{testimonial.comments}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-900">
                  <MessageSquare className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-6 text-2xl font-bold text-[#00171f] dark:text-white">Be the First to Share Your Story</h3>
                  <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">Your feedback helps us improve and inspires other creators.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-20 sm:py-24 lg:py-32 relative overflow-hidden bg-[#00171f]">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-40 h-40 border border-white/10 rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white/20 rounded-full" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-white dark:text-white mb-8">
              From Idea to Code in Seconds
            </h2>
            <p className="text-xl sm:text-2xl text-gray-300 dark:text-gray-200 mb-10 max-w-3xl mx-auto font-medium">
              Join developers and builders who are turning their ideas into ready-to-use prompts. Copy, paste into any AI coding agent, and start building instantly.
            </p>
            <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-[#00171f] border-0 shadow-xl group active:scale-95 transition-all duration-200 font-bold px-10 py-4 rounded-full text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Building Today
                <Rocket className="ml-3 h-6 w-6 group-hover:translate-y-[-3px] transition-transform" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-0">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} Prompt Genius AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white transition-colors font-medium">
              Privacy Policy
            </Link>
            <div className="flex items-center gap-4">
              <a href="https://x.com/PGAIAPP" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-[#00171f] dark:hover:text-white transition-colors" aria-label="Follow us on X">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/pgeniusai/?hl=en" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-[#00171f] dark:hover:text-white transition-colors" aria-label="Follow us on Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.reddit.com/user/ExaminationIll4180/" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-[#00171f] dark:hover:text-white transition-colors" aria-label="Follow us on Reddit">
                <RedditIcon className="h-5 w-5" />
              </a>
              <a href="mailto:support@prompt-genius-ai.com" className="text-gray-400 dark:text-gray-500 hover:text-[#00171f] dark:hover:text-white transition-colors" aria-label="Contact us via email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </div>
  )
}
