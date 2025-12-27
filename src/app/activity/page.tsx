'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Heart, Star, MessageSquare, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface ActivityProject {
  id: string;
  name: string;
  idea: string;
  summary?: string;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  likeCount?: number;
  commentCount?: number;
  author?: {
    displayName: string;
    photoURL: string | null;
  };
}

interface ActivityInteraction {
  id: string;
  projectId: string;
  interactedAt?: Date;
  interactionType: 'like' | 'favorite' | 'comment';
  content?: string; // For comments
  project?: ActivityProject;
}

interface ActivityData {
  interactions: ActivityInteraction[];
  stats: {
    likedProjects: number;
    favoritedProjects: number;
    comments: number;
  };
}

type FilterType = 'all' | 'likes' | 'favorites' | 'comments';

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (user && !authLoading) {
      fetchActivity();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const fetchActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/community/activity', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load activity');
      }

      const data = await res.json();
      setActivityData(data);
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load your activity. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInteractions = activityData?.interactions.filter((interaction) => {
    if (filter === 'all') return true;
    if (filter === 'likes') return interaction.interactionType === 'like';
    if (filter === 'favorites') return interaction.interactionType === 'favorite';
    if (filter === 'comments') return interaction.interactionType === 'comment';
    return true;
  }) || [];

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 fill-red-500 text-red-500" />;
      case 'favorite':
        return <Star className="h-4 w-4 fill-amber-500 text-amber-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'like':
        return 'Liked';
      case 'favorite':
        return 'Favorited';
      case 'comment':
        return 'Commented on';
      default:
        return '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white">
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

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-[#00171f] dark:text-white mb-2">
            My Activity
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            View all your interactions with projects and comments
          </p>
        </div>

        {/* Stats */}
        {activityData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Liked Projects</p>
                    <p className="text-2xl font-bold text-[#00171f] dark:text-white">
                      {activityData.stats.likedProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Favorited Projects</p>
                    <p className="text-2xl font-bold text-[#00171f] dark:text-white">
                      {activityData.stats.favoritedProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                    <p className="text-2xl font-bold text-[#00171f] dark:text-white">
                      {activityData.stats.comments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={`rounded-full text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm'
                : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="mr-2 h-3 w-3" />
            All
          </Button>
          <Button
            variant={filter === 'likes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('likes')}
            className={`rounded-full text-xs font-medium transition-all ${
              filter === 'likes'
                ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm'
                : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className="mr-2 h-3 w-3" />
            Likes
          </Button>
          <Button
            variant={filter === 'favorites' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('favorites')}
            className={`rounded-full text-xs font-medium transition-all ${
              filter === 'favorites'
                ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm'
                : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Star className="mr-2 h-3 w-3" />
            Favorites
          </Button>
          <Button
            variant={filter === 'comments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('comments')}
            className={`rounded-full text-xs font-medium transition-all ${
              filter === 'comments'
                ? 'bg-[#00171f] dark:bg-white text-white dark:text-[#00171f] shadow-sm'
                : 'bg-white dark:bg-[#00171f] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquare className="mr-2 h-3 w-3" />
            Comments
          </Button>
        </div>

        {/* Activity List */}
        {filteredInteractions.length === 0 ? (
          <Card className="bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#00171f] dark:text-white mb-2">
                No activity yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filter === 'all'
                  ? "You haven't interacted with any projects yet. Start exploring the community!"
                  : `You haven't ${filter} any projects yet.`}
              </p>
              <Link href="/community">
                <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white rounded-full">
                  Explore Community
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInteractions.map((interaction) => (
              <Card
                key={`${interaction.interactionType}-${interaction.id}`}
                className="bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Project Image */}
                    {interaction.project?.imageUrl && (
                      <Link href={`/projects/${interaction.projectId}`} className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={interaction.project.imageUrl}
                            alt={interaction.project.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getInteractionIcon(interaction.interactionType)}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {getInteractionLabel(interaction.interactionType)}
                            </span>
                            {interaction.interactedAt && (
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDistanceToNow(new Date(interaction.interactedAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/projects/${interaction.projectId}`}
                            className="block group"
                          >
                            <h3 className="text-lg font-semibold text-[#00171f] dark:text-white group-hover:text-[#00171f]/80 dark:group-hover:text-white/80 transition-colors mb-1">
                              {interaction.project?.name || 'Untitled Project'}
                            </h3>
                            {interaction.project?.idea && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {interaction.project.idea}
                              </p>
                            )}
                          </Link>
                          {interaction.interactionType === 'comment' && interaction.content && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {interaction.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Project Meta */}
                      {interaction.project && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                          {interaction.project.author && (
                            <div className="flex items-center gap-2">
                              {interaction.project.author.photoURL ? (
                                <Image
                                  src={interaction.project.author.photoURL}
                                  alt={interaction.project.author.displayName}
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700" />
                              )}
                              <span>{interaction.project.author.displayName}</span>
                            </div>
                          )}
                          {interaction.project.likeCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{interaction.project.likeCount}</span>
                            </div>
                          )}
                          {interaction.project.commentCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{interaction.project.commentCount}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

