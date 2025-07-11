
'use client';

import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export default function LoginPage() {
    const { signInWithGoogle, signInWithGithub, signUpWithEmail, signInWithEmail } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signUpWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('An account with this email already exists. Try signing in instead.');
                    break;
                case 'auth/weak-password':
                    setError('Password must be at least 6 characters long.');
                    break;
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                default:
                    setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleEmailSignIn = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid email or password. Please try again.');
                    break;
                default:
                    setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleProviderSignIn = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError(null);
        try {
            if (provider === 'google') {
                await signInWithGoogle();
            } else {
                await signInWithGithub();
            }
        } catch (err: any) {
            if (err.code === 'auth/account-exists-with-different-credential') {
                setError('This email is already in use. Please sign in with the method you used to create your account.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Tabs defaultValue="signin" className="w-full max-w-md">
                <div className="flex flex-col items-center mb-6 text-center">
                    <Link href="/" className="mb-3">
                        <Logo className="h-12 w-12 text-primary" />
                    </Link>
                     <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Prompt Genius AI
                    </h1>
                     <p className="mt-2 text-muted-foreground">
                        Sign in or create an account to start.
                    </p>
                </div>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Login Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <TabsContent value="signin">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Enter your credentials to access your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleEmailSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email-in">Email</Label>
                                    <Input id="email-in" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password-in">Password</Label>
                                    <Input id="password-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </Button>
                            </form>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" onClick={() => handleProviderSignIn('google')} disabled={loading}><GoogleIcon /> <span className="ml-2">Google</span></Button>
                                <Button variant="outline" onClick={() => handleProviderSignIn('github')} disabled={loading}><Github className="mr-2 h-5 w-5" />GitHub</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                            <CardDescription>Create an account to get started.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <form onSubmit={handleEmailSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email-up">Email</Label>
                                    <Input id="email-up" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password-up">Password</Label>
                                    <Input id="password-up" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </form>
                             <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" onClick={() => handleProviderSignIn('google')} disabled={loading}><GoogleIcon /> <span className="ml-2">Google</span></Button>
                                <Button variant="outline" onClick={() => handleProviderSignIn('github')} disabled={loading}><Github className="mr-2 h-5 w-5" />GitHub</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
