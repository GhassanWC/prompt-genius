export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTier } from '@/lib/tiers-server';
import type { Tier } from '@/lib/tiers-server';

/**
 * GET /api/tiers
 * 
 * Returns all tiers (free, plus, pro) with their features
 * Public endpoint - no authentication required
 */
export async function GET(req: NextRequest) {
  try {
    const tierIds = ['free', 'plus', 'pro'];
    const tiers: Tier[] = [];

    for (const tierId of tierIds) {
      const tier = await getTier(tierId);
      if (tier) {
        tiers.push(tier);
      }
    }

    return NextResponse.json({ tiers });
  } catch (error: any) {
    console.error('[Tiers API] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}







