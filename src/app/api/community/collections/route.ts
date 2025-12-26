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

// GET /api/community/collections?userId=xxx (get user's collections)
// GET /api/community/collections?collectionId=xxx (get specific collection)
// GET /api/community/collections?public=true (get public collections)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const collectionId = searchParams.get('collectionId');
    const publicOnly = searchParams.get('public') === 'true';

    if (collectionId) {
      // Get specific collection
      const collectionDoc = await db.collection('projectCollections').doc(collectionId).get();
      
      if (!collectionDoc.exists) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      const data = collectionDoc.data();
      const collection = {
        id: collectionDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      };

      return NextResponse.json({ collection });
    }

    if (publicOnly) {
      // Get all public collections
      const collectionsSnapshot = await db
        .collection('projectCollections')
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const collections = collectionsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        };
      });

      return NextResponse.json({ collections });
    }

    if (userId) {
      // Get user's collections
      const collectionsSnapshot = await db
        .collection('projectCollections')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const collections = collectionsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        };
      });

      return NextResponse.json({ collections });
    }

    return NextResponse.json({ error: 'userId, collectionId, or public=true required' }, { status: 400 });
  } catch (error: any) {
    console.error('[community/collections GET] Error:', error);
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// POST /api/community/collections
// Body: { name: string, description?: string, projectIds: string[], isPublic: boolean, tags?: string[] }
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { name, description, projectIds, isPublic, tags } = await req.json();

    if (!name || !projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'name and projectIds array are required' }, { status: 400 });
    }

    // Get user info
    const auth = getAdminAuth();
    let userDisplayName = 'Anonymous';
    let userPhotoURL = null;
    
    try {
      const userRecord = await auth.getUser(userId);
      userDisplayName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Anonymous';
      userPhotoURL = userRecord.photoURL;
    } catch (e) {
      console.error('Error fetching user:', e);
    }

    const collectionData = {
      name: name.trim(),
      description: description?.trim() || '',
      userId,
      userDisplayName,
      userPhotoURL,
      projectIds,
      isPublic: isPublic || false,
      tags: tags || [],
      followerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const collectionRef = await db.collection('projectCollections').add(collectionData);

    return NextResponse.json({ 
      success: true, 
      collectionId: collectionRef.id,
      collection: {
        id: collectionRef.id,
        ...collectionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  } catch (error: any) {
    console.error('[community/collections POST] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// PATCH /api/community/collections
// Body: { collectionId: string, name?, description?, projectIds?, isPublic?, tags? }
export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { collectionId, name, description, projectIds, isPublic, tags } = await req.json();

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    const collectionRef = db.collection('projectCollections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const collectionData = collectionDoc.data();
    if (collectionData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (projectIds !== undefined) updateData.projectIds = projectIds;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = tags;

    await collectionRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[community/collections PATCH] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// DELETE /api/community/collections?collectionId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    const collectionRef = db.collection('projectCollections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const collectionData = collectionDoc.data();
    if (collectionData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await collectionRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[community/collections DELETE] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

