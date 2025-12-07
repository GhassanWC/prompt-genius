// src/app/api/migrate-user-counts/route.ts
// ONE-TIME MIGRATION ENDPOINT - Delete this file after running!

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes - adjust based on your Vercel plan

// IMPORTANT: Change this secret before deploying!
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'change-this-secret-key';

export async function POST(req: NextRequest) {
  try {
    // Simple auth check
    const { secret } = await req.json();
    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const usersSnap = await db.collection('users').get();
    
    const results: { userId: string; projectCount: number; clonedProjectCount: number }[] = [];
    const errors: { userId: string; error: string }[] = [];
    const skipped: string[] = [];

    const users = usersSnap.docs;
    console.log(`Starting migration for ${users.length} users...`);

    for (const userDoc of users) {
      const userId = userDoc.id;
      const userData = userDoc.data() as any;

      try {
        // Skip if already migrated
        if (typeof userData.projectCount === 'number' && typeof userData.clonedProjectCount === 'number') {
          console.log(`⏭️  User ${userId} already migrated, skipping...`);
          skipped.push(userId);
          continue;
        }

        // Count projects where user is a member
        const projectsSnap = await db
          .collection('projects')
          .where(`members.${userId}`, '==', true)
          .get();
        
        // Count cloned projects for this user
        const clonesSnap = await db
          .collection('projectClones')
          .where('ownerId', '==', userId)
          .get();

        const projectCount = projectsSnap.size;
        const clonedProjectCount = clonesSnap.size;

        // Update user document with counts
        await db.collection('users').doc(userId).update({
          projectCount,
          clonedProjectCount,
        });

        results.push({ userId, projectCount, clonedProjectCount });
        console.log(`✅ Migrated user ${userId}: ${projectCount} projects, ${clonedProjectCount} clones`);

      } catch (err: any) {
        console.error(`❌ Error migrating user ${userId}:`, err);
        errors.push({ userId, error: err.message });
      }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`✅ Successfully migrated: ${results.length}`);
    console.log(`⏭️  Skipped (already migrated): ${skipped.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`📊 Total users: ${users.length}`);

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      migrated: results.length,
      skipped: skipped.length,
      errors: errors.length,
      results,
      skippedUsers: skipped,
      errorDetails: errors,
    });

  } catch (e: any) {
    console.error('Migration failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET endpoint to check migration status
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const usersSnap = await db.collection('users').get();
    
    let migrated = 0;
    let notMigrated = 0;
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data() as any;
      if (typeof userData.projectCount === 'number' && typeof userData.clonedProjectCount === 'number') {
        migrated++;
      } else {
        notMigrated++;
      }
    }

    return NextResponse.json({
      totalUsers: usersSnap.size,
      migrated,
      notMigrated,
      percentComplete: usersSnap.size > 0 ? Math.round((migrated / usersSnap.size) * 100) : 100,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

