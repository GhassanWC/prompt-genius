
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code, ArrowRight, MessageSquare } from 'lucide-react';
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
    return name.split(' ').map((n) => n[0]).join('');
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-7 w-7 text-primary" />
            <span className="font-headline text-lg">Prompt Genius AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : user ? (
              <UserNav />
            ) : (
              <>
                <Button asChild variant="ghost"><Link href="/login">Sign In</Link></Button>
                <Button asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section id="hero" className="container mx-auto px-4 py-20 text-center sm:py-28">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Turn Your Vague Idea Into a Concrete Plan
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Stop wondering where to start. Prompt Genius AI decomposes your biggest ideas into a clear, sequential development plan with actionable prompts for every step.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Start Forging</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold md:text-4xl">A Smarter Way to Build</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                From concept to code, we've got you covered. Our features are designed to eliminate guesswork and accelerate your development process.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <Card key={i} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-16 sm:py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold md:text-4xl">Loved by Developers and Founders</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Don't just take our word for it. Here's what our users have to say about their experience with Prompt Genius AI.
              </p>
            </div>
            <div className="text-center mt-8">
                <Button onClick={() => setIsFeedbackDialogOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Leave a Review
                </Button>
            </div>
            <div className="mt-8">
               {loadingTestimonials ? (
                   <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                       {Array.from({ length: 6 }).map((_, i) => (
                           <Card key={i} className="flex flex-col">
                               <CardContent className="pt-6 flex-grow">
                                   <div className="flex gap-1 mb-2">
                                       {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-5 w-5" />)}
                                   </div>
                                   <Skeleton className="h-4 w-full" />
                                   <Skeleton className="h-4 w-full mt-2" />
                                   <Skeleton className="h-4 w-2/3 mt-2" />
                               </CardContent>
                               <CardHeader>
                                   <div className="flex items-center gap-4">
                                       <Skeleton className="h-10 w-10 rounded-full" />
                                       <div>
                                           <Skeleton className="h-4 w-24 mb-2" />
                                           <Skeleton className="h-3 w-16" />
                                       </div>
                                   </div>
                               </CardHeader>
                           </Card>
                       ))}
                   </div>
               ) : testimonials.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                      <Card key={testimonial.id} className="flex flex-col">
                        <CardContent className="pt-6 flex-grow">
                          <div className="flex gap-1 mb-2">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-muted-foreground">"{testimonial.comments}"</p>
                        </CardContent>
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={testimonial.author.photoURL || undefined} alt={testimonial.author.name} data-ai-hint="person" />
                              <AvatarFallback>{getInitials(testimonial.author.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base font-semibold">{testimonial.author.name}</CardTitle>
                              <CardDescription>User</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-medium">Be the First to Share Your Story</h3>
                  <p className="mt-2 text-muted-foreground">Your feedback helps us improve and inspires other creators.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold md:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Hobbyist</CardTitle>
                  <CardDescription>Perfect for getting started and trying out ideas.</CardDescription>
                  <p className="text-4xl font-bold pt-4">Free</p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> 3 projects</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> AI Idea Enhancement</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                     <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Get Started</Link>
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col border-primary shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                     <CardTitle className="font-headline text-2xl">Plus</CardTitle>
                     <div className="text-xs font-bold uppercase text-primary bg-primary/10 px-2 py-1 rounded-full">Most Popular</div>
                  </div>
                  <CardDescription>For individuals and small teams shipping projects.</CardDescription>
                  <p className="pt-4"><span className="text-4xl font-bold">$5</span><span className="text-muted-foreground">/month</span></p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> 20 projects</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> AI Idea Enhancement</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Community Support</p>
                </CardContent>
                 <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                     <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Get Plus</Link>
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Pro</CardTitle>
                  <CardDescription>For serious builders who want to ship faster.</CardDescription>
                  <p className="pt-4"><span className="text-4xl font-bold">$12</span><span className="text-muted-foreground">/month</span></p>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Unlimited projects</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> AI Idea Enhancement</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Full Prompt Generation</p>
                  <p className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Priority Support</p>
                </CardContent>
                 <div className="p-6 pt-0">
                  <Button asChild className="w-full" variant="outline">
                     <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Go Pro</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Prompt Genius AI. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
             <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </div>
  );
}
