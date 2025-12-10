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
        <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center relative">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 border border-gray-200 rounded-full animate-float opacity-50" />
          <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200 rounded-full animate-float delay-300 opacity-50" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#00171f] rounded-full animate-subtle-pulse" />
          <div className="absolute bottom-40 left-20 w-2 h-2 bg-[#00171f] rounded-full animate-subtle-pulse delay-200" />
          
          <h1 className="animate-fade-in-up font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-[#00171f] leading-tight">
            Turn Your Vague Idea<br />
            <span className="relative">
              Into a Concrete Plan
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#00171f]/20" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </span>
          </h1>
          <p className="mt-8 mx-auto max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed animate-fade-in-up delay-100">
            Stop wondering where to start. Prompt Genius AI decomposes your biggest ideas into a clear, sequential development plan with actionable prompts for every step.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up delay-200">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-xl shadow-[#00171f]/20 group active:scale-95 transition-all duration-200 font-semibold px-8 py-3 rounded-full text-lg">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Forging
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-[#00171f] text-[#00171f] hover:bg-[#00171f] hover:text-white transition-all duration-200 font-medium px-8 py-3 rounded-full text-lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-32 mx-auto bg-[#00171f]/20 mb-12" />

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 sm:py-24 lg:py-32 relative bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f]">
                A Smarter Way to Build
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                From concept to code, we've got you covered. Our features are designed to eliminate guesswork and accelerate your development process.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <Card
                  key={i}
                  className="relative bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 transition-all duration-500 group overflow-hidden rounded-2xl"
                >
                  <CardHeader className="relative z-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00171f] text-white shadow-lg group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-6 font-headline text-[#00171f] text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-600 font-medium leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
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
                Loved by Developers and Founders
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                Don't just take our word for it. Here's what our users have to say about their experience with Prompt Genius AI.
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
        <section id="pricing" className="py-20 sm:py-24 lg:py-32 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl md:text-5xl text-[#00171f]">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 font-medium">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {/* Hobbyist */}
              <Card className="flex flex-col bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#00171f]/30 transition-all duration-500 group rounded-2xl overflow-hidden">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl text-[#00171f] font-bold">Hobbyist</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Perfect for getting started and trying out ideas.</CardDescription>
                  <p className="text-5xl font-bold pt-6 text-[#00171f]">Free</p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> 1 project</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Full Prompt Generation</p>
                  <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> Public Projects</p>
                  <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> Community Access</p>
                  <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-300" /> No Support</p>                
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
              <Card className="flex flex-col bg-[#00171f] text-white border-0 shadow-2xl shadow-[#00171f]/30 relative overflow-hidden scale-105 z-10 rounded-2xl">
                <div className="absolute top-0 right-0 left-0 h-1 bg-white/30" />
                <CardHeader className="text-center">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-2xl text-white font-bold">Plus</CardTitle>
                    <div className="text-xs font-bold uppercase text-[#00171f] bg-white px-4 py-2 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  </div>
                  <CardDescription className="text-gray-300 font-medium">For individuals and small teams shipping projects.</CardDescription>
                  <p className="pt-6">
                    <span className="text-5xl font-bold text-white">$7</span>
                    <span className="text-gray-300 font-medium">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> 10+ projects</p>
                  <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Full Prompt Generation</p>
                  <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Community Access</p>
                  <p className="flex items-center text-gray-400 font-medium"><XCircle className="h-5 w-5 mr-3 text-gray-500" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-gray-200 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-white" /> Community Support</p>
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
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> 30+ projects</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Full Prompt Generation</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Community Access</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-gray-600 font-medium"><CheckCircle className="h-5 w-5 mr-3 text-[#00171f]" /> Priority Support</p>
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
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto font-medium">
              Join thousands of developers who are building faster and smarter with Prompt Genius AI.
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
