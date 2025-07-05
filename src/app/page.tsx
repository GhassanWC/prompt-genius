'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { Star, CheckCircle, Sparkles, ClipboardCheck, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const { user, loading } = useAuth();

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Testimonials', href: '#testimonials' },
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

  const testimonials = [
    {
      name: 'Sarah L.',
      title: 'Product Manager',
      quote: 'PromptForge AI has become my go-to for kickstarting new projects. It saves hours of brainstorming and planning. The generated prompts are shockingly accurate!',
      avatar: 'https://placehold.co/100x100.png',
      rating: 5,
    },
    {
      name: 'Mike R.',
      title: 'Indie Developer',
      quote: "As a solo dev, this tool is a game-changer. I can go from a simple idea to a full development roadmap in minutes. It's like having a senior architect on my team.",
      avatar: 'https://placehold.co/100x100.png',
      rating: 5,
    },
    {
      name: 'Jasmine K.',
      title: 'Startup Founder',
      quote: 'We use PromptForge AI to quickly validate and prototype new feature ideas. It has drastically sped up our innovation cycle. Highly recommended!',
      avatar: 'https://placehold.co/100x100.png',
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-7 w-7 text-primary" />
            <span className="font-headline text-lg">PromptForge AI</span>
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
        <section id="hero" className="container mx-auto px-4 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight">
                Turn Your Vague Idea Into a Concrete Plan
              </h1>
              <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg text-muted-foreground">
                Stop wondering where to start. PromptForge AI decomposes your biggest ideas into a clear, sequential development plan with actionable prompts for every step.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start gap-4">
                <Button asChild size="lg">
                  <Link href={loading ? "/login" : user ? "/dashboard" : "/login"}>Start Forging</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                    <Avatar className="border-2 border-background h-10 w-10">
                        <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person" />
                        <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background h-10 w-10">
                        <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person" />
                        <AvatarFallback>J</AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background h-10 w-10">
                        <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person" />
                        <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                </div>
                <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="mt-1">Loved by <strong>1,000+</strong> developers & founders</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-2 md:-inset-4 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
                <Image
                  src="https://placehold.co/1200x800.png"
                  alt="App Screenshot showing a generated plan"
                  width={1200}
                  height={800}
                  className="relative rounded-xl border shadow-2xl transform-gpu lg:-rotate-3 transition-transform duration-300 ease-in-out hover:rotate-0"
                  data-ai-hint="idea flowchart"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">A Smarter Way to Build</h2>
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

        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Loved by Developers and Founders</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Don't just take our word for it. Here's what our users have to say about their experience with PromptForge AI.
              </p>
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="flex flex-col">
                  <CardContent className="pt-6 flex-grow">
                    <div className="flex gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person" />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Choose the plan that's right for you. Get started for free, and upgrade when you're ready to build more.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
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
                     <CardTitle className="font-headline text-2xl">Pro</CardTitle>
                     <div className="text-xs font-bold uppercase text-primary bg-primary/10 px-2 py-1 rounded-full">Most Popular</div>
                  </div>
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
                  <Button asChild className="w-full">
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
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} PromptForge AI. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
             <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
