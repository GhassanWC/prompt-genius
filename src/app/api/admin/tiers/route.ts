export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/firebase-admin';
import type { Tier } from '@/lib/tiers-server';

/**
 * GET /api/admin/tiers
 * 
 * Returns all tiers (free, plus, pro) with their features
 * Only accessible by admin
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const db = getDb();
    const tierIds = ['free', 'plus', 'pro'];
    const tiers: Tier[] = [];

    console.log('[Admin Tiers API] Fetching tiers...');

    for (const tierId of tierIds) {
      try {
        const tierDoc = await db.collection('tiers').doc(tierId).get();
        
        console.log(`[Admin Tiers API] Tier ${tierId} - exists: ${tierDoc.exists}`);
        
        if (tierDoc.exists) {
          const data = tierDoc.data();
          console.log(`[Admin Tiers API] Tier ${tierId} data:`, JSON.stringify(data, null, 2));
          
          // Get all features from database, including custom ones
          const dbFeatures = data?.features || {};
          
          // Build features object with predefined defaults and all custom features
          const allFeatures = {
            projectLimit: dbFeatures.projectLimit ?? (tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10),
            featureLimit: dbFeatures.featureLimit ?? (tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32),
            fullPromptGeneration: dbFeatures.fullPromptGeneration ?? true,
            publicProjects: dbFeatures.publicProjects ?? (tierId !== 'free'),
            communityAccess: dbFeatures.communityAccess ?? (tierId !== 'free'),
            aiPromptEnhancement: dbFeatures.aiPromptEnhancement ?? (tierId !== 'free'),
            executionFollowUpAgent: dbFeatures.executionFollowUpAgent ?? (tierId === 'pro'),
            promptPlayground: dbFeatures.promptPlayground ?? (tierId !== 'free'),
            cloning: dbFeatures.cloning ?? (tierId !== 'free'),
            support: dbFeatures.support || (tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority'),
            // Include all custom features (any keys not in predefined list)
            ...Object.keys(dbFeatures).reduce((acc, key) => {
              if (!['projectLimit', 'featureLimit', 'fullPromptGeneration', 'publicProjects', 'communityAccess', 'aiPromptEnhancement', 'executionFollowUpAgent', 'promptPlayground', 'cloning', 'support'].includes(key)) {
                acc[key] = dbFeatures[key];
              }
              return acc;
            }, {} as Record<string, any>),
          };
          
          tiers.push({
            id: tierDoc.id,
            name: data?.name || tierId.charAt(0).toUpperCase() + tierId.slice(1),
            features: allFeatures,
          });
        } else {
          // Return default values if tier doesn't exist
          console.log(`[Admin Tiers API] Tier ${tierId} doesn't exist, using defaults`);
          tiers.push({
            id: tierId,
            name: tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro',
            features: {
              projectLimit: tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10,
              featureLimit: tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32,
              fullPromptGeneration: true,
              publicProjects: tierId !== 'free',
              communityAccess: tierId !== 'free',
              aiPromptEnhancement: tierId !== 'free',
              executionFollowUpAgent: tierId === 'pro',
              promptPlayground: tierId !== 'free',
              cloning: tierId !== 'free',
              support: tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority',
            },
          });
        }
      } catch (tierError: any) {
        console.error(`[Admin Tiers API] Error fetching tier ${tierId}:`, tierError);
        // Still add default tier even if fetch fails
        tiers.push({
          id: tierId,
          name: tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro',
          features: {
            projectLimit: tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10,
            featureLimit: tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32,
            fullPromptGeneration: true,
            publicProjects: tierId !== 'free',
            communityAccess: tierId !== 'free',
            aiPromptEnhancement: tierId !== 'free',
            executionFollowUpAgent: tierId === 'pro',
            promptPlayground: tierId !== 'free',
            cloning: tierId !== 'free',
            support: tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority',
          },
        });
      }
    }

    console.log(`[Admin Tiers API] Returning ${tiers.length} tiers`);
    return NextResponse.json({ tiers });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin Tiers API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/tiers
 * 
 * Updates a tier's features
 * Body: { tierId: string, name?: string, features: Partial<Tier['features']> }
 * Only accessible by admin
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { tierId, name, features } = body;

    if (!tierId || !['free', 'plus', 'pro'].includes(tierId)) {
      return NextResponse.json({ error: 'Invalid tierId. Must be free, plus, or pro' }, { status: 400 });
    }

    if (!features || typeof features !== 'object') {
      return NextResponse.json({ error: 'features object is required' }, { status: 400 });
    }

    const db = getDb();
    const tierRef = db.collection('tiers').doc(tierId);
    const tierDoc = await tierRef.get();

    // Validate feature values
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }

    if (features.projectLimit !== undefined) {
      if (typeof features.projectLimit !== 'number' || features.projectLimit < 0) {
        return NextResponse.json({ error: 'projectLimit must be a non-negative number' }, { status: 400 });
      }
      updateData['features.projectLimit'] = features.projectLimit;
    }

    if (features.featureLimit !== undefined) {
      if (typeof features.featureLimit !== 'number' || features.featureLimit < 1) {
        return NextResponse.json({ error: 'featureLimit must be a positive number (at least 1)' }, { status: 400 });
      }
      updateData['features.featureLimit'] = features.featureLimit;
    }

    if (features.fullPromptGeneration !== undefined) {
      if (typeof features.fullPromptGeneration !== 'boolean') {
        return NextResponse.json({ error: 'fullPromptGeneration must be a boolean' }, { status: 400 });
      }
      updateData['features.fullPromptGeneration'] = features.fullPromptGeneration;
    }

    if (features.publicProjects !== undefined) {
      if (typeof features.publicProjects !== 'boolean') {
        return NextResponse.json({ error: 'publicProjects must be a boolean' }, { status: 400 });
      }
      updateData['features.publicProjects'] = features.publicProjects;
    }

    if (features.communityAccess !== undefined) {
      if (typeof features.communityAccess !== 'boolean') {
        return NextResponse.json({ error: 'communityAccess must be a boolean' }, { status: 400 });
      }
      updateData['features.communityAccess'] = features.communityAccess;
    }

    if (features.aiPromptEnhancement !== undefined) {
      if (typeof features.aiPromptEnhancement !== 'boolean') {
        return NextResponse.json({ error: 'aiPromptEnhancement must be a boolean' }, { status: 400 });
      }
      updateData['features.aiPromptEnhancement'] = features.aiPromptEnhancement;
    }

    if (features.executionFollowUpAgent !== undefined) {
      if (typeof features.executionFollowUpAgent !== 'boolean') {
        return NextResponse.json({ error: 'executionFollowUpAgent must be a boolean' }, { status: 400 });
      }
      updateData['features.executionFollowUpAgent'] = features.executionFollowUpAgent;
    }

    if (features.promptPlayground !== undefined) {
      if (typeof features.promptPlayground !== 'boolean') {
        return NextResponse.json({ error: 'promptPlayground must be a boolean' }, { status: 400 });
      }
      updateData['features.promptPlayground'] = features.promptPlayground;
    }

    if (features.cloning !== undefined) {
      if (typeof features.cloning !== 'boolean') {
        return NextResponse.json({ error: 'cloning must be a boolean' }, { status: 400 });
      }
      updateData['features.cloning'] = features.cloning;
    }

    if (features.support !== undefined) {
      if (!['none', 'community', 'priority'].includes(features.support)) {
        return NextResponse.json({ error: 'support must be none, community, or priority' }, { status: 400 });
      }
      updateData['features.support'] = features.support;
    }

      // If tier doesn't exist, create it with default values first
      if (!tierDoc.exists) {
        const defaultTier: any = {
          name: tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro',
          features: {
            projectLimit: tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10,
            featureLimit: tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32,
            fullPromptGeneration: true,
            publicProjects: tierId !== 'free',
            communityAccess: tierId !== 'free',
            aiPromptEnhancement: tierId !== 'free',
            executionFollowUpAgent: tierId === 'pro',
            promptPlayground: tierId !== 'free',
            cloning: tierId !== 'free',
            support: tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority',
          },
        };

      // Merge with updates
      if (updateData.name) defaultTier.name = updateData.name;
      Object.keys(updateData).forEach((key) => {
        if (key.startsWith('features.')) {
          const featureKey = key.replace('features.', '');
          defaultTier.features[featureKey] = updateData[key];
        }
      });

      await tierRef.set(defaultTier);
    } else {
      // Update existing tier
      // Firestore doesn't support nested updates with dot notation in a single call,
      // so we need to get the current data, merge, and set
      const currentData = tierDoc.data() || {};
      const currentFeatures = currentData.features || {};

      // Build the new features object with predefined features
      const mergedFeatures: Record<string, any> = {
        // Always include predefined features (use provided value or keep current or default)
        projectLimit: features.projectLimit !== undefined ? features.projectLimit : (currentFeatures.projectLimit ?? (tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10)),
        featureLimit: features.featureLimit !== undefined ? features.featureLimit : (currentFeatures.featureLimit ?? (tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32)),
        fullPromptGeneration: features.fullPromptGeneration !== undefined ? features.fullPromptGeneration : (currentFeatures.fullPromptGeneration ?? true),
        publicProjects: features.publicProjects !== undefined ? features.publicProjects : (currentFeatures.publicProjects ?? (tierId !== 'free')),
        communityAccess: features.communityAccess !== undefined ? features.communityAccess : (currentFeatures.communityAccess ?? (tierId !== 'free')),
        aiPromptEnhancement: features.aiPromptEnhancement !== undefined ? features.aiPromptEnhancement : (currentFeatures.aiPromptEnhancement ?? (tierId !== 'free')),
        executionFollowUpAgent: features.executionFollowUpAgent !== undefined ? features.executionFollowUpAgent : (currentFeatures.executionFollowUpAgent ?? (tierId === 'pro')),
        promptPlayground: features.promptPlayground !== undefined ? features.promptPlayground : (currentFeatures.promptPlayground ?? (tierId !== 'free')),
        cloning: features.cloning !== undefined ? features.cloning : (currentFeatures.cloning ?? (tierId !== 'free')),
        support: features.support !== undefined ? features.support : (currentFeatures.support || (tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority')),
      };

      // Add custom features that are in the request (this will replace the entire features object, removing deleted ones)
      Object.keys(features).forEach((key) => {
        if (!['projectLimit', 'featureLimit', 'fullPromptGeneration', 'publicProjects', 'communityAccess', 'aiPromptEnhancement', 'executionFollowUpAgent', 'promptPlayground', 'cloning', 'support'].includes(key)) {
          mergedFeatures[key] = features[key];
        }
      });

      await tierRef.update({
        ...(name !== undefined && { name }),
        features: mergedFeatures,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin Tiers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/tiers
 * 
 * Adds a new feature to all tiers
 * Body: { fieldName: string, type: string, defaultValue: any }
 * Only accessible by admin
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { fieldName, type, defaultValue } = body;

    if (!fieldName || typeof fieldName !== 'string') {
      return NextResponse.json({ error: 'fieldName is required and must be a string' }, { status: 400 });
    }

    if (!type || !['string', 'number', 'boolean'].includes(type)) {
      return NextResponse.json({ error: 'type is required and must be string, number, or boolean' }, { status: 400 });
    }

    // Validate and convert default value based on type
    let value: any;
    if (type === 'number') {
      value = typeof defaultValue === 'number' ? defaultValue : (parseFloat(String(defaultValue)) || 0);
    } else if (type === 'boolean') {
      value = typeof defaultValue === 'boolean' ? defaultValue : (defaultValue === 'true' || defaultValue === true);
    } else {
      value = String(defaultValue || '');
    }

    const db = getDb();
    const tierIds = ['free', 'plus', 'pro'];

    // Add the feature to all tiers
    for (const tierId of tierIds) {
      const tierRef = db.collection('tiers').doc(tierId);
      const tierDoc = await tierRef.get();

      if (tierDoc.exists) {
        const currentData = tierDoc.data() || {};
        const currentFeatures = currentData.features || {};

        // Check if feature already exists
        if (currentFeatures[fieldName] !== undefined) {
          continue; // Skip if already exists
        }

        // Add the new feature
        await tierRef.update({
          [`features.${fieldName}`]: value,
        });
      } else {
        // Create tier with default values including new feature
        const defaultTier: any = {
          name: tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro',
          features: {
            projectLimit: tierId === 'free' ? 1 : tierId === 'plus' ? 5 : 10,
            featureLimit: tierId === 'free' ? 8 : tierId === 'plus' ? 16 : 32,
            fullPromptGeneration: true,
            publicProjects: tierId !== 'free',
            communityAccess: tierId !== 'free',
            aiPromptEnhancement: tierId !== 'free',
            executionFollowUpAgent: tierId === 'pro',
            promptPlayground: tierId !== 'free',
            cloning: tierId !== 'free',
            support: tierId === 'free' ? 'none' : tierId === 'plus' ? 'community' : 'priority',
            [fieldName]: value,
          },
        };

        await tierRef.set(defaultTier);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    console.error('Admin Tiers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

