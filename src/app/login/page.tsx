'use client';

import { Github, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.31v2.84C4.22 20.98 7.82 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.31c-.64 1.28-1.02 2.7-1.02 4.28s.38 3 1.02 4.28l3.53-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.82 1 4.22 3.02 2.31 6.22l3.53 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
        </svg>
    );
}

function ForgotPasswordDialog({ onSendResetLink }: { onSendResetLink: (email: string) => void }) {
    const [email, setEmail] = useState('');

    const handleSend = () => {
        onSendResetLink(email);
    }
    
    return (
         <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-[#00171f]">Forgot Password?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 font-medium">
                    No problem. Enter your email address and we'll send you a link to reset your password.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
                <Label htmlFor="reset-email" className="text-[#00171f] font-semibold">Email Address</Label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full border-gray-200 hover:bg-gray-50">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleSend} 
                    disabled={!email.trim()}
                    className="bg-[#00171f] hover:bg-[#00171f]/90 text-white rounded-full"
                >
                    Send Reset Link
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithGithub, signUpWithEmail, signInWithEmail, sendPasswordResetEmail } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleEmailSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            await signUpWithEmail(email, password, firstName, lastName);
            // The redirection is now handled inside the signUpWithEmail function
        } catch (err: any) {
            setError(err.message || 'Something went wrong while creating your account. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleEmailSignIn = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            await signInWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
             setError(err.message || 'Something went wrong while signing in. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleProviderSignIn = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            if (provider === 'google') {
                await signInWithGoogle();
            } else {
                await signInWithGithub();
            }
        } catch (err: any) {
             setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const handleSendResetLink = async (resetEmail: string) => {
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            await sendPasswordResetEmail(resetEmail);
            setInfo("If an account exists for this email, a password reset link has been sent. Please check your inbox.");
        } catch (error: any) {
            console.error(error);
            setInfo("If an account exists for this email, a password reset link has been sent. Please check your inbox.");
        } finally {
            setLoading(false);
            setIsForgotPasswordOpen(false);
        }
    }


    return (
        <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
          {/* Subtle geometric background pattern */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Header */}
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
              <div className="flex items-center gap-6">
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white">
                  <Link href="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <div className="md:hidden">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
            {/* Decorative elements */}
            <div className="absolute top-20 left-10 w-20 h-20 border border-gray-200 dark:border-gray-700 rounded-full animate-float opacity-50" />
            <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-full animate-float delay-300 opacity-50" />
            <div className="absolute top-40 right-20 w-3 h-3 bg-[#00171f] dark:bg-white rounded-full animate-subtle-pulse" />
            <div className="absolute bottom-40 left-20 w-2 h-2 bg-[#00171f] dark:bg-white rounded-full animate-subtle-pulse delay-200" />

            <AlertDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
              <Tabs defaultValue="signin" className="w-full max-w-md relative z-10">
                {/* Header section */}
                <div className="flex flex-col items-center mb-8 text-center">
                  <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#00171f] dark:text-white">
                    Welcome Back
                  </h1>
                  <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 font-medium">
                    Sign in or create an account to start.
                  </p>
                </div>

              {/* Tabs */}
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-1 mb-6">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-[#00171f] dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-[#00171f] rounded-xl transition-all duration-200 font-medium"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-[#00171f] dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-[#00171f] rounded-xl transition-all duration-200 font-medium"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Error</AlertTitle>
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert className="mb-6 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-2xl">
                  <AlertTitle className="font-semibold">Check Your Email</AlertTitle>
                  <AlertDescription className="font-medium">{info}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white dark:bg-[#00171f] border-b border-gray-200 dark:border-gray-800">
                    <CardTitle className="font-headline text-xl sm:text-2xl font-bold text-[#00171f] dark:text-white">Sign In</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">Enter your credentials to access your account.</CardDescription>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-[#00171f] p-8 space-y-6">
                    <form onSubmit={handleEmailSignIn} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="email-in" className="text-[#00171f] dark:text-white font-semibold">Email</Label>
                        <Input 
                          id="email-in" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="password-in" className="text-[#00171f] dark:text-white font-semibold">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password-in" 
                            type={passwordVisible ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="pr-12 border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-[#00171f] hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            <span className="sr-only">{passwordVisible ? 'Hide password' : 'Show password'}</span>
                          </Button>
                        </div>
                        <div className="text-left">
                          <AlertDialogTrigger asChild>
                            <Button variant="link" size="sm" type="button" className="p-0 h-auto text-sm text-[#00171f] hover:text-[#00171f]/80 font-medium">
                              Forgot password?
                            </Button>
                          </AlertDialogTrigger>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold py-3 rounded-full transition-all duration-200 active:scale-95" 
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
                      </div>
                    </div>

                    {/* Social buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('google')} 
                        disabled={loading}
                        className="bg-white border-gray-200 hover:bg-gray-50 hover:border-[#00171f]/30 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <GoogleIcon /> 
                        <span className="ml-2">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('github')} 
                        disabled={loading}
                        className="bg-white border-gray-200 hover:bg-gray-50 hover:border-[#00171f]/30 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <Github className="mr-2 h-5 w-5" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white dark:bg-[#00171f] border-b border-gray-200 dark:border-gray-800">
                    <CardTitle className="font-headline text-2xl font-bold text-[#00171f] dark:text-white">Sign Up</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">Create an account to get started.</CardDescription>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-[#00171f] p-8 space-y-6">
                    <form onSubmit={handleEmailSignUp} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="firstname-up" className="text-[#00171f] font-semibold">First Name</Label>
                          <Input 
                            id="firstname-up" 
                            placeholder="John" 
                            required 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            className="border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="lastname-up" className="text-[#00171f] font-semibold">Last Name</Label>
                          <Input 
                            id="lastname-up" 
                            placeholder="Doe" 
                            required 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            className="border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email-up" className="text-[#00171f] font-semibold">Email</Label>
                        <Input 
                          id="email-up" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="password-up" className="text-[#00171f] font-semibold">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password-up" 
                            type={passwordVisible ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-12 border-gray-200 rounded-xl focus:border-[#00171f] focus:ring-2 focus:ring-[#00171f]/20 transition-all duration-200 font-medium"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-[#00171f] hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            <span className="sr-only">{passwordVisible ? 'Hide password' : 'Show password'}</span>
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold py-3 rounded-full transition-all duration-200 active:scale-95" 
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-white px-4 text-gray-500 font-medium">Or sign up with</span>
                      </div>
                    </div>

                    {/* Social buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('google')} 
                        disabled={loading}
                        className="bg-white border-gray-200 hover:bg-gray-50 hover:border-[#00171f]/30 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <GoogleIcon /> 
                        <span className="ml-2">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('github')} 
                        disabled={loading}
                        className="bg-white border-gray-200 hover:bg-gray-50 hover:border-[#00171f]/30 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <Github className="mr-2 h-5 w-5" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <ForgotPasswordDialog onSendResetLink={handleSendResetLink} />
          </AlertDialog>
          </main>
        </div>
    );
}
