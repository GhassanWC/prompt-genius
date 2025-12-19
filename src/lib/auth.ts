// src/lib/server/auth.ts
import 'server-only';
import { cookies, headers } from 'next/headers';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

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

export async function getCurrentUserEmail(): Promise<string | null> {
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
      return decoded?.email ?? null;
    }

    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch((error: any): null => null);
      return decoded?.email ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function isUserAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    return !!userData?.isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  const userId = await getCurrentUserId();
  const isAdmin = await isUserAdmin(userId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}
