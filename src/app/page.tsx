'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code, ArrowRight, MessageSquare, Rocket, XCircle, Loader2, Mail } from 'lucide-react';
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
      icon: Sparkles,
      title: 'AI-Powered Idea Enhancement',
      description: 'Turn your vague concepts into detailed, actionable project plans. Our AI refines your ideas, adding depth and clarity.',
    },
    {
      icon: ClipboardCheck,
      title: 'Step-by-Step Prompt Generation',
      description: 'Receive a complete, sequential development plan with copy-paste ready prompts for both frontend and backend tasks.',
    },
    {
      icon: Code,
      title: 'Multi-Platform Support',
      description: 'Get prompts tailored for a variety of platforms, including Firebase, Replit, Lovable, n8n, and ChatGPT.',
    },
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoadingTestimonials(true);
      try {
        const fetchedTestimonials = await getPublicFeedback(6); // Fetch top 6 testimonials
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 relative overflow-x-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] bg-gradient-to-tl from-purple-300/30 via-pink-300/20 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Modern header with glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <span className="font-headline text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Prompt Genius AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-slate-700 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500 after:transition-all transition-all duration-300 hover:text-indigo-600 hover:scale-105"
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
              <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all duration-200 font-medium px-6 py-2 rounded-full">
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Enhanced HERO SECTION */}
        <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 text-center relative">
          <div className="absolute inset-0 flex justify-center items-start pointer-events-none -z-10">
            <div className="w-96 h-32 bg-gradient-to-r from-indigo-400/30 to-purple-400/20 blur-3xl rounded-full mt-[-48px]" />
          </div>
          <h1 className="animate-fade-in-up font-headline text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            Turn Your Vague Idea<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Into a Concrete Plan
            </span>
          </h1>
          <p className="mt-8 mx-auto max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed animate-fade-in-up font-medium">
            Stop wondering where to start. Prompt Genius AI decomposes your biggest ideas into a clear, sequential development plan with actionable prompts for every step.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up">
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 group active:scale-95 transition-all duration-200 font-semibold px-8 py-3 rounded-full text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Forging
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 font-medium px-8 py-3 rounded-full text-lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-12 opacity-60" />

        {/* Enhanced FEATURES SECTION */}
        <section id="features" className="py-20 sm:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/50 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                A Smarter Way to Build
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600 font-medium">
                From concept to code, we've got you covered. Our features are designed to eliminate guesswork and accelerate your development process.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <Card
                  key={i}
                  className="relative bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200 transition-all duration-500 group overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 right-0 w-2/3 h-1/3 bg-gradient-to-tr from-indigo-100/40 via-purple-100/20 to-transparent blur-2xl rounded-tl-2xl pointer-events-none" />
                  <CardHeader className="relative z-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/25 transition-all duration-300">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-6 font-headline text-indigo-800 text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-slate-600 font-medium leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-12 opacity-60" />

        {/* Enhanced TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 sm:py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                Loved by Developers and Founders
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600 font-medium">
                Don't just take our word for it. Here's what our users have to say about their experience with Prompt Genius AI.
              </p>
              <div className="mt-10">
                <Button
                  onClick={() => setIsFeedbackDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 text-indigo-700 font-medium px-6 py-3 rounded-full transition-all duration-200 hover:shadow-lg"
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
                    <Card key={i} className="bg-white/80 backdrop-blur-xl border-white/50 rounded-2xl shadow-lg">
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
                    <Card key={testimonial.id} className="relative bg-white/90 backdrop-blur-xl border border-white/50 hover:border-indigo-200 transition-all duration-500 group hover:shadow-2xl hover:shadow-indigo-500/20 rounded-2xl overflow-hidden">
                      <div className="absolute -top-6 -left-6 opacity-10 text-6xl pointer-events-none">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M7 17c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-300 h-12 w-12">
                            <AvatarImage src={testimonial.author.photoURL || undefined} alt={testimonial.author.name} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                              {getInitials(testimonial.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-800">{testimonial.author.name}</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">User</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-slate-700 italic font-medium leading-relaxed">"{testimonial.comments}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-indigo-200 rounded-3xl bg-white/60 backdrop-blur-xl">
                  <MessageSquare className="mx-auto h-16 w-16 text-indigo-300" />
                  <h3 className="mt-6 text-2xl font-bold text-slate-800">Be the First to Share Your Story</h3>
                  <p className="mt-3 text-slate-600 font-medium">Your feedback helps us improve and inspires other creators.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-12 opacity-60" />

        {/* Enhanced PRICING SECTION */}
        <section id="pricing" className="py-20 sm:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600 font-medium">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {/* Hobbyist */}
              <Card className="flex flex-col bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200 transition-all duration-500 group rounded-2xl overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl text-indigo-700 font-bold">Hobbyist</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">Perfect for getting started and trying out ideas.</CardDescription>
                  <p className="text-5xl font-bold pt-6 text-indigo-700">Free</p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> 1 project</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-muted-foreground font-medium"><XCircle className="h-5 w-5 mr-3 text-muted-foreground" /> Public Projects</p>
                  <p className="flex items-center text-muted-foreground font-medium"><XCircle className="h-5 w-5 mr-3 text-muted-foreground" /> Community Access</p>
                  <p className="flex items-center text-muted-foreground font-medium"><XCircle className="h-5 w-5 mr-3 text-muted-foreground" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-muted-foreground font-medium"><XCircle className="h-5 w-5 mr-3 text-muted-foreground" /> No Support</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 text-indigo-700 font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg">
                    <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                      {user ? subscriptionPlan == 'free' ? 'Go to Dashboard' : `You are subscribed to ${subscriptionPlan} plan` : 'Get Started'}
                    </Link>
                  </Button>
                </div>
              </Card>
              {/* Plus (highlighted) */}
              <Card className="flex flex-col bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 backdrop-blur-xl border-indigo-200 shadow-2xl shadow-indigo-500/30 relative overflow-hidden scale-105 z-10 rounded-2xl">
                <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <CardHeader className="text-center">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-2xl text-indigo-700 font-bold">Plus</CardTitle>
                    <div className="text-xs font-bold uppercase text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 rounded-full shadow-lg animate-pulse">
                      Most Popular
                    </div>
                  </div>
                  <CardDescription className="text-slate-600 font-medium">For individuals and small teams shipping projects.</CardDescription>
                  <p className="pt-6">
                    <span className="text-5xl font-bold text-indigo-700">$15</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> 10 projects</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Community Access</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Community Support</p>
                  <p className="flex items-center text-muted-foreground font-medium"><XCircle className="h-5 w-5 mr-3 text-muted-foreground" /> AI Prompt Enhancement</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button onClick={() => {
                    if (user && subscriptionPlan == 'plus') {
                      router.push('/dashboard');
                    } else {
                      handleCheckout('plus');
                    }
                  }} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold py-3 rounded-full transition-all duration-200" disabled={isCheckoutLoading === 'plus'}>
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
              <Card className="flex flex-col bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200 transition-all duration-500 group rounded-2xl overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl text-indigo-700 font-bold">Pro</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">For serious builders who want to ship faster.</CardDescription>
                  <p className="pt-6">
                    <span className="text-5xl font-bold text-indigo-700">$20</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> 30+ projects</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Community Access</p>
                  <p className="flex items-center text-slate-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-green-500" /> Priority Support</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button onClick={() => {
                    if (user && subscriptionPlan == 'pro') {
                      router.push('/dashboard');
                    } else {
                      handleCheckout('pro');
                    }
                  }} className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 text-indigo-700 font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg" disabled={isCheckoutLoading === 'pro'}>
                    {isCheckoutLoading === 'pro' ? <Loader2 className="animate-spin" /> :
                      user && subscriptionPlan == 'pro' ? 'Go to Dashboard' : `Get Pro`}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Enhanced CALL TO ACTION SECTION */}
        <section className="py-20 sm:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 to-purple-200/40 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-slate-900 mb-8">
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-xl sm:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto font-medium">
              Join thousands of developers who are building faster and smarter with Prompt Genius AI.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 group active:scale-95 transition-all duration-200 font-bold px-10 py-4 rounded-full text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Building Today
                <Rocket className="ml-3 h-6 w-6 group-hover:translate-y-[-3px] transition-transform" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Enhanced footer */}
      <footer className="border-t border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mb-6 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-0">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className='ml-1 mr-1'
            />
            <p className="text-sm text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Prompt Genius AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/terms" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium">
              Privacy Policy
            </Link>
            {/* Social icons */}
            <a href="mailto:support@prompt-genius-ai.com" className="text-slate-400 hover:text-indigo-600 transition-colors"><Mail className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>

      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </div>
  )


}
