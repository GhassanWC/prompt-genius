// src/lib/server/auth.ts
import 'server-only';
import { cookies, headers } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function getCurrentUserId(): Promise<string | null> {
  const h = await headers();
  const authHeader = h.get('authorization') ?? h.get('Authorization');
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;

  const c = await cookies();
  const sessionCookie = c.get('__session')?.value ?? null;

  if (!bearer && !sessionCookie) return null;

  const adminAuth = getAdminAuth();

  try {
    if (bearer) {
      const decoded = await adminAuth.verifyIdToken(bearer);
      return decoded?.uid ?? null;
    }

    // If you're issuing Firebase session cookies, verify them here
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch((error: any): null => null);
      return decoded?.uid ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
