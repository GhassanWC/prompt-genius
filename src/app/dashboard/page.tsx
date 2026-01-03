"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import type { Project, ProjectClone } from "@/lib/projects";
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
  GitFork,
  Sparkles,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { getTier, Tier } from "@/lib/tiers";
import { auth } from "@/lib/firebase";

const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function DashboardPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clones, setClones] = useState<ProjectClone[]>([]);
  const [loadingClones, setLoadingClones] = useState(true);
  const [deletingCloneId, setDeletingCloneId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentClonesPage, setCurrentClonesPage] = useState(1);
  const [projectsPageSize, setProjectsPageSize] = useState(10);
  const [clonesPageSize, setClonesPageSize] = useState(10);

  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [userSubscriptionProjectCount, setUserSubscriptionProjectCount] =
    useState<number | null>(null);
  const [hasExecutionFollowUpAccess, setHasExecutionFollowUpAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

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
        cache: "no-store",
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

  const fetchClones = useCallback(async () => {
    if (!user) return;
    setLoadingClones(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/project-clones", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load cloned projects.");
      const data = await res.json();
      setClones(data.clones ?? []);
    } catch (err: any) {
      console.error("Failed to fetch clone metadata:", err);
      setClones([]);
    } finally {
      setLoadingClones(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClones();
    }
  }, [user, fetchClones]);

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
    // Always fetch tier - use subscription plan if exists, otherwise use 'free'
    const plan = subscriptionPlan || 'free';
    getTier(plan).then(setTier);
  }, [subscriptionPlan]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    if (user) {
      getUserSubscriptionProjectCount()
        .then(setUserSubscriptionProjectCount)
        .catch((err) => {
          console.error("Failed to fetch subscription project count:", err);
          setUserSubscriptionProjectCount(1);
        });
    }
  }, [user]);

  // Check if user has access to execution follow-up agent
  useEffect(() => {
    if (authLoading) {
      setCheckingAccess(true);
      return;
    }

    if (!user) {
      setHasExecutionFollowUpAccess(false);
      setCheckingAccess(false);
      return;
    }

    // Check feature access via API - this checks the tiers collection
    (async () => {
      try {
        setCheckingAccess(true);
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/subscription/features', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
          body: JSON.stringify({ 
            userId: user.uid, 
            feature: 'executionFollowUpAgent' 
          }),
        });

        if (res.ok) {
          const data: { enabled: boolean } = await res.json();
          setHasExecutionFollowUpAccess(data.enabled === true);
        } else {
          setHasExecutionFollowUpAccess(false);
        }
      } catch (error) {
        console.error('[Execution Follow-Up] Error checking feature access:', error);
        setHasExecutionFollowUpAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    })();
  }, [user, subscriptionPlan, authLoading]);

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
      fetchProjects();
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

  const handleDeleteClone = useCallback(
    async (cloneProjectId: string, cloneName: string) => {
      if (!user) return;
      setDeletingCloneId(cloneProjectId);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/project-clones", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ cloneProjectId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Unable to remove clone "${cloneName}".`);
        }
        toast({
          title: "Clone removed",
          description: `"${cloneName}" is gone from your dashboard.`,
        });
        fetchProjects();
        fetchClones();
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Remove failed",
          description: err.message,
        });
      } finally {
        setDeletingCloneId(null);
      }
    },
    [user, fetchProjects, fetchClones, toast]
  );

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
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: data.error
        });
        return;
      }

      if (!res.ok) {
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
      fetchProjects();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
    }
  };

  const cloneProjectIds = useMemo(
    () => new Set(clones.map((clone) => clone.cloneProjectId)),
    [clones]
  );

  const displayedProjects = useMemo(
    () => projects.filter((project) => !cloneProjectIds.has(project.id)),
    [projects, cloneProjectIds]
  );

  const totalProjectPages = Math.max(
    1,
    Math.ceil(displayedProjects.length / projectsPageSize)
  );
  const totalClonePages = Math.max(1, Math.ceil(clones.length / clonesPageSize));

  useEffect(() => {
    if (currentPage > totalProjectPages) {
      setCurrentPage(totalProjectPages);
    }
  }, [currentPage, totalProjectPages]);

  useEffect(() => {
    if (currentClonesPage > totalClonePages) {
      setCurrentClonesPage(totalClonePages);
    }
  }, [currentClonesPage, totalClonePages]);

  const visibleProjects = useMemo(() => {
    const start = (currentPage - 1) * projectsPageSize;
    return displayedProjects.slice(start, start + projectsPageSize);
  }, [currentPage, displayedProjects, projectsPageSize]);

  const visibleClones = useMemo(() => {
    const start = (currentClonesPage - 1) * clonesPageSize;
    return clones.slice(start, start + clonesPageSize);
  }, [currentClonesPage, clones, clonesPageSize]);

  const projectsUsed = displayedProjects.length;
  // If project count is null (still loading) or 0, show loading state or default to 1
  const projectLimit = userSubscriptionProjectCount !== null ? (userSubscriptionProjectCount || 1) : null;
  const usagePercentage =
    projectLimit && projectLimit > 0 ? (projectsUsed / projectLimit) * 100 : 0;
  const atLimit = projectLimit && projectLimit > 0 && projectsUsed >= projectLimit;

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
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-[#00171f] dark:text-white">
            Your workspace
          </p>
          <Link href={atLimit ? "/dashboard" : "/projects/new"}>
            <Button
              disabled={atLimit}
              className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-semibold px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Could Not Load Projects</AlertTitle>
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {tier && (
          <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#00171f] dark:text-white capitalize">{tier.name}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
                {projectLimit !== null ? (
                  `You have created ${projectsUsed} of ${projectLimit} available projects.`
                ) : (
                  'Loading project limit...'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {projectLimit !== null ? (
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00171f] dark:bg-white rounded-full transition-all duration-500"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              ) : (
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              )}
            </CardContent>
            {atLimit && (
              <CardFooter className="bg-amber-50 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-800">
                <div className="w-full text-center text-sm text-amber-700 dark:text-amber-300 font-medium mt-2">
                  You've reached your project limit.
                  <Link
                    href="/#pricing"
                    className="ml-1 mr-1 text-[#00171f] dark:text-white hover:text-[#00171f]/80 dark:hover:text-white/80 underline font-semibold"
                  >
                    Upgrade your plan
                  </Link>
                  to create more.
                </div>
              </CardFooter>
            )}
          </Card>
        )}

        <Tabs defaultValue="created" className="space-y-5">
          <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 h-auto w-full justify-start gap-0">
            <TabsTrigger 
              value="created" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              Created
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({projectsUsed})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cloned" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              Cloned
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({clones.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="mt-4">
          {loadingProjects ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : displayedProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">No projects yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create your first project to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {visibleProjects.map((project, index) => {
                  const isOwner = project.roles[user.uid] === "owner";
                  const modifiedAt = (project as any).updatedAt ?? project.createdAt;
                  const globalIndex = (currentPage - 1) * projectsPageSize + index;
                  return (
                    <div key={project.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">#{globalIndex + 1}</span>
                            <Link
                              href={`/projects/${project.id}`}
                              className="text-sm font-semibold text-[#00171f] dark:text-white hover:text-[#00171f]/70 dark:hover:text-white/70 truncate"
                            >
                              {project.name}
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {isOwner ? "Owner" : "Contributor"}
                          </p>
                          {cloneProjectIds.has(project.id) && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00171f] dark:text-white">
                              Cloned
                            </span>
                          )}
                        </div>
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-200 flex-shrink-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="sr-only">Project options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl"
                            >
                              <DropdownMenuItem
                                onClick={(e) => handleToggleVisibility(project, e)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg transition-colors duration-200 text-[#00171f] dark:text-white"
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
                              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/30 focus:text-red-700 dark:focus:text-red-300 rounded-lg transition-colors duration-200"
                                onClick={(e) => openDeleteDialog(project, e)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {project.idea || "No description provided"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col gap-1">
                          <span>Created: {formatDate(project.createdAt)}</span>
                          <span>Modified: {formatDate(modifiedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GitFork className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="font-semibold text-[#00171f] dark:text-white">
                            {project.cloneCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">#</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Title</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Description</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Created</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Modified</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Clones</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                    {visibleProjects.map((project, index) => {
                      const isOwner = project.roles[user.uid] === "owner";
                      const modifiedAt = (project as any).updatedAt ?? project.createdAt;
                      const globalIndex = (currentPage - 1) * projectsPageSize + index;
                      return (
                        <tr key={project.id} className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{globalIndex + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/projects/${project.id}`}
                                className="text-sm font-semibold text-[#00171f] dark:text-white hover:text-[#00171f]/70 dark:hover:text-white/70"
                              >
                                {project.name}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isOwner ? "Owner" : "Contributor"}
                              </p>
                            </div>
                            {cloneProjectIds.has(project.id) && (
                              <span className="mt-1 inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00171f] dark:text-white">
                                Cloned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 overflow-hidden break-words text-ellipsis whitespace-normal">
                            {project.idea || "No description provided"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(project.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(modifiedAt)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <GitFork className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm font-semibold text-[#00171f] dark:text-white">
                                {project.cloneCount ?? 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isOwner && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-200"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    <span className="sr-only">Project options</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => handleToggleVisibility(project, e)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg transition-colors duration-200 text-[#00171f] dark:text-white"
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
                                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/30 focus:text-red-700 dark:focus:text-red-300 rounded-lg transition-colors duration-200"
                                    onClick={(e) => openDeleteDialog(project, e)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <Select
                    value={projectsPageSize.toString()}
                    onValueChange={(value) => {
                      setProjectsPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-sm text-[#00171f] dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {visibleProjects.length} of {displayedProjects.length} projects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Page {currentPage} / {totalProjectPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalProjectPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalProjectPages, prev + 1))}
                    className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          </TabsContent>

          <TabsContent value="cloned" className="mt-4">
          {loadingClones ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : clones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
              <GitFork className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">No clones yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clone a community project to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {visibleClones.map((clone, index) => {
                  const relative = formatDistanceToNow(clone.createdAt, { addSuffix: true });
                  const cloneIndex = (currentClonesPage - 1) * clonesPageSize + index;
                  return (
                    <div key={clone.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">#{cloneIndex + 1}</span>
                            <Link
                              href={`/projects/${clone.cloneProjectId}`}
                              className="text-sm font-semibold text-[#00171f] dark:text-white hover:text-[#00171f]/70 dark:hover:text-white/70 truncate"
                            >
                              {clone.sourceProjectName}
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{relative}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex-shrink-0"
                          disabled={deletingCloneId === clone.cloneProjectId}
                          onClick={() =>
                            handleDeleteClone(clone.cloneProjectId, clone.sourceProjectName)
                          }
                        >
                          {deletingCloneId === clone.cloneProjectId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {clone.sourceIdea || "No description provided"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col gap-1">
                          <span>Created: {formatDate(clone.createdAt)}</span>
                          <span>Modified: {formatDate(clone.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GitFork className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="font-semibold text-[#00171f] dark:text-white">1</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">#</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Title</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Description</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Created</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Modified</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Clones</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                    {visibleClones.map((clone, index) => {
                      const relative = formatDistanceToNow(clone.createdAt, { addSuffix: true });
                      const cloneIndex = (currentClonesPage - 1) * clonesPageSize + index;
                      return (
                        <tr key={clone.id} className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{cloneIndex + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/projects/${clone.cloneProjectId}`}
                                className="text-sm font-semibold text-[#00171f] dark:text-white hover:text-[#00171f]/70 dark:hover:text-white/70"
                              >
                                {clone.sourceProjectName}
                              </Link>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{relative}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {clone.sourceIdea || "No description provided"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(clone.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(clone.createdAt)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <GitFork className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm font-semibold text-[#00171f] dark:text-white">1</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
                              disabled={deletingCloneId === clone.cloneProjectId}
                              onClick={() =>
                                handleDeleteClone(clone.cloneProjectId, clone.sourceProjectName)
                              }
                            >
                              {deletingCloneId === clone.cloneProjectId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <Select
                    value={clonesPageSize.toString()}
                    onValueChange={(value) => {
                      setClonesPageSize(Number(value));
                      setCurrentClonesPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] text-sm text-[#00171f] dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {visibleClones.length} of {clones.length} clones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentClonesPage <= 1}
                    onClick={() => setCurrentClonesPage((prev) => Math.max(1, prev - 1))}
                    className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Page {currentClonesPage} / {totalClonePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentClonesPage >= totalClonePages}
                    onClick={() =>
                      setCurrentClonesPage((prev) => Math.min(totalClonePages, prev + 1))
                    }
                    className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#00171f] dark:text-white">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              This action cannot be undone. This will permanently delete the
              project{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                "{projectToDelete?.name}"
              </span>{" "}
              and all of its associated prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/25 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
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

      {/* Floating Execution Follow-Up Agent Button */}
      {!checkingAccess && user && hasExecutionFollowUpAccess && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/execution-follow-up">
                <Button
                  className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#00171f] hover:bg-[#00171f]/90 text-white shadow-2xl shadow-[#00171f]/30 hover:shadow-[#00171f]/40 border-0 transition-all duration-300 hover:scale-110 group"
                  size="icon"
                >
                  <Sparkles className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#00171f] text-white border-0 shadow-lg">
              <p className="font-medium">Execution Follow-Up Agent</p>
              <p className="text-xs text-white/80 mt-1">Repair prompts when AI doesn&apos;t follow instructions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
