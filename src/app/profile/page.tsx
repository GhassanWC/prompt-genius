"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Rocket,
  Ban,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserNav } from "@/components/user-nav";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email().describe("Email address can't be changed."),
});

const passwordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const {
    user,
    loading: authLoading,
    updateUserProfile,
    changeUserPassword,
    subscriptionPlan,
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          profileForm.reset({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: user.email || "",
          });
        } else {
          // Fallback for users who might not have a firestore doc yet
          const nameParts = user.displayName?.split(" ") || [];
          profileForm.reset({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: user.email || "",
          });
        }
      };
      fetchUserData();
    }
  }, [user, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setError(null);
    try {
      await updateUserProfile({
        firstName: values.firstName,
        lastName: values.lastName,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setError(null);
    try {
      await changeUserPassword(values.newPassword);
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      passwordForm.reset();
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.email) return;
    setIsPortalLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/projects?subscriptionUrl=true", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plan url.");
      }
      const { planUrl } = await res.json();
      router.push(planUrl);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not load subscription details.",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
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
            <img
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Enhanced hero section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg shadow-black/5 p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 font-medium"
            >
              Profile Details
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 font-medium"
            >
              Change Password
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 font-medium"
            >
              Subscription
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert
              variant="destructive"
              className="mt-6 bg-red-50 border-red-200 text-red-800 rounded-2xl"
            >
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">
                An Error Occurred
              </AlertTitle>
              <AlertDescription className="font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="profile" className="mt-8">
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
                <CardTitle className="text-2xl font-bold text-indigo-800">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Update your display name and view your email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your First Name"
                                {...field}
                                className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                              />
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
                            <FormLabel className="text-slate-700 font-semibold">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your Last Name"
                                {...field}
                                className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                              />
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
                          <FormLabel className="text-slate-700 font-semibold">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your@email.com"
                              {...field}
                              disabled
                              className="bg-slate-50/80 backdrop-blur-xl border border-slate-200 rounded-xl shadow-sm font-medium"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-500 font-medium">
                            Your email address cannot be changed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold px-8 py-3 rounded-full transition-all duration-200"
                    >
                      {profileForm.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-8">
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
                <CardTitle className="text-2xl font-bold text-indigo-800">
                  Change Password
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Enter a new password for your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-8"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">
                            New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                            />
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
                          <FormLabel className="text-slate-700 font-semibold">
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold px-8 py-3 rounded-full transition-all duration-200"
                    >
                      {passwordForm.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="mt-8">
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
                <CardTitle className="text-2xl font-bold text-indigo-800">
                  Manage Subscription
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  View your current plan and manage your subscription details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="p-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-xl border border-indigo-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 font-medium">
                      Current Plan
                    </p>
                    <p className="text-2xl font-bold text-indigo-800 capitalize">
                      {subscriptionPlan || "Free"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-base bg-white/80 backdrop-blur-xl border-indigo-200 text-indigo-700 font-semibold px-4 py-2 rounded-full"
                  >
                    <BadgeCheck className="mr-2 text-indigo-600" />{" "}
                    {subscriptionPlan || "Free"}
                  </Badge>
                </div>

                {subscriptionPlan === "free" ? (
                  <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 border-b border-indigo-200">
                      <CardTitle className="text-xl font-bold text-indigo-800">
                        Upgrade Your Plan
                      </CardTitle>
                      <CardDescription className="text-slate-600 font-medium">
                        Unlock more projects, advanced features, and priority
                        support.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Link href="/#pricing">
                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold py-3 rounded-full transition-all duration-200">
                          <Rocket className="mr-2 h-5 w-5" />
                          View Upgrade Options
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Need to make changes? You can manage your billing details,
                      view invoices, or cancel your subscription at any time.
                    </p>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isPortalLoading}
                      className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white border-0 shadow-xl shadow-slate-500/25 font-semibold py-3 rounded-full transition-all duration-200"
                    >
                      {isPortalLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Ban className="mr-2 h-5 w-5" />
                      )}
                      Cancel or Manage Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
