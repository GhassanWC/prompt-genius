
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { AlertTriangle } from 'lucide-react';
import { AnalyticsListener } from '@/components/analytics-listener';
import { ThemeToggle } from '@/components/theme-toggle';
export const metadata: Metadata = {
  title: 'Prompt Genius AI',
  description: 'Decompose your big ideas into actionable prompts.',
  icons: {
    icon: [
      // { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      // { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      // { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      // { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-1024.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-1024.png', sizes: '1024x1024', type: 'image/png' },
    ],
    // shortcut: '/icon-32.png',
  },
};

function MissingEnvVarsError() {
  const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const areAiKeysConfigured = !!process.env.GOOGLE_API_KEY;


  const firebaseVars = `
# Found in Firebase Console > Project settings > General
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
`;

  const aiVars = `
# Found in Google AI Studio
GOOGLE_API_KEY=...
`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-3xl w-full bg-card border border-destructive/50 rounded-lg p-8 space-y-6">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive flex-shrink-0" />
          <h1 className="text-2xl font-bold font-headline text-destructive">Configuration Error</h1>
        </div>
        
        <p className="text-muted-foreground">
          To run this application, you need to set up your environment variables. Create a file named <code>.env</code> in the project's root directory and add the following keys. You will need to restart the development server for the changes to take effect.
        </p>

        {!isFirebaseConfigured && (
          <div className="space-y-2">
            <p className="text-lg font-medium">Firebase Credentials (Required)</p>
             <p className="text-sm text-muted-foreground">These are needed for user authentication and database services.</p>
            <div className="bg-muted p-4 rounded-md text-sm font-code overflow-x-auto">
              <pre><code>{firebaseVars}</code></pre>
            </div>
          </div>
        )}

        {!areAiKeysConfigured && (
           <div className="space-y-2">
            <p className="text-lg font-medium">Google AI API Key (Required)</p>
            <p className="text-sm text-muted-foreground">This key is required for all AI features, including generating plans with models like Gemini Pro and Gemini Flash. You can create a free key in Google AI Studio.</p>
            <div className="bg-muted p-4 rounded-md text-sm font-code overflow-x-auto">
              <pre><code>{aiVars}</code></pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{scrollBehavior: 'smooth'}} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const initialTheme = theme || systemTheme;
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(initialTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Google Analytics (gtag.js) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-body antialiased">
          <ThemeProvider>
            <AuthProvider>
                <AnalyticsListener />
                {children}
                <ThemeToggle />
                <Toaster />
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
