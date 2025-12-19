import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/firebase-admin';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';

function tsToDate(ts: any): Date {
  if (ts?.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

/**
 * GET /api/admin
 * 
 * Returns all users and all projects (private and public)
 * Only accessible by admin
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'users', 'projects', 'subscriptions', or 'feedbacks'

    if (type === 'users') {
      // Fetch all users
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || null,
          displayName: data.displayName || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          photoURL: data.photoURL || null,
          createdAt: data.createdAt ? tsToDate(data.createdAt) : null,
          projectCount: data.projectCount || 0,
          clonedProjectCount: data.clonedProjectCount || 0,
          isAdmin: !!data.isAdmin,
          masterAdmin: !!data.masterAdmin,
        };
      });

      // Sort by creation date (newest first)
      users.sort((a: any, b: any) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return NextResponse.json({ users });
    }

    if (type === 'projects') {
      // Fetch all projects (both private and public)
      const projectsSnapshot = await db.collection('projects').get();
      const projects = projectsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled Project',
          idea: data.idea || '',
          aiRole: data.aiRole || null,
          summary: data.summary || null,
          isPublic: !!data.isPublic,
          imageUrl: data.imageUrl || null,
          createdAt: data.createdAt ? tsToDate(data.createdAt) : null,
          roles: data.roles || {},
          members: data.members || {},
          clarificationSteps: data.clarificationSteps || [],
        };
      });

      // Get owner information for each project
      const ownerUids = projects
        .map((p: any) => Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner'))
        .filter(Boolean) as string[];

      const uniqueOwnerUids = Array.from(new Set(ownerUids));
      const ownerMap = new Map<string, any>();

      if (uniqueOwnerUids.length > 0) {
        // Fetch owners in chunks of 10 (Firestore limit)
        const chunks: string[][] = [];
        for (let i = 0; i < uniqueOwnerUids.length; i += 10) {
          chunks.push(uniqueOwnerUids.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const ownersSnapshot = await db
            .collection('users')
            .where(FieldPath.documentId(), 'in', chunk)
            .get();
          ownersSnapshot.docs.forEach((doc: any) => {
            ownerMap.set(doc.id, doc.data());
          });
        }
      }

      // Add owner info to projects
      const projectsWithOwners = projects.map((project: any) => {
        const ownerUid = Object.keys(project.roles || {}).find(
          (uid) => (project.roles as any)[uid] === 'owner'
        );
        const ownerData = ownerUid ? ownerMap.get(ownerUid) : null;

        return {
          ...project,
          owner: ownerUid
            ? {
                uid: ownerUid,
                email: ownerData?.email || null,
                displayName: ownerData?.displayName || null,
                photoURL: ownerData?.photoURL || null,
              }
            : null,
        };
      });

      // Sort by creation date (newest first)
      projectsWithOwners.sort((a: any, b: any) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return NextResponse.json({ projects: projectsWithOwners });
    }

    if (type === 'subscriptions') {
      // Fetch all subscriptions
      const subscriptionsSnapshot = await db.collection('subscriptions').get();
      
      console.log(`[Admin API] Found ${subscriptionsSnapshot.docs.length} subscription documents`);
      
      const subscriptions = subscriptionsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        
        // Handle date parsing - could be string or Firestore timestamp
        let createdAt: Date | null = null;
        if (data.created_at) {
          if (data.created_at.toDate) {
            createdAt = data.created_at.toDate();
          } else if (typeof data.created_at === 'string') {
            createdAt = new Date(data.created_at);
          }
        }
        
        let updatedAt: Date | null = null;
        if (data.updated_at) {
          if (data.updated_at.toDate) {
            updatedAt = data.updated_at.toDate();
          } else if (typeof data.updated_at === 'string') {
            updatedAt = new Date(data.updated_at);
          }
        }
        
        let renewsAt: Date | null = null;
        if (data.renews_at) {
          if (data.renews_at.toDate) {
            renewsAt = data.renews_at.toDate();
          } else if (typeof data.renews_at === 'string') {
            renewsAt = new Date(data.renews_at);
          }
        }
        
        let endsAt: Date | null = null;
        if (data.ends_at) {
          if (data.ends_at.toDate) {
            endsAt = data.ends_at.toDate();
          } else if (typeof data.ends_at === 'string') {
            endsAt = new Date(data.ends_at);
          }
        }
        
        return {
          userId: doc.id,
          tierId: data.tier_id || 'free',
          subscriptionId: data.subscription_id || null,
          status: data.status || null,
          userEmail: data.user_email || null,
          userName: data.user_name || null,
          productName: data.product_name || null,
          variantName: data.variant_name || null,
          cancelled: data.cancelled || false,
          createdAt,
          updatedAt,
          renewsAt,
          endsAt,
          cumulativeQuantity: data.cumulative_quantity || 0,
        };
      });

      // Sort by creation date (newest first)
      subscriptions.sort((a: any, b: any) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      console.log(`[Admin API] Returning ${subscriptions.length} subscriptions`);
      return NextResponse.json({ subscriptions });
    }

    if (type === 'feedbacks') {
      // Fetch all feedbacks
      const feedbacksSnapshot = await db.collection('feedback').get();
      const feedbacks = feedbacksSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || null,
          rating: data.rating || 0,
          comments: data.comments || '',
          createdAt: data.createdAt ? tsToDate(data.createdAt) : null,
        };
      });

      // Get user information for each feedback
      const userIds = feedbacks
        .map((f: any) => f.userId)
        .filter(Boolean) as string[];

      const uniqueUserIds = Array.from(new Set(userIds));
      const userMap = new Map<string, any>();

      if (uniqueUserIds.length > 0) {
        // Fetch users in chunks of 10 (Firestore limit)
        const chunks: string[][] = [];
        for (let i = 0; i < uniqueUserIds.length; i += 10) {
          chunks.push(uniqueUserIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const usersSnapshot = await db
            .collection('users')
            .where(FieldPath.documentId(), 'in', chunk)
            .get();
          usersSnapshot.docs.forEach((doc: any) => {
            userMap.set(doc.id, doc.data());
          });
        }
      }

      // Add user info to feedbacks
      const feedbacksWithUsers = feedbacks.map((feedback: any) => {
        const userData = feedback.userId ? userMap.get(feedback.userId) : null;

        return {
          ...feedback,
          user: feedback.userId
            ? {
                uid: feedback.userId,
                email: userData?.email || null,
                displayName: userData?.displayName || null,
                photoURL: userData?.photoURL || null,
              }
            : null,
        };
      });

      // Sort by creation date (newest first)
      feedbacksWithUsers.sort((a: any, b: any) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return NextResponse.json({ feedbacks: feedbacksWithUsers });
    }

    // If no type specified, return both
    const [usersSnapshot, projectsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('projects').get(),
    ]);

    const users = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
          uid: doc.id,
          email: data.email || null,
          displayName: data.displayName || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          photoURL: data.photoURL || null,
          createdAt: data.createdAt ? tsToDate(data.createdAt) : null,
          projectCount: data.projectCount || 0,
          clonedProjectCount: data.clonedProjectCount || 0,
          isAdmin: !!data.isAdmin,
          masterAdmin: !!data.masterAdmin,
        };
    });

    const projects = projectsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Untitled Project',
        idea: data.idea || '',
        aiRole: data.aiRole || null,
        summary: data.summary || null,
        isPublic: !!data.isPublic,
        imageUrl: data.imageUrl || null,
        createdAt: data.createdAt ? tsToDate(data.createdAt) : null,
        roles: data.roles || {},
        members: data.members || {},
        clarificationSteps: data.clarificationSteps || [],
      };
    });

    // Get owner information
    const ownerUids = projects
      .map((p: any) => Object.keys(p.roles || {}).find((uid) => (p.roles as any)[uid] === 'owner'))
      .filter(Boolean) as string[];

    const uniqueOwnerUids = Array.from(new Set(ownerUids));
    const ownerMap = new Map<string, any>();

    if (uniqueOwnerUids.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < uniqueOwnerUids.length; i += 10) {
        chunks.push(uniqueOwnerUids.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const ownersSnapshot = await db
          .collection('users')
          .where(FieldPath.documentId(), 'in', chunk)
          .get();
        ownersSnapshot.docs.forEach((doc: any) => {
          ownerMap.set(doc.id, doc.data());
        });
      }
    }

    const projectsWithOwners = projects.map((project: any) => {
      const ownerUid = Object.keys(project.roles || {}).find(
        (uid) => (project.roles as any)[uid] === 'owner'
      );
      const ownerData = ownerUid ? ownerMap.get(ownerUid) : null;

      return {
        ...project,
        owner: ownerUid
          ? {
              uid: ownerUid,
              email: ownerData?.email || null,
              displayName: ownerData?.displayName || null,
              photoURL: ownerData?.photoURL || null,
            }
          : null,
      };
    });

    // Sort
    users.sort((a: any, b: any) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    projectsWithOwners.sort((a: any, b: any) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      users,
      projects: projectsWithOwners,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin
 * 
 * Admin actions:
 * - { action: "setAdmin", userId, isAdmin } -> Set/unset admin status for a user
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const action = body?.action as string;

    if (action === 'setAdmin') {
      const { userId, isAdmin } = body;
      if (!userId || typeof isAdmin !== 'boolean') {
        return NextResponse.json({ error: 'userId and isAdmin (boolean) are required' }, { status: 400 });
      }

      const db = getDb();
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userDoc.data();
      
      // Check if user is master admin
      if (userData?.masterAdmin) {
        // Master admin cannot have admin status removed
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Cannot remove admin access from master admin. Master admin status can only be changed in Firestore database.' },
            { status: 403 }
          );
        }
        // If trying to set admin to true for master admin, just ensure it's set
        // (master admin should always have isAdmin = true)
        await db.collection('users').doc(userId).update({ isAdmin: true });
        return NextResponse.json({ success: true });
      }

      // Prevent setting masterAdmin through API (only through Firestore)
      // Just update isAdmin for regular users
      await db.collection('users').doc(userId).update({ isAdmin });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin
 * 
 * Admin actions:
 * - { action: "deleteProject", projectId } -> Delete a project (admin can delete any project)
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const action = body?.action as string;

    if (action === 'deleteProject') {
      const { projectId } = body;
      if (!projectId) {
        return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
      }

      const db = getDb();
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const projectData = projectDoc.data();
      const batch = db.batch();

      // Delete the project
      batch.delete(projectRef);

      // Delete all prompts in the project
      const promptsSnap = await projectRef.collection('prompts').get();
      promptsSnap.forEach((promptDoc: any) => {
        batch.delete(promptDoc.ref);
      });

      // Decrement project count for the owner
      const ownerUid = Object.keys(projectData?.roles || {}).find(
        (uid) => (projectData?.roles as any)?.[uid] === 'owner'
      );
      if (ownerUid) {
        const userRef = db.collection('users').doc(ownerUid);
        batch.update(userRef, {
          projectCount: FieldValue.increment(-1),
        });
      }

      await batch.commit();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

