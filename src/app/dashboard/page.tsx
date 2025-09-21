"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  PlusCircle,
  FolderOpen,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { getTier, Tier } from "@/lib/tiers";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [userSubscriptionProjectCount, setUserSubscriptionProjectCount] =
    useState<number | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store", // optional if you want fresh data always
      });

      if (!res.ok) {
        setError("Failed to load projects. Please try again.");
        return;
      }

      const userProjects = await res.json();
      setProjects(userProjects.projects);
    } catch (err: any) {
      setError(
        err.message || "An unknown error occurred. Please refresh the page."
      );
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const getUserSubscriptionProjectCount = async () => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(
      "/api/subscription/features?subscriptionProjectsCount=true",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch subscription plan.");
    }
    const { count } = await res.json();

    return count ?? 1;
  };

  useEffect(() => {
    if (subscriptionPlan) {
      getTier(subscriptionPlan).then(setTier);
    }
  }, [subscriptionPlan]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    if (user) {
      getUserSubscriptionProjectCount().then(setUserSubscriptionProjectCount); // Refresh subscription details
    }
  }, [user]);

  const openDeleteDialog = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !user) return;
    setIsDeleting(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const projectId: string = projectToDelete.id;
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "deleteProject", projectId }),
      });
      if (!res.ok) {
        throw new Error(`Could not delete project "${projectToDelete.name}".`);
      }
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" has been removed.`,
      });
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleToggleVisibility = async (
    project: Project,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const newVisibility = !project.isPublic;

    try {
      const token = await auth.currentUser?.getIdToken();
      const projectId: string = project.id;
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "updateProjectVisibility",
          projectId,
          data: { isPublic: newVisibility },
        }),
      });

      if (!res.ok && res.status === 402) {
        const data = await res.json();
        console.log("Failed to update visibility", data);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: data.error
        });
        return;
      }

      if (!res.ok) {
        console.log("Failed to update visibility", res);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: `Could not change visibility for "${project.name}".`,
        });
        return;
      }
      toast({
        title: "Visibility Updated",
        description: `"${project.name}" is now ${
          newVisibility ? "public" : "private"
        }.`,
      });
      fetchProjects(); // Refresh the list to show the new state
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
    }
  };

  const projectsUsed = projects.length;
  const projectLimit = userSubscriptionProjectCount;
  const projectsRemaining = projectLimit - projectsUsed;
  const usagePercentage =
    projectLimit > 0 ? (projectsUsed / projectLimit) * 100 : 0;
  const atLimit = projectsRemaining <= 0;

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
            <Image
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Enhanced header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
            My Projects
          </h2>
          <Link href={atLimit ? "/dashboard" : "/projects/new"}>
            <Button
              disabled={atLimit}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-8 bg-red-50 border-red-200 text-red-800 rounded-2xl"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">
              Could Not Load Projects
            </AlertTitle>
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {tier && (
          <Card className="mb-10 bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
              <CardTitle className="text-2xl font-bold text-indigo-800 capitalize">
                {tier.name}
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                You have created {projectsUsed} of {projectLimit} available
                projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Progress
                value={usagePercentage}
                className="h-3 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </Progress>
            </CardContent>
            {atLimit && (
              <CardFooter className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-t border-amber-200">
                <div className="w-full text-center text-sm text-amber-700 font-medium mt-2">
                  You've reached your project limit.
                  <Link
                    href="/#pricing"
                    className="ml-1 mr-1 text-indigo-600 hover:text-indigo-700 underline font-semibold"
                  >
                    Upgrade your plan
                  </Link>
                  to create more.
                </div>
              </CardFooter>
            )}
          </Card>
        )}

        {loadingProjects ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl animate-pulse" />
                <CardHeader className="p-6">
                  <div className="h-6 w-3/4 bg-slate-200 rounded-lg animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 && !error ? (
          <div className="text-center py-20 border-2 border-dashed border-indigo-200 rounded-3xl bg-white/60 backdrop-blur-xl">
            <FolderOpen className="mx-auto h-16 w-16 text-indigo-300" />
            <h3 className="mt-6 text-2xl font-bold text-slate-800">
              No projects yet
            </h3>
            <p className="mt-3 text-slate-600 font-medium">
              Get started by creating your first project.
            </p>
            <Link href="/projects/new" className="mt-8 inline-block">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 font-semibold px-8 py-3 rounded-full transition-all duration-200">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const isOwner = project.roles[user.uid] === "owner";
              return (
                <div key={project.id} className="relative group">
                  <Link
                    href={`/projects/${project.id}`}
                    className="block h-full"
                  >
                    <Card className="h-full hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-200 transition-all duration-500 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl overflow-hidden">
                      {project.imageUrl ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={project.imageUrl}
                            alt={project.name}
                            fill
                            className="object-cover rounded-t-2xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-2xl" />
                        </div>
                      ) : (
                        <div className="h-48 w-full bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-2xl flex items-center justify-center">
                          <Logo className="h-16 w-16 text-indigo-300" />
                        </div>
                      )}
                      <div className="flex flex-col flex-grow p-6">
                        <CardTitle className="font-headline text-xl font-bold text-indigo-800 mb-2">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium mb-4">
                          Created{" "}
                          {formatDistanceToNow(new Date(project.createdAt), {
                            addSuffix: true,
                          })}
                        </CardDescription>
                        <p className="text-sm text-slate-600 line-clamp-2 flex-grow font-medium leading-relaxed">
                          {project.idea}
                        </p>
                      </div>
                    </Card>
                  </Link>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg hover:bg-white hover:border-indigo-200 rounded-xl transition-all duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="h-5 w-5 text-slate-600" />
                            <span className="sr-only">Project options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handleToggleVisibility(project, e)}
                            className="hover:bg-indigo-50 focus:bg-indigo-50 rounded-lg transition-colors duration-200"
                          >
                            {project.isPublic ? (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                <span>Make Private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="mr-2 h-4 w-4" />
                                <span>Make Public</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-200" />
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg transition-colors duration-200"
                            onClick={(e) => openDeleteDialog(project, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-800">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium leading-relaxed">
              This action cannot be undone. This will permanently delete the
              project{" "}
              <span className="font-bold text-red-600">
                "{projectToDelete?.name}"
              </span>{" "}
              and all of its associated prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-xl shadow-red-500/25 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
