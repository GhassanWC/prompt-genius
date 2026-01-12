'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  // Auto-redirect to home page after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image
          src="/logo.png"
          alt="Prompt Genius Logo"
          width={60}
          height={60}
        />
        <span className="font-headline text-xl font-bold text-[#00171f] dark:text-white">
          Prompt Genius AI
        </span>
      </Link>

      {/* 404 Message */}
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-[#00171f] dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-[#00171f] dark:text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Redirecting you to the home page in 3 seconds...
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            className="bg-[#00171f] hover:bg-[#00171f]/90 text-white px-6 py-3 rounded-full font-medium"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-2 border-[#00171f] dark:border-white text-[#00171f] dark:text-white hover:bg-[#00171f] hover:text-white dark:hover:bg-white dark:hover:text-[#00171f] px-6 py-3 rounded-full font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #00171f 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>
    </div>
  );
}

