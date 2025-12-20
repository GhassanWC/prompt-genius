'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code, ArrowRight, MessageSquare, Rocket, XCircle, Loader2, Mail, Bot, Wrench, Users, Lightbulb, ListChecks, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { getPublicFeedback, type Testimonial } from '@/lib/feedback';
import { createCheckout } from '@/lib/lemon';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, loading, subscriptionPlan } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Community', href: '/community' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'Pricing', href: '#pricing' },
  ];

  const features = [
    {
      icon: Lightbulb,
      title: 'Turn Ideas into Actionable Prompts',
      description: 'Stuck on what to ask your AI? Describe your product idea and get a complete breakdown with copy-paste ready prompts. Each prompt includes the right AI role and clear instructions — no guesswork.',
    },
    {
      icon: ListChecks,
      title: 'Step-by-Step Development Plan',
      description: 'Get a sequential roadmap with prompts for every task. From setup to deployment, each step has a ready-to-use prompt with specific AI roles. Just copy, paste, and build.',
    },
    {
      icon: Share2,
      title: 'Share & Collaborate',
      description: 'Share your project prompts with your team. Make projects public to showcase your work or keep them private. Collaborate seamlessly with built-in sharing features.',
    },
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
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
    <div className="min-h-screen bg-white text-[#00171f] relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Modern header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <span className="font-headline text-xl text-[#00171f] tracking-tight">
              Prompt Genius AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[#00171f] after:transition-all transition-all duration-300 hover:text-[#00171f]"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
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
        {/* HERO SECTION */}
        <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-center relative">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 border border-gray-200 rounded-full animate-float opacity-50" />
          <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200 rounded-full animate-float delay-300 opacity-50" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#00171f] rounded-full animate-subtle-pulse" />
          <div className="absolute bottom-40 left-20 w-2 h-2 bg-[#00171f] rounded-full animate-subtle-pulse delay-200" />
          
          <h1 className="animate-fade-in-up font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-[#00171f] leading-tight">
            Build Your First Project Now<br />
            <span className="relative">
              With Ready-to-Use AI Prompts
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#00171f]/20" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </span>
          </h1>
          <p className="mt-6 mx-auto max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed animate-fade-in-up delay-100">
            Stop staring at blank pages. Turn your product idea into step-by-step AI prompts in seconds — copy, paste, and build faster than ever.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up delay-200">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-xl shadow-[#00171f]/20 group active:scale-95 transition-all duration-200 font-semibold px-10 py-4 rounded-full text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-[#00171f] text-[#00171f] hover:bg-[#00171f] hover:text-white transition-all duration-200 font-medium px-8 py-4 rounded-full text-lg">
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-[#00171f]/20 mb-12" />

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 sm:py-24 lg:py-32 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#00171f]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00171f]/5 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f] mb-4">
                How It Works
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                Describe your product idea. We break it down into step-by-step prompts with specific AI roles. Copy, paste, and build — no more staring at blank pages wondering what to ask your AI.
              </p>
            </div>
            
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
              {features.map((feature, i) => {
                const isMiddle = i === 1;
                return (
                  <div
                    key={i}
                    className={`relative group ${isMiddle ? 'lg:-mt-8' : ''}`}
                  >
                    {/* Gradient background card */}
                    <div className={`relative h-full rounded-3xl p-8 sm:p-10 overflow-hidden transition-all duration-500 ${
                      isMiddle 
                        ? 'bg-gradient-to-br from-[#00171f] to-[#00171f]/90 text-white shadow-2xl scale-105' 
                        : 'bg-white border-2 border-gray-100 hover:border-[#00171f]/30 shadow-lg hover:shadow-2xl'
                    }`}>
                      {/* Decorative gradient overlay */}
                      {!isMiddle && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00171f]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      )}
                      
                      {/* Animated background pattern */}
                      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }} />
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Icon with animated background - Centered */}
                        <div className={`relative flex items-center justify-center mb-8 ${
                          isMiddle 
                            ? 'bg-white/20 backdrop-blur-sm' 
                            : 'bg-gradient-to-br from-[#00171f] to-[#00171f]/80'
                        } rounded-2xl p-6 w-24 h-24 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className={`h-14 w-14 ${isMiddle ? 'text-white' : 'text-white'}`} />
                          {/* Glow effect */}
                          <div className={`absolute inset-0 rounded-2xl ${
                            isMiddle ? 'bg-white/30' : 'bg-[#00171f]/20'
                          } blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </div>
                        
                        {/* Title */}
                        <h3 className={`text-2xl font-bold font-headline mb-4 ${
                          isMiddle ? 'text-white' : 'text-[#00171f]'
                        }`}>
                          {feature.title}
                        </h3>
                        
                        {/* Description */}
                        <p className={`leading-relaxed text-base ${
                          isMiddle ? 'text-gray-100' : 'text-gray-600'
                        } font-medium`}>
                          {feature.description}
                        </p>
                      </div>
                      
                      {/* Corner accent */}
                      <div className={`absolute top-0 right-0 w-32 h-32 ${
                        isMiddle ? 'bg-white/10' : 'bg-[#00171f]/5'
                      } rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GOLDEN FEATURE - Execution Follow-Up Agent */}
        <section className="py-20 sm:py-24 lg:py-32 relative bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="relative bg-gradient-to-br from-amber-100/50 via-white to-amber-50/50 rounded-3xl border-2 border-amber-200/50 shadow-2xl shadow-amber-500/10 p-8 sm:p-12 overflow-hidden">
                {/* PRO FEATURE Badge - Top Right */}
                <div className="absolute top-6 right-6 z-20 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white">
                  PRO FEATURE
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-10">
                  {/* Full Robot Illustration */}
                  <div className="relative flex-shrink-0">
                    <div className="relative w-32 h-40 sm:w-40 sm:h-48 flex flex-col items-center justify-center">
                      {/* Robot Head */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 mb-2">
                        <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                      </div>
                      {/* Robot Body */}
                      <div className="relative w-24 h-16 sm:w-28 sm:h-20 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-xl shadow-lg flex items-center justify-center">
                        {/* Body details */}
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        </div>
                      </div>
                      {/* Robot Arms */}
                      <div className="absolute left-0 top-8 sm:top-10 flex flex-col gap-2">
                        <div className="w-3 h-8 sm:w-4 sm:h-10 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full"></div>
                      </div>
                      <div className="absolute right-0 top-8 sm:top-10 flex flex-col gap-2">
                        <div className="w-3 h-8 sm:w-4 sm:h-10 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full"></div>
                      </div>
                      {/* Wrench in hand */}
                      <div className="absolute -right-2 top-12 sm:top-14 w-6 h-6 sm:w-8 sm:h-8 bg-[#00171f] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      {/* Robot Legs */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3">
                        <div className="w-4 h-6 sm:w-5 sm:h-8 bg-gradient-to-b from-amber-700 to-amber-800 rounded-b-lg"></div>
                        <div className="w-4 h-6 sm:w-5 sm:h-8 bg-gradient-to-b from-amber-700 to-amber-800 rounded-b-lg"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h2 className="text-3xl sm:text-4xl font-bold font-headline text-[#00171f] mb-3">
                      Execution Follow-Up Agent
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6 font-medium">
                      When AI tools drift from your instructions, our agent analyzes the gap and generates corrective prompts to realign them with your intent. Repair broken prompts and get back on track instantly.
                    </p>
                    <div className="flex justify-center sm:justify-start">
                      <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg shadow-amber-500/30 font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:shadow-xl hover:scale-105">
                        <Link href={loading ? "/login" : user ? "/execution-follow-up" : "/login"}>
                          Try Execution Follow-Up Agent
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-[#00171f]/20 my-12" />

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 sm:py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f]">
                Loved by Developers and Builders
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                See how developers and builders are shipping products faster with ready-to-use AI prompts.
              </p>
              <div className="mt-10">
                <Button
                  onClick={() => setIsFeedbackDialogOpen(true)}
                  className="bg-white hover:bg-gray-50 border-2 border-[#00171f] text-[#00171f] font-medium px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
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
                    <Card key={testimonial.id} className="relative bg-white border border-gray-200 hover:border-[#00171f]/30 transition-all duration-500 group hover:shadow-xl rounded-2xl overflow-hidden">
                      <div className="absolute top-4 right-4 text-[#00171f]/10 text-6xl font-serif">"</div>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="ring-2 ring-gray-100 group-hover:ring-[#00171f]/20 transition-all duration-300 h-12 w-12">
                            <AvatarImage src={testimonial.author.photoURL || undefined} alt={testimonial.author.name} />
                            <AvatarFallback className="bg-[#00171f] text-white font-semibold">
                              {getInitials(testimonial.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-bold text-[#00171f]">{testimonial.author.name}</CardTitle>
                            <CardDescription className="text-gray-500 font-medium">User</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-[#00171f] text-[#00171f]" />
                          ))}
                        </div>
                        <p className="text-gray-700 italic font-medium leading-relaxed">"{testimonial.comments}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50">
                  <MessageSquare className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-6 text-2xl font-bold text-[#00171f]">Be the First to Share Your Story</h3>
                  <p className="mt-3 text-gray-600 font-medium">Your feedback helps us improve and inspires other creators.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-[#00171f]/20 my-12" />

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 sm:py-24 lg:py-32 bg-gray-50/50 overflow-visible">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f]">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto overflow-visible">
              {/* Hobbyist */}
              <Card className="flex flex-col bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 transition-all duration-500 group rounded-2xl overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl text-[#00171f] font-bold">Hobbyist</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Perfect for getting started and trying out ideas.</CardDescription>
                  <p className="text-5xl font-bold pt-6 text-[#00171f]">Free</p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-3">
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> <span className="font-semibold">1 project</span></p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Convert ideas into projects</p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Step-by-step prompts & AI roles</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> Share projects with team</p>
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> Public projects</p>
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> AI Prompt Enhancement</p>
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> Execution Follow-Up Agent</p>
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> No Support</p>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full bg-white hover:bg-gray-50 border-2 border-[#00171f] text-[#00171f] font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg">
                    <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                      {user ? subscriptionPlan == 'free' ? 'Go to Dashboard' : `You are subscribed to ${subscriptionPlan} plan` : 'Get Started'}
                    </Link>
                  </Button>
                </div>
              </Card>
              
              {/* Plus (highlighted) */}
              <Card className="flex flex-col bg-[#00171f] text-white border-2 border-[#00171f] shadow-2xl shadow-[#00171f]/30 relative scale-105 z-10 rounded-2xl overflow-visible">
                <div className="absolute top-0 right-0 left-0 h-1 bg-white/30 rounded-t-2xl" />
                {/* Most Popular Badge - Positioned outside card to avoid clipping */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                  <div className="text-xs font-bold uppercase text-white bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 rounded-full shadow-2xl border-2 border-white/30 whitespace-nowrap">
                    Most Popular
                  </div>
                </div>
                <CardHeader className="text-center relative pt-8">
                  <CardTitle className="font-headline text-2xl text-white font-bold">Plus</CardTitle>
                  <CardDescription className="text-gray-300 font-medium">For individuals and small teams shipping projects.</CardDescription>
                  <p className="pt-6">
                    <span className="text-5xl font-bold text-white">$7</span>
                    <span className="text-gray-300 font-medium">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-3">
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> <span className="font-semibold text-white">10+ projects per month</span></p>
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Convert ideas into projects</p>
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Step-by-step prompts & AI roles</p>
                  </div>
                  <div className="pt-2 border-t border-white/20 space-y-3">
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> <span className="font-semibold text-white">Share projects with team</span></p>
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> <span className="font-semibold text-white">Public projects & sharing</span></p>
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> <span className="font-semibold text-white">AI Prompt Enhancement</span></p>
                    <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-500" /> Execution Follow-Up Agent</p>
                    <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Community Support</p>
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
              
              {/* Pro */}
              <Card className="flex flex-col bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 transition-all duration-500 group rounded-2xl overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl text-[#00171f] font-bold">Pro</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">For serious builders who want to ship faster.</CardDescription>
                  <p className="pt-6">
                    <span className="text-5xl font-bold text-[#00171f]">$15</span>
                    <span className="text-gray-500 font-medium">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-3">
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> <span className="font-semibold">30+ projects per month</span></p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Convert ideas into projects</p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Step-by-step prompts & AI roles</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Share projects with team</p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Public projects & sharing</p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> AI Prompt Enhancement</p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> <span className="font-semibold text-[#00171f]">Execution Follow-Up Agent</span></p>
                    <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> <span className="font-semibold text-[#00171f]">Priority Support</span></p>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button onClick={() => {
                    if (user && subscriptionPlan == 'pro') {
                      router.push('/dashboard');
                    } else {
                      handleCheckout('pro');
                    }
                  }} className="w-full bg-white hover:bg-gray-50 border-2 border-[#00171f] text-[#00171f] font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg" disabled={isCheckoutLoading === 'pro'}>
                    {isCheckoutLoading === 'pro' ? <Loader2 className="animate-spin" /> :
                      user && subscriptionPlan == 'pro' ? 'Go to Dashboard' : `Get Pro`}
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Feature Comparison Table */}
            <div className="mt-20 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="font-headline text-2xl font-bold text-[#00171f] mb-2">
                  Compare Plans Side-by-Side
                </h3>
                <p className="text-gray-600 font-medium">
                  See exactly what each plan includes
                </p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left p-4 font-headline font-bold text-[#00171f]">Feature</th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f]">Hobbyist</th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f] relative">
                          <div className="flex items-center justify-center gap-2">
                            Plus
                            <span className="text-xs font-bold uppercase text-white bg-[#00171f] px-2 py-1 rounded-full">Most Popular</span>
                          </div>
                        </th>
                        <th className="text-center p-4 font-headline font-bold text-[#00171f]">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">Projects per month</td>
                        <td className="p-4 text-center text-gray-600">1</td>
                        <td className="p-4 text-center text-[#00171f] font-semibold">10+</td>
                        <td className="p-4 text-center text-[#00171f] font-semibold">30+</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">Convert ideas into projects</td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">Step-by-step prompts & AI roles</td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors bg-amber-50/30">
                        <td className="p-4 font-medium text-gray-700">Share projects with team</td>
                        <td className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-gray-300" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors bg-amber-50/30">
                        <td className="p-4 font-medium text-gray-700">Public projects & sharing</td>
                        <td className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-gray-300" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors bg-amber-50/30">
                        <td className="p-4 font-medium text-gray-700">AI Prompt Enhancement</td>
                        <td className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-gray-300" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors bg-blue-50/30">
                        <td className="p-4 font-medium text-gray-700">Execution Follow-Up Agent</td>
                        <td className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-gray-300" /></td>
                        <td className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-gray-300" /></td>
                        <td className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-[#00171f]" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">Support</td>
                        <td className="p-4 text-center text-gray-400">None</td>
                        <td className="p-4 text-center text-[#00171f] font-medium">Community</td>
                        <td className="p-4 text-center text-[#00171f] font-semibold">Priority</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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
            <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-white mb-8">
              Stop Staring at Blank Pages
            </h2>
            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto font-medium">
              Join developers and builders who are shipping products faster with ready-to-use AI prompts.
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
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-0">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <p className="text-sm text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} Prompt Genius AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-[#00171f] transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#00171f] transition-colors font-medium">
              Privacy Policy
            </Link>
            <a href="mailto:support@prompt-genius-ai.com" className="text-gray-400 hover:text-[#00171f] transition-colors"><Mail className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>

      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </div>
  )
}
