export const GA_MEASUREMENT_ID: string = process.env.NEXT_PUBLIC_GA_ID || '';

export const pageview = (url: string): void => {
  if (!GA_MEASUREMENT_ID) return;

  if (typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};


