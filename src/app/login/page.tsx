
'use client';

import { Github, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Forgot Password?</AlertDialogTitle>
                <AlertDialogDescription>
                    No problem. Enter your email address and we'll send you a link to reset your password.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSend} disabled={!email.trim()}>Send Reset Link</AlertDialogAction>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
          {/* Enhanced animated background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] bg-gradient-to-tl from-purple-300/30 via-pink-300/20 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-500" />
          </div>

          <AlertDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
            <Tabs defaultValue="signin" className="w-full max-w-md relative z-10">
              {/* Enhanced header section */}
              <div className="flex flex-col items-center mb-8 text-center">
                <Link href="/" className="mb-4 group">
                  <img
                   src="/logo.png"
                   alt="Prompt Genius Logo"
                   width={60}
                   height={60}
                   className="ml-1 mr-1"
                  />
                  </Link>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
                  Prompt Genius AI
                </h1>
                <p className="mt-3 text-lg text-slate-600 font-medium">
                  Sign in or create an account to start.
                </p>
              </div>

              {/* Enhanced tabs */}
              <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg shadow-black/5 p-1 mb-6">
                <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 font-medium">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Login Failed</AlertTitle>
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 rounded-2xl">
                  <AlertTitle className="font-semibold">Check Your Email</AlertTitle>
                  <AlertDescription className="font-medium">{info}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
                    <CardTitle className="text-2xl font-bold text-indigo-800">Sign In</CardTitle>
                    <CardDescription className="text-slate-600 font-medium">Enter your credentials to access your account.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <form onSubmit={handleEmailSignIn} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="email-in" className="text-slate-700 font-semibold">Email</Label>
                        <Input 
                          id="email-in" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="password-in" className="text-slate-700 font-semibold">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password-in" 
                            type={passwordVisible ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="pr-12 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            <span className="sr-only">{passwordVisible ? 'Hide password' : 'Show password'}</span>
                          </Button>
                        </div>
                        <div className="text-left">
                          <AlertDialogTrigger asChild>
                            <Button variant="link" size="sm" type="button" className="p-0 h-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                              Forgot password?
                            </Button>
                          </AlertDialogTrigger>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold py-3 rounded-full transition-all duration-200" 
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>

                    {/* Enhanced divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/50" />
                      </div>
                      <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-white/90 backdrop-blur-xl px-4 text-slate-500 font-medium">Or continue with</span>
                      </div>
                    </div>

                    {/* Enhanced social buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('google')} 
                        disabled={loading}
                        className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <GoogleIcon /> 
                        <span className="ml-2">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('github')} 
                        disabled={loading}
                        className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <Github className="mr-2 h-5 w-5" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
                    <CardTitle className="text-2xl font-bold text-indigo-800">Sign Up</CardTitle>
                    <CardDescription className="text-slate-600 font-medium">Create an account to get started.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <form onSubmit={handleEmailSignUp} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="firstname-up" className="text-slate-700 font-semibold">First Name</Label>
                          <Input 
                            id="firstname-up" 
                            placeholder="John" 
                            required 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="lastname-up" className="text-slate-700 font-semibold">Last Name</Label>
                          <Input 
                            id="lastname-up" 
                            placeholder="Doe" 
                            required 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email-up" className="text-slate-700 font-semibold">Email</Label>
                        <Input 
                          id="email-up" 
                          type="email" 
                          placeholder="m@example.com" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="password-up" className="text-slate-700 font-semibold">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password-up" 
                            type={passwordVisible ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-12 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            <span className="sr-only">{passwordVisible ? 'Hide password' : 'Show password'}</span>
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold py-3 rounded-full transition-all duration-200" 
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>

                    {/* Enhanced divider */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/50" />
                      </div>
                      <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-white/90 backdrop-blur-xl px-4 text-slate-500 font-medium">Or sign up with</span>
                      </div>
                    </div>

                    {/* Enhanced social buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('google')} 
                        disabled={loading}
                        className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        <GoogleIcon /> 
                        <span className="ml-2">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProviderSignIn('github')} 
                        disabled={loading}
                        className="bg-white/80 backdrop-blur-xl border border-white/50 hover:bg-white hover:border-indigo-200 text-slate-700 font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
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
        </div>
    );
}
