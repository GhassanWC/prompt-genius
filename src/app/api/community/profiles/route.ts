export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = getDb();

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

// GET /api/community/profiles?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get profile document
    const profileDoc = await db.collection('userProfiles').doc(userId).get();

    if (!profileDoc.exists) {
      // Create default profile
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

      const defaultProfile = {
        userId,
        displayName: userDisplayName,
        photoURL: userPhotoURL,
        bio: '',
        website: '',
        github: '',
        twitter: '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        projectsCreated: 0,
        projectsCloned: 0,
        totalLikes: 0,
        totalComments: 0,
        badges: [],
      };

      await db.collection('userProfiles').doc(userId).set(defaultProfile);

      return NextResponse.json({ profile: { ...defaultProfile, id: userId } });
    }

    const profileData = profileDoc.data();
    
    // Calculate stats
    const [projectsCreated, projectsCloned, likesCount, commentsCount] = await Promise.all([
      db.collection('projects').where('roles.' + userId, '==', 'owner').get(),
      db.collection('projectClones').where('ownerId', '==', userId).get(),
      db.collection('projectLikes').where('userId', '==', userId).get(),
      db.collection('projectComments').where('userId', '==', userId).get(),
    ]);

    const profile = {
      id: profileDoc.id,
      ...profileData,
      projectsCreated: projectsCreated.size,
      projectsCloned: projectsCloned.size,
      totalLikes: likesCount.size,
      totalComments: commentsCount.size,
      createdAt: profileData?.createdAt?.toDate(),
      updatedAt: profileData?.updatedAt?.toDate(),
    };

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('[community/profiles GET] Error:', error);
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

// PATCH /api/community/profiles
// Body: { bio?, website?, github?, twitter? }
export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUser();
    const { bio, website, github, twitter } = await req.json();

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (twitter !== undefined) updateData.twitter = twitter;

    await db.collection('userProfiles').doc(userId).set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[community/profiles PATCH] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

