export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getDb, getAdminAuth } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const db = getDb();

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

// GET /api/community/activity - Get all user interactions (liked projects, favorited projects, user's comments)
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser();

    // Get liked projects (without orderBy to avoid index requirements)
    const likedProjectsSnapshot = await db
      .collection('projectLikes')
      .where('userId', '==', userId)
      .get();

    const likedProjectIds = likedProjectsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      projectId: doc.data().projectId,
      interactedAt: doc.data().createdAt?.toDate(),
      interactionType: 'like' as const,
    }));

    // Get favorited projects (without orderBy to avoid index requirements)
    const favoritedProjectsSnapshot = await db
      .collection('projectFavorites')
      .where('userId', '==', userId)
      .get();

    const favoritedProjectIds = favoritedProjectsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      projectId: doc.data().projectId,
      interactedAt: doc.data().createdAt?.toDate(),
      interactionType: 'favorite' as const,
    }));

    // Get user's comments (without orderBy to avoid index requirements)
    const commentsSnapshot = await db
      .collection('projectComments')
      .where('userId', '==', userId)
      .get();

    const userComments = await Promise.all(
      commentsSnapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId: data.projectId,
          content: data.content,
          interactedAt: data.createdAt?.toDate(),
          interactionType: 'comment' as const,
        };
      })
    );

    // Get project details for liked and favorited projects
    const allProjectIds = [
      ...new Set([
        ...likedProjectIds.map((item: { projectId: string }) => item.projectId),
        ...favoritedProjectIds.map((item: { projectId: string }) => item.projectId),
        ...userComments.map((comment: { projectId: string }) => comment.projectId),
      ]),
    ];

    const projectsData: Record<string, any> = {};
    
    // Fetch project details in batches
    for (const projectId of allProjectIds) {
      try {
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (projectDoc.exists) {
          const projectData = projectDoc.data();
          
          // Get author info
          let authorDisplayName = 'Unknown';
          let authorPhotoURL = null;
          
          if (projectData?.roles) {
            const ownerId = Object.keys(projectData.roles).find(
              (uid) => projectData.roles[uid] === 'owner'
            );
            
            if (ownerId) {
              try {
                const auth = getAdminAuth();
                const userRecord = await auth.getUser(ownerId);
                authorDisplayName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Unknown';
                authorPhotoURL = userRecord.photoURL;
              } catch (e) {
                console.error('Error fetching author:', e);
              }
            }
          }

          projectsData[projectId] = {
            id: projectId,
            name: projectData?.name || 'Untitled Project',
            idea: projectData?.idea || '',
            summary: projectData?.summary || undefined,
            imageUrl: projectData?.imageUrl || undefined,
            isPublic: projectData?.isPublic || false,
            createdAt: projectData?.createdAt?.toDate() || new Date(),
            likeCount: projectData?.likeCount || 0,
            commentCount: projectData?.commentCount || 0,
            author: {
              displayName: authorDisplayName,
              photoURL: authorPhotoURL,
            },
          };
        }
      } catch (error) {
        console.error(`Error fetching project ${projectId}:`, error);
      }
    }

    // Combine all interactions and sort by interactedAt (sort in memory)
    const allInteractions = [
      ...likedProjectIds.map((item: { projectId: string }) => ({
        ...item,
        project: projectsData[item.projectId],
      })),
      ...favoritedProjectIds.map((item: { projectId: string }) => ({
        ...item,
        project: projectsData[item.projectId],
      })),
      ...userComments.map((comment:any) => ({
        ...comment,
        project: projectsData[comment.projectId],
      })),
    ]
      .filter((item) => item.project) // Only include interactions where project still exists
      .sort((a, b) => {
        const aTime = a.interactedAt?.getTime() || 0;
        const bTime = b.interactedAt?.getTime() || 0;
        return bTime - aTime; // Most recent first
      });

    return NextResponse.json({
      interactions: allInteractions,
      stats: {
        likedProjects: likedProjectIds.length,
        favoritedProjects: favoritedProjectIds.length,
        comments: userComments.length,
      },
    });
  } catch (error: any) {
    console.error('[community/activity GET] Error:', error);
    if (error.message === '__unauthorized__') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

