'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { TEMPLATES, type PromptTemplate } from '@/lib/templates';
import { ArrowLeft, Search, Sparkles, Clock, TrendingUp, Code, ShoppingCart, Globe, Smartphone, Zap, Loader2 } from 'lucide-react';

const categoryIcons = {
  'web-app': Globe,
  'mobile-app': Smartphone,
  'saas': TrendingUp,
  'ecommerce': ShoppingCart,
  'api': Code,
  'extension': Zap,
  'other': Code,
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptTemplate['category'] | 'all'>('all');

  const filteredTemplates = useMemo(() => {
    let filtered = TEMPLATES;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleUseTemplate = (template: PromptTemplate) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/projects/new?template=${template.id}`);
  };

  const categories: Array<PromptTemplate['category'] | 'all'> = ['all', 'web-app', 'mobile-app', 'saas', 'ecommerce', 'api', 'extension'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
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
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? <UserNav /> : (
              <Link href="/login">
                <Button className="bg-[#00171f] dark:bg-white dark:text-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-lg shadow-[#00171f]/20 font-medium px-6 py-2 rounded-full transition-all duration-200">
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
        {/* Back link */}
        <div className="mb-8">
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-[#00171f] dark:hover:text-white transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {user ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#00171f] dark:text-white">
            Prompt Templates
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Get started quickly with pre-made project templates. Click "Use Template" to create a project.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#00171f] rounded-xl"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const CategoryIcon = category === 'all' ? Code : categoryIcons[category];
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full ${
                    selectedCategory === category
                      ? 'bg-[#00171f] dark:bg-white dark:text-[#00171f] text-white'
                      : 'bg-white dark:bg-[#00171f] border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {category !== 'all' && <CategoryIcon className="mr-2 h-4 w-4" />}
                  {category === 'all' ? 'All' : category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <Search className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-6 text-2xl font-bold text-[#00171f] dark:text-white">No Templates Found</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const CategoryIcon = categoryIcons[template.category];
              return (
                <Card
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CategoryIcon className="h-6 w-6 text-[#00171f] dark:text-white" />
                      <Badge className={difficultyColors[template.difficulty]}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-[#00171f] dark:text-white">{template.name}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-[#00171f] dark:bg-white dark:text-[#00171f] hover:bg-[#00171f]/90 text-white rounded-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

