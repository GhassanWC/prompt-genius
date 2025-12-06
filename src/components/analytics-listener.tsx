'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { pageview } from '@/lib/gtag';

function AnalyticsInner(): JSX.Element | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsListener(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}

