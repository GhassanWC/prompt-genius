export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const db = getDb();

// GET /api/community/trending?period=daily|weekly|monthly|alltime&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'weekly';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Calculate trending score based on:
    // - Likes (weight: 3)
    // - Clones (weight: 5)
    // - Comments (weight: 2)
    // - Recency (weight: 1)
    
    const now = new Date();
    let timeThreshold: Date;
    
    switch (period) {
      case 'daily':
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeThreshold = new Date(0); // All time
    }

    // Get all public projects
    const projectsSnapshot = await db
      .collection('projects')
      .where('isPublic', '==', true)
      .get();

    const projectsWithScores = await Promise.all(
      projectsSnapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
        const project = doc.data();
        const projectId = doc.id;
        const createdAt = project.createdAt?.toDate() || new Date();

        // Skip if outside time period
        if (createdAt < timeThreshold && period !== 'alltime') {
          return null;
        }

        // Get engagement metrics (get all, filter in memory for time period)
        const [likes, clones, comments] = await Promise.all([
          db.collection('projectLikes')
            .where('projectId', '==', projectId)
            .get(),
          db.collection('projectClones')
            .where('sourceProjectId', '==', projectId)
            .get(),
          db.collection('projectComments')
            .where('projectId', '==', projectId)
            .get(),
        ]);

        // Filter by time period
        const likesInPeriod = likes.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt >= timeThreshold;
        });
        const clonesInPeriod = clones.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt >= timeThreshold;
        });
        const commentsInPeriod = comments.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt >= timeThreshold;
        });

        const likesCount = likesInPeriod.length;
        const clonesCount = clonesInPeriod.length;
        const commentsCount = commentsInPeriod.length;

        // Calculate trending score
        const score = 
          (likesCount * 3) +
          (clonesCount * 5) +
          (commentsCount * 2) +
          (Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) * 0.1); // Recency bonus

        return {
          projectId,
          score,
          likesCount,
          clonesCount,
          commentsCount,
          createdAt,
        };
      })
    );

    // Filter nulls and sort by score
    const sorted = projectsWithScores
      .filter(p => p !== null)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, limit)
      .map((p, index) => ({
        ...p!,
        rank: index + 1,
        period,
      }));

    return NextResponse.json({ trending: sorted });
  } catch (error: any) {
    console.error('[community/trending GET] Error:', error);
    return NextResponse.json({ error: error.message || 'unexpected error' }, { status: 500 });
  }
}

