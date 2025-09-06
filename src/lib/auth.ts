// lib/server/auth.ts
import 'server-only';
import { cookies, headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function getCurrentUserId(): Promise<string | null> {
  // Try Authorization: Bearer <ID_TOKEN>
  const authHeader = (await headers()).get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Or Firebase session cookie (commonly "__session")
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  const token = bearer || sessionCookie;
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid || null;
  } catch {
    return null;
  }
}
