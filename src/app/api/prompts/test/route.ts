export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { testPrompt } from '@/ai/flows/test-prompt';
import { getSubscriptionByUserId } from '@/lib/subscription-server';
import { getTier } from '@/lib/tiers-server';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

/**
 * POST /api/prompts/test
 * 
 * Body: { prompt: string, aiRole?: string }
 * Returns: { response: string }
 */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser();
    
    // Access control check for Prompt Playground
    const subscription = await getSubscriptionByUserId(uid);
    
    // Determine tier_id: use subscription tier if exists, otherwise use 'free'
    const tierId = subscription?.tier_id || 'free';
    const tier = await getTier(tierId);

    if (!tier || !tier.features?.promptPlayground) {
      const tierName = tier?.name || (tierId === 'free' ? 'Hobbyist' : tierId === 'plus' ? 'Plus' : 'Pro');
      return jsonError(`Prompt Playground is not available on the ${tierName} plan. Please upgrade to access this feature.`, 402);
    }

    const body = await req.json();
    const { prompt, aiRole } = body;

    if (!prompt || typeof prompt !== 'string') {
      return jsonError('prompt is required and must be a string');
    }

    if (aiRole && typeof aiRole !== 'string') {
      return jsonError('aiRole must be a string if provided');
    }

    const result = await testPrompt({ prompt, aiRole });
    
    return NextResponse.json({ 
      response: result.response 
    });
  } catch (e: any) {
    if (e?.message === '__unauthorized__') {
      return jsonError('Unauthorized', 401);
    }
    console.error('[prompts/test POST] Error:', e?.message || e, e?.stack);
    return jsonError(e?.message || 'Failed to test prompt. Please try again.', 500);
  }
}

