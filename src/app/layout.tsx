
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PromptForge AI',
  description: 'Decompose your big ideas into actionable prompts.',
};

function MissingEnvVarsError() {
  const isAiKeyConfigured = !!process.env.GOOGLE_API_KEY;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-3xl w-full bg-card border border-destructive/50 rounded-lg p-8 space-y-6">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive flex-shrink-0" />
          <h1 className="text-2xl font-bold font-headline text-destructive">Configuration Error</h1>
        </div>
        <div className="space-y-4">
            <p className="text-lg font-medium">Your Firebase environment variables are not set.</p>
            <p className="text-muted-foreground">Please create or update the <code>.env</code> file in your project's root directory with your Firebase project credentials. You can find these values in the Firebase Console under Project settings &gt; General.</p>
            <div className="bg-muted p-4 rounded-md text-sm font-code overflow-x-auto">
              <pre>
                <code>
{`# Firebase credentials (required)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Genkit AI provider credentials (at least one is required)
# GOOGLE_API_KEY=...
`}
                </code>
              </pre>
            </div>
            {!isAiKeyConfigured && (
              <p className="text-muted-foreground">Additionally, you need to configure an AI provider (e.g., Google AI) for the application to function.</p>
            )}
            <p className="text-sm text-muted-foreground">
              After adding the variables, you will need to restart the development server for the changes to take effect.
            </p>
        </div>
      </div>
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  return (
    <html lang="en" className="dark" style={{scrollBehavior: 'smooth'}}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {isFirebaseConfigured ? (
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
        ) : (
            <MissingEnvVarsError />
        )}
      </body>
    </html>
  );
}
