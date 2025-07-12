
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code, ArrowRight, MessageSquare, Rocket, Github, Linkedin, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { getPublicFeedback, type Testimonial } from '@/lib/feedback';


export default function LandingPage() {
  const { user, loading } = useAuth();
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  
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


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-indigo-100 to-purple-100 text-slate-800 relative">
      {/* Animated soft blobs + optional subtle texture */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-indigo-200/50 via-purple-200/40 to-pink-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[40vw] bg-gradient-to-tr from-purple-100/30 via-indigo-100/20 to-blue-100/10 rounded-full blur-3xl animate-pulse delay-1000" />
        {/* Optional: subtle noise overlay */}
        {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" /> */}
      </div>
  
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg shadow-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold group">
            <Logo className="h-7 w-7 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
            <span className="font-headline text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Prompt Genius AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-slate-700 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gradient-to-r after:from-indigo-400 after:to-purple-400 after:transition-all transition-colors duration-200 hover:text-indigo-700"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {loading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : user ? (
              <UserNav />
            ) : (
              <>
                <Button asChild variant="ghost" className="text-slate-700 hover:text-indigo-600 hover:bg-indigo-100/40">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow active:scale-95 transition-transform">
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
  
      <main className="flex-grow relative z-10">
        {/* HERO SECTION */}
        <section id="hero" className="max-w-7xl mx-auto px-4 py-28 text-center sm:py-36 relative">
          <div className="absolute inset-0 flex justify-center items-start pointer-events-none -z-1">
            <div className="w-96 h-32 bg-indigo-300/30 blur-2xl rounded-full mt-[-48px]" />
          </div>
          <h1 className="animate-fade-in-up font-headline text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-b from-slate-900 via-indigo-700 to-purple-600 bg-clip-text text-transparent drop-shadow">
            Turn Your Vague Idea<br />
            Into a Concrete Plan
          </h1>
          <p className="mt-7 mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed animate-fade-in-up">
            Stop wondering where to start. Prompt Genius AI decomposes your biggest ideas into a clear, sequential development plan with actionable prompts for every step.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up">
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow group active:scale-95">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Forging
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-100/40">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>
  
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-200 rounded-full mb-8 opacity-40" />
  
        {/* FEATURES SECTION */}
        <section id="features" className="py-20 sm:py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-100/30 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center">
              <h2 className="font-headline text-4xl font-bold md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                A Smarter Way to Build
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                From concept to code, we've got you covered. Our features are designed to eliminate guesswork and accelerate your development process.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <Card
                  key={i}
                  className="relative bg-white/80 backdrop-blur-2xl border border-indigo-100 shadow-xl hover:scale-[1.04] hover:shadow-indigo-200/80 hover:border-indigo-400 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute bottom-0 right-0 w-2/3 h-1/3 bg-gradient-to-tr from-indigo-100/30 via-purple-100/20 to-transparent blur-2xl rounded-tl-2xl pointer-events-none" />
                  <CardHeader>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="mt-6 font-headline text-indigo-700 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
  
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-200 rounded-full mb-8 opacity-40" />
  
        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-4xl font-bold md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                Loved by Developers and Founders
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                Don't just take our word for it. Here's what our users have to say about their experience with Prompt Genius AI.
              </p>
              <div className="mt-8">
                <Button 
                  onClick={() => setIsFeedbackDialogOpen(true)}
                  className="bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Leave a Review
                </Button>
              </div>
            </div>
            <div className="mt-12">
              {loadingTestimonials ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur-xl border-indigo-100">
                      <CardContent className="pt-6">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                      <CardHeader>
                        <Skeleton className="h-12 w-full" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : testimonials.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="relative bg-white/90 backdrop-blur-xl border border-indigo-100 hover:border-indigo-400 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-200/50">
                      <div className="absolute -top-8 -left-8 opacity-10 text-8xl pointer-events-none">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M7 17c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all">
                            <AvatarImage src={testimonial.author.photoURL || undefined} alt={testimonial.author.name} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                              {getInitials(testimonial.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base font-semibold text-slate-800">{testimonial.author.name}</CardTitle>
                            <CardDescription className="text-slate-500">User</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-slate-700 italic">"{testimonial.comments}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-indigo-100 rounded-2xl bg-white/60 backdrop-blur">
                  <MessageSquare className="mx-auto h-12 w-12 text-indigo-300" />
                  <h3 className="mt-4 text-xl font-medium text-slate-800">Be the First to Share Your Story</h3>
                  <p className="mt-2 text-slate-600">Your feedback helps us improve and inspires other creators.</p>
                </div>
              )}
            </div>
          </div>
        </section>
  
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-200 rounded-full mb-8 opacity-40" />
  
        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-4xl font-bold md:text-5xl bg-gradient-to-b from-slate-900 to-indigo-700 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {/* Hobbyist */}
              <Card className="flex flex-col bg-white/90 backdrop-blur-2xl border border-indigo-100 shadow hover:scale-[1.04] hover:shadow-indigo-200/80 hover:border-indigo-400 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl text-indigo-700">Hobbyist</CardTitle>
                  <CardDescription className="text-slate-600">Perfect for getting started and trying out ideas.</CardDescription>
                  <p className="text-4xl font-bold pt-4 text-indigo-700">Free</p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> 2 projects</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-muted-foreground"><XCircle className="h-5 w-5 mr-2 text-muted-foreground" /> Public Projects</p>
                  <p className="flex items-center text-muted-foreground"><XCircle className="h-5 w-5 mr-2 text-muted-foreground" /> Community Access</p>
                  <p className="flex items-center text-muted-foreground"><XCircle className="h-5 w-5 mr-2 text-muted-foreground" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-muted-foreground"><XCircle className="h-5 w-5 mr-2 text-muted-foreground" /> No Support</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700">
                    <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Get Started</Link>
                  </Button>
                </div>
              </Card>
              {/* Plus (highlighted) */}
              <Card className="flex flex-col bg-gradient-to-br from-indigo-100 to-purple-100 backdrop-blur-2xl border-indigo-200 shadow-xl shadow-indigo-200/40 relative overflow-hidden scale-[1.03] z-10">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-2xl text-indigo-700">Plus</CardTitle>
                    <div className="text-xs font-bold uppercase text-white bg-gradient-to-r from-indigo-400 to-purple-400 px-3 py-1 rounded-full shadow animate-pulse">
                      Most Popular
                    </div>
                  </div>
                  <CardDescription className="text-slate-600">For individuals and small teams shipping projects.</CardDescription>
                  <p className="pt-4">
                    <span className="text-4xl font-bold text-indigo-700">$8</span>
                    <span className="text-slate-500">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> 10 projects</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Community Access</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Community Support</p>
                  <p className="flex items-center text-muted-foreground"><XCircle className="h-5 w-5 mr-2 text-muted-foreground" /> AI Prompt Enhancement</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow">
                    <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Get Plus</Link>
                  </Button>
                </div>
              </Card>
              {/* Pro */}
              <Card className="flex flex-col bg-white/90 backdrop-blur-2xl border border-indigo-100 shadow hover:scale-[1.04] hover:shadow-indigo-200/80 hover:border-indigo-400 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl text-indigo-700">Pro</CardTitle>
                  <CardDescription className="text-slate-600">For serious builders who want to ship faster.</CardDescription>
                  <p className="pt-4">
                    <span className="text-4xl font-bold text-indigo-700">$20</span>
                    <span className="text-slate-500">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> 30 projects</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> AI Prompt Enhancement</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Public Projects & Sharing</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Community Access</p>
                  <p className="flex items-center text-slate-600"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Priority Support</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700">
                    <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Go Pro</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
  
        {/* CALL TO ACTION SECTION */}
        <section className="py-20 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 to-purple-200/30 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h2 className="font-headline text-4xl font-bold md:text-5xl text-slate-900 mb-6">
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are building faster and smarter with Prompt Genius AI.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow group active:scale-95">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>
                Start Building Today
                <Rocket className="ml-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
  
      <footer className="border-t border-indigo-100 bg-white/80 backdrop-blur-lg">
        <div className="mb-4 h-0.5 bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-200 opacity-40 rounded-full" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-indigo-400" />
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Prompt Genius AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            {/* Social icons example */}
            <a href="#" className="text-slate-400 hover:text-white transition"><Github className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>
  
      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </div>
  )
  
  
}
