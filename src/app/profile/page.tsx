
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, AlertTriangle, BadgeCheck, Rocket, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCustomerPortalUrl } from '@/lib/lemon';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email().describe("Email address can't be changed."),
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user, loading: authLoading, updateUserProfile, changeUserPassword, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          profileForm.reset({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: user.email || '',
          });
        } else {
            // Fallback for users who might not have a firestore doc yet
            const nameParts = user.displayName?.split(' ') || [];
            profileForm.reset({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: user.email || '',
            });
        }
      };
      fetchUserData();
    }
  }, [user, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setError(null);
    try {
      await updateUserProfile({ firstName: values.firstName, lastName: values.lastName });
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setError(null);
    try {
      await changeUserPassword(values.newPassword);
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });
      passwordForm.reset();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.email) return;
    setIsPortalLoading(true);
    try {
        const portalUrl = await getCustomerPortalUrl(user.email);
        router.push(portalUrl);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not load subscription details.',
        });
    } finally {
        setIsPortalLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 py-4 flex justify-between items-center border-b">
         <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
             <h1 className="font-headline text-xl font-bold tracking-tight hidden sm:block">
                Prompt Genius AI
            </h1>
         </Link>
        <UserNav />
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              My Profile
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>An Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your display name and view your email address.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your First Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your Last Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                       </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              Your email address cannot be changed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Enter a new password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                    <CardDescription>View your current plan and manage your subscription details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Current Plan</p>
                            <p className="text-xl font-semibold capitalize">{subscriptionPlan || 'Free'}</p>
                        </div>
                        <Badge variant="outline" className="text-base">
                            <BadgeCheck className="mr-2 text-primary" /> {subscriptionPlan || 'Free'}
                        </Badge>
                    </div>

                    {subscriptionPlan === 'free' ? (
                       <Card className="border-primary/50">
                           <CardHeader>
                            <CardTitle>Upgrade Your Plan</CardTitle>
                            <CardDescription>Unlock more projects, advanced features, and priority support.</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <Link href="/#pricing">
                                    <Button className="w-full">
                                        <Rocket className="mr-2 h-4 w-4" />
                                        View Upgrade Options
                                    </Button>
                               </Link>
                           </CardContent>
                       </Card>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Need to make changes? You can manage your billing details, view invoices, or cancel your subscription at any time.</p>
                             <Button onClick={handleManageSubscription} disabled={isPortalLoading} className="w-full">
                                {isPortalLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                <Ban className="mr-2 h-4 w-4" />
                                )}
                                Cancel or Manage Subscription
                            </Button>
                        </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

    