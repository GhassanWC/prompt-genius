'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, FolderOpen } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { CollectionCard } from '@/components/community/collection-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { ProjectCollection } from '@/lib/community';

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<ProjectCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      loadCollections();
    }
  }, [authLoading]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community/collections?public=true');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      collection.name.toLowerCase().includes(lower) ||
      collection.description?.toLowerCase().includes(lower) ||
      collection.tags?.some(tag => tag.toLowerCase().includes(lower))
    );
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-0 font-bold group">
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
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? <UserNav /> : (
              <Link href="/login">
                <Button className="bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-medium px-6 py-2 rounded-full transition-all duration-200">
                  Sign In
                </Button>
              </Link>
            )}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f] dark:text-white">
              Collections
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              Browse curated collections of community projects.
            </p>
          </div>
          {user && (
            <Button
              onClick={() => {
                toast({
                  title: 'Coming soon',
                  description: 'Collection creation will be available soon.',
                });
              }}
              className="bg-[#00171f] hover:bg-[#00171f]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-2xl mb-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
              <Search className="h-5 w-5 text-[#00171f] dark:text-white" />
            </div>
            <Input
              type="search"
              placeholder="Search collections..."
              className="w-full bg-white dark:bg-[#00171f] text-base font-medium rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm focus:border-[#00171f] dark:focus:border-white focus:ring-2 focus:ring-[#00171f]/20 dark:focus:ring-white/20 transition-all duration-200 pl-12 pr-4 py-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-6 text-2xl font-bold text-[#00171f] dark:text-white">No Collections Found</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
              {searchTerm ? 'Try a different search term.' : 'No collections have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

