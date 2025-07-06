
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
            <p className="text-lg font-medium">AI Provider API Keys (At least one is required)</p>
            <p className="text-sm text-muted-foreground">This is needed for the AI-powered prompt generation features. Add keys for the models you wish to use.</p>
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
  const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const areAiKeysConfigured = !!process.env.GOOGLE_API_KEY;
  const isConfigured = isFirebaseConfigured && areAiKeysConfigured;


  return (
    <html lang="en" className="dark" style={{scrollBehavior: 'smooth'}}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {isConfigured ? (
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
