
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailCheck, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const { user, signOut, sendVerificationEmail } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // If the user lands here but is already verified, send them to the dashboard.
        if (user?.emailVerified) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleResendEmail = useCallback(async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await sendVerificationEmail();
            setMessage('A new verification email has been sent. Please check your inbox and spam folder.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification email. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [sendVerificationEmail]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
                    <CardDescription>
                        We sent a verification link to <span className="font-bold text-foreground">{email || 'your email address'}</span>. Please click the link to finish signing up.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert>
                            <AlertTitle>Email Sent</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                     {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Didn't receive the email? Check your spam folder or resend it.</p>
                    </div>
                    <Button onClick={handleResendEmail} className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Resend Verification Email
                    </Button>
                    <div className="text-center text-sm">
                        <Button variant="link" onClick={handleSignOut} className="text-muted-foreground">
                            Back to Sign In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
