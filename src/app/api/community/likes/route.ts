export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = getDb();

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

// GET /api/community/likes?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId'); // Check if specific user liked

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    if (userId) {
      // Check if user liked this project
      const likeDoc = await db
        .collection('projectLikes')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      return NextResponse.json({ 
        liked: !likeDoc.empty,
        likeId: likeDoc.empty ? null : likeDoc.docs[0].id 
      });
    }

    // Get total likes count
    const likesSnapshot = await db
      .collection('projectLikes')
      .where('projectId', '==', projectId)
      .get();

    return NextResponse.json({ 
      count: likesSnapshot.size,
      liked: false 
    });
  } catch (error: any) {
    console.error('[community/likes GET] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// POST /api/community/likes
// Body: { projectId: string, action: 'like' | 'unlike' }
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { projectId, action } = await req.json();

    if (!projectId || !action) {
      return NextResponse.json({ error: 'projectId and action are required' }, { status: 400 });
    }

    if (action === 'like') {
      // Check if already liked
      const existingLike = await db
        .collection('projectLikes')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingLike.empty) {
        return NextResponse.json({ error: 'Project already liked' }, { status: 400 });
      }

      // Add like
      const likeRef = await db.collection('projectLikes').add({
        projectId,
        userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update project like count (denormalized)
      await db.collection('projects').doc(projectId).update({
        likeCount: FieldValue.increment(1),
      });

      return NextResponse.json({ success: true, likeId: likeRef.id });
    } else if (action === 'unlike') {
      // Find and delete like
      const likeQuery = await db
        .collection('projectLikes')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (likeQuery.empty) {
        return NextResponse.json({ error: 'Like not found' }, { status: 404 });
      }

      await likeQuery.docs[0].ref.delete();

      // Update project like count
      await db.collection('projects').doc(projectId).update({
        likeCount: FieldValue.increment(-1),
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[community/likes POST] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

