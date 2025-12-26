export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const db = getDb();

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

// GET /api/community/comments?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const commentsSnapshot = await db
      .collection('projectComments')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments = await Promise.all(
      commentsSnapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        // Get user info
        let userDisplayName = 'Anonymous';
        let userPhotoURL = null;
        
        try {
          const auth = getAdminAuth();
          const userRecord = await auth.getUser(data.userId);
          userDisplayName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Anonymous';
          userPhotoURL = userRecord.photoURL;
        } catch (e) {
          console.error('Error fetching user:', e);
        }

        return {
          id: doc.id,
          projectId: data.projectId,
          userId: data.userId,
          userDisplayName,
          userPhotoURL,
          content: data.content,
          parentCommentId: data.parentCommentId || null,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate() || null,
          likes: data.likes || 0,
          isEdited: data.isEdited || false,
        };
      })
    );

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('[community/comments GET] Error:', error);
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// POST /api/community/comments
// Body: { projectId: string, content: string, parentCommentId?: string }
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { projectId, content, parentCommentId } = await req.json();

    if (!projectId || !content || !content.trim()) {
      return NextResponse.json({ error: 'projectId and content are required' }, { status: 400 });
    }

    // Get user info
    let userDisplayName = 'Anonymous';
    let userPhotoURL = null;
    
    try {
      const auth = getAdminAuth();
      const userRecord = await auth.getUser(userId);
      userDisplayName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Anonymous';
      userPhotoURL = userRecord.photoURL;
    } catch (e) {
      console.error('Error fetching user:', e);
    }

    const commentData: any = {
      projectId,
      userId,
      userDisplayName,
      userPhotoURL,
      content: content.trim(),
      createdAt: FieldValue.serverTimestamp(),
      likes: 0,
      isEdited: false,
    };

    if (parentCommentId) {
      commentData.parentCommentId = parentCommentId;
    }

    const commentRef = await db.collection('projectComments').add(commentData);

    // Update project comment count
    await db.collection('projects').doc(projectId).update({
      commentCount: FieldValue.increment(1),
    });

    return NextResponse.json({ 
      success: true, 
      commentId: commentRef.id,
      comment: {
        id: commentRef.id,
        ...commentData,
        createdAt: new Date(),
      }
    });
  } catch (error: any) {
    console.error('[community/comments POST] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// PATCH /api/community/comments
// Body: { commentId: string, content: string }
export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { commentId, content } = await req.json();

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 });
    }

    const commentRef = db.collection('projectComments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const commentData = commentDoc.data();
    if (commentData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await commentRef.update({
      content: content.trim(),
      updatedAt: FieldValue.serverTimestamp(),
      isEdited: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[community/comments PATCH] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// DELETE /api/community/comments
// Body: { commentId: string }
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const commentRef = db.collection('projectComments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const commentData = commentDoc.data();
    if (commentData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projectId = commentData?.projectId;

    await commentRef.delete();

    // Update project comment count
    if (projectId) {
      await db.collection('projects').doc(projectId).update({
        commentCount: FieldValue.increment(-1),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[community/comments DELETE] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

