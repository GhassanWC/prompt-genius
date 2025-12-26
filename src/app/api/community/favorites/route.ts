export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getDb } from '@/lib/firebase-admin';
import { FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const db = getDb();

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

// GET /api/community/favorites?projectId=xxx (get count, optionally check if user favorited)
// GET /api/community/favorites (get all favorites for user - requires auth)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (projectId) {
      const userIdParam = searchParams.get('userId');
      
      // Get favorite count (no auth required)
      const favoritesCountSnapshot = await db
        .collection('projectFavorites')
        .where('projectId', '==', projectId)
        .get();
      
      const count = favoritesCountSnapshot.size;
      
      // If userId is provided, check if this specific user favorited it (no auth required for this check)
      if (userIdParam) {
        const favoriteDoc = await db
          .collection('projectFavorites')
          .where('projectId', '==', projectId)
          .where('userId', '==', userIdParam)
          .limit(1)
          .get();

        return NextResponse.json({ 
          favorited: !favoriteDoc.empty,
          favoriteId: favoriteDoc.empty ? null : favoriteDoc.docs[0].id,
          count
        });
      }
      
      // Just return count if no userId specified
      return NextResponse.json({ count });
    }

    // Get all favorites for user (requires auth)
    const userId = await requireUser();
    const favoritesSnapshot = await db
      .collection('projectFavorites')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const favorites = favoritesSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      projectId: doc.data().projectId,
      createdAt: doc.data().createdAt?.toDate(),
    }));

    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error('[community/favorites GET] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// POST /api/community/favorites
// Body: { projectId: string, action: 'favorite' | 'unfavorite' }
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { projectId, action } = await req.json();

    if (!projectId || !action) {
      return NextResponse.json({ error: 'projectId and action are required' }, { status: 400 });
    }

    if (action === 'favorite') {
      // Check if already favorited
      const existingFavorite = await db
        .collection('projectFavorites')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingFavorite.empty) {
        return NextResponse.json({ error: 'Project already favorited' }, { status: 400 });
      }

      // Add favorite
      const favoriteRef = await db.collection('projectFavorites').add({
        projectId,
        userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, favoriteId: favoriteRef.id });
    } else if (action === 'unfavorite') {
      // Find and delete favorite
      const favoriteQuery = await db
        .collection('projectFavorites')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (favoriteQuery.empty) {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
      }

      await favoriteQuery.docs[0].ref.delete();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[community/favorites POST] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

