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

const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

const CREATED_PAGE_SIZE = 4;
const CLONES_PAGE_SIZE = 3;

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
      getUserSubscriptionProjectCount()
        .then(setUserSubscriptionProjectCount)
        .catch((err) => {
          console.error("Failed to fetch subscription project count:", err);
          setUserSubscriptionProjectCount(1); // Default to free tier limit on error
        });
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
    Math.ceil(displayedProjects.length / CREATED_PAGE_SIZE)
  );
  const totalClonePages = Math.max(1, Math.ceil(clones.length / CLONES_PAGE_SIZE));

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
    const start = (currentPage - 1) * CREATED_PAGE_SIZE;
    return displayedProjects.slice(start, start + CREATED_PAGE_SIZE);
  }, [currentPage, displayedProjects]);

  const visibleClones = useMemo(() => {
    const start = (currentClonesPage - 1) * CLONES_PAGE_SIZE;
    return clones.slice(start, start + CLONES_PAGE_SIZE);
  }, [currentClonesPage, clones]);

  const projectsUsed = displayedProjects.length;
  const projectLimit = userSubscriptionProjectCount ?? 0;
  const usagePercentage =
    projectLimit > 0 ? (projectsUsed / projectLimit) * 100 : 0;
  const atLimit = projectLimit > 0 && projectsUsed >= projectLimit;

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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-3xl sm:text-4xl font-bold font-headline text-slate-900">
            Your workspace
          </p>
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
            className="bg-red-50 border-red-200 text-red-800 rounded-2xl"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Could Not Load Projects</AlertTitle>
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {tier && (
          <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/50">
              <CardTitle className="text-2xl font-bold text-indigo-800 capitalize">{tier.name}</CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                You have created {projectsUsed} of {projectLimit} available projects.
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

        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-2xl font-semibold text-slate-900">
              Created projects — organize your work with clarity
            </h3>
            <span className="text-sm text-slate-500">{projectsUsed} active project{projectsUsed === 1 ? '' : 's'}</span>
          </div>
          {loadingProjects ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : displayedProjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-indigo-200" />
              <p className="mt-4 text-lg font-semibold text-slate-800">Nothing created yet</p>
              <p className="text-sm text-slate-500">Create a project to see it listed here.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200 ring-1 ring-slate-100 backdrop-blur">
              <div className="flex flex-col gap-1 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Showing</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {visibleProjects.length} of {displayedProjects.length} created projects
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    Page {currentPage} of {totalProjectPages}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Filtered to exclude cloned copies.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm text-slate-700">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">#</th>
                      <th className="w-24 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Image</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Title</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Description</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Created date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Modified date</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Clone counter</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleProjects.map((project, index) => {
                      const isOwner = project.roles[user.uid] === "owner";
                      const modifiedAt = (project as any).updatedAt ?? project.createdAt;
                      const globalIndex = (currentPage - 1) * CREATED_PAGE_SIZE + index;
                      return (
                        <tr key={project.id} className="border-b border-slate-100 transition-colors duration-150 hover:bg-indigo-50/30">
                          <td className="px-4 py-4 text-sm text-slate-500">{globalIndex + 1}</td>
                          <td className="px-4 py-4">
                            {project.imageUrl ? (
                              <Image
                                src={project.imageUrl}
                                alt={project.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl border border-slate-100 bg-slate-100 flex items-center justify-center">
                                <Logo className="h-6 w-6 text-indigo-300" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/projects/${project.id}`}
                                className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                              >
                                {project.name}
                              </Link>
                              <p className="text-xs text-slate-500">
                                {isOwner ? "Owner" : "Contributor"}
                              </p>
                            </div>
                            {cloneProjectIds.has(project.id) && (
                              <span className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                Cloned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 line-clamp-2 overflow-hidden break-words text-ellipsis whitespace-normal">
                            {project.idea || "No description provided"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{formatDate(project.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{formatDate(modifiedAt)}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
                            {project.cloneCount ?? 0}
                          </td>
                          <td className="px-4 py-4 text-right">
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
                                    <MoreVertical className="h-5 w-5 text-slate-500" />
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white/70">
                <p className="text-xs text-slate-500">
                  Showing {visibleProjects.length} of {displayedProjects.length} created projects
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-slate-600">
                    Page {currentPage} / {totalProjectPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalProjectPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalProjectPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-2xl font-semibold text-slate-900">
              Cloned projects — showcase the ideas you keep revisiting
            </h3>
            <span className="text-sm text-slate-500">
              {clones.length} cloned project{clones.length === 1 ? '' : 's'}
            </span>
          </div>
          {loadingClones ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
              <p className="mt-3 text-sm text-slate-500">Loading your clones...</p>
            </div>
          ) : clones.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
              <p className="text-lg font-semibold text-slate-800">No cloned projects yet</p>
              <p className="text-sm text-slate-500">Clone a community project to see it listed here.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200 ring-1 ring-slate-100 backdrop-blur">
              <div className="flex flex-col gap-1 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/80 to-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cloned spotlight</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {visibleClones.length} of {clones.length} clones
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    Page {currentClonesPage} of {totalClonePages}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Remove clones you no longer want on this list.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm text-slate-700">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">#</th>
                      <th className="w-24 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Image</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Title</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Description</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Created date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Modified date</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Clone count</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleClones.map((clone, index) => {
                      const relative = formatDistanceToNow(clone.createdAt, { addSuffix: true });
                      const cloneIndex = (currentClonesPage - 1) * CLONES_PAGE_SIZE + index;
                      return (
                        <tr key={clone.id} className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80">
                          <td className="px-4 py-4 text-sm text-slate-500">{cloneIndex + 1}</td>
                          <td className="px-4 py-4">
                            {clone.sourceImageUrl ? (
                              <Image
                                src={clone.sourceImageUrl}
                                alt={clone.sourceProjectName}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl border border-slate-100 bg-slate-100 flex items-center justify-center">
                                <Logo className="h-6 w-6 text-indigo-300" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/projects/${clone.cloneProjectId}`}
                                className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                              >
                                {clone.sourceProjectName}
                              </Link>
                              <span className="text-xs text-slate-500">{relative}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 line-clamp-2">
                            {clone.sourceIdea || "No description provided"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{formatDate(clone.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{formatDate(clone.createdAt)}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">1</td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm bg-white/80"
                              disabled={deletingCloneId === clone.cloneProjectId}
                              onClick={() =>
                                handleDeleteClone(clone.cloneProjectId, clone.sourceProjectName)
                              }
                            >
                              {deletingCloneId === clone.cloneProjectId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Remove clone"
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white/70">
                <p className="text-xs text-slate-500">
                  Showing {visibleClones.length} of {clones.length} cloned projects
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentClonesPage <= 1}
                    onClick={() => setCurrentClonesPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-slate-600">
                    Page {currentClonesPage} / {totalClonePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentClonesPage >= totalClonePages}
                    onClick={() =>
                      setCurrentClonesPage((prev) => Math.min(totalClonePages, prev + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
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
