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
import Image from "next/image";

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#00171f]">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f] dark:text-white" />
      </div>
    );
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
            <UserNav />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-gray-200 dark:border-gray-700 rounded-full animate-float opacity-50" />
        <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-full animate-float delay-300 opacity-50" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-[#00171f] dark:bg-white rounded-full animate-subtle-pulse" />
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-[#00171f] dark:bg-white rounded-full animate-subtle-pulse delay-200" />

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Hero section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f] dark:text-white">
            My Profile
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#00171f] dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-[#00171f] rounded-xl transition-all duration-200 font-medium text-gray-700 dark:text-gray-300"
            >
              Profile Details
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-[#00171f] dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-[#00171f] rounded-xl transition-all duration-200 font-medium text-gray-700 dark:text-gray-300"
            >
              Change Password
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-[#00171f] dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-[#00171f] rounded-xl transition-all duration-200 font-medium text-gray-700 dark:text-gray-300"
            >
              Subscription
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert
              variant="destructive"
              className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl"
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
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="font-headline text-2xl font-bold text-[#00171f] dark:text-white">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
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
                            <FormLabel className="text-[#00171f] dark:text-white font-semibold">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your First Name"
                                {...field}
                                className="border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white rounded-xl focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/20 dark:focus:ring-white/20 transition-all duration-200 font-medium"
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
                            <FormLabel className="text-[#00171f] dark:text-white font-semibold">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your Last Name"
                                {...field}
                                className="border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white rounded-xl focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/20 dark:focus:ring-white/20 transition-all duration-200 font-medium"
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
                          <FormLabel className="text-[#00171f] dark:text-white font-semibold">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your@email.com"
                              {...field}
                              disabled
                              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[#00171f] dark:text-white rounded-xl font-medium"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400 font-medium">
                            Your email address cannot be changed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                      className="w-full sm:w-auto bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold px-8 py-3 rounded-full transition-all duration-200 active:scale-95"
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
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="font-headline text-2xl font-bold text-[#00171f] dark:text-white">
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
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
                          <FormLabel className="text-[#00171f] dark:text-white font-semibold">
                            New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white rounded-xl focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/20 dark:focus:ring-white/20 transition-all duration-200 font-medium"
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
                          <FormLabel className="text-[#00171f] dark:text-white font-semibold">
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white rounded-xl focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/20 dark:focus:ring-white/20 transition-all duration-200 font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                      className="w-full sm:w-auto bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold px-8 py-3 rounded-full transition-all duration-200 active:scale-95"
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
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="font-headline text-2xl font-bold text-[#00171f] dark:text-white">
                  Manage Subscription
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
                  View your current plan and manage your subscription details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      Current Plan
                    </p>
                    <p className="text-2xl font-bold text-[#00171f] dark:text-white capitalize">
                      {subscriptionPlan || "Free"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-base bg-white dark:bg-[#00171f] border-[#00171f] dark:border-white text-[#00171f] dark:text-white font-semibold px-4 py-2 rounded-full"
                  >
                    <BadgeCheck className="mr-2 text-[#00171f] dark:text-white" />{" "}
                    {subscriptionPlan || "Free"}
                  </Badge>
                </div>

                {subscriptionPlan === "free" ? (
                  <Card className="border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                      <CardTitle className="font-headline text-xl font-bold text-[#00171f] dark:text-white">
                        Upgrade Your Plan
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
                        Unlock more projects, advanced features, and priority
                        support.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Link href="/#pricing">
                        <Button className="w-full bg-[#00171f] hover:bg-[#00171f]/90 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-[#00171f] border-0 shadow-lg shadow-[#00171f]/20 dark:shadow-white/20 font-semibold py-3 rounded-full transition-all duration-200 active:scale-95">
                          <Rocket className="mr-2 h-5 w-5" />
                          View Upgrade Options
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      Need to make changes? You can manage your billing details,
                      view invoices, or cancel your subscription at any time.
                    </p>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isPortalLoading}
                      className="w-full bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white border-0 shadow-lg shadow-gray-600/20 font-semibold py-3 rounded-full transition-all duration-200 active:scale-95"
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
