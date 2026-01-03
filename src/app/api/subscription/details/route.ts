export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getSubscriptionByUserId } from '@/lib/subscription-server';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('__unauthorized__');
  return uid;
}

/**
 * GET /api/subscription/details
 * 
 * Returns the user's subscription details from the subscriptions collection
 */
export async function GET(req: NextRequest) {
  try {
    const uid = await requireUser();
    
    const subscription = await getSubscriptionByUserId(uid);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Return subscription details (excluding sensitive data if needed)
    return NextResponse.json({
      subscription: {
        tier_id: subscription.tier_id,
        status: subscription.status,
        status_formatted: subscription.status_formatted,
        card_brand: subscription.card_brand,
        card_last_four: subscription.card_last_four,
        payment_processor: subscription.payment_processor,
        renews_at: subscription.renews_at,
        ends_at: subscription.ends_at,
        created_at: subscription.created_at,
        cancelled: subscription.cancelled,
        trial_ends_at: subscription.trial_ends_at,
        product_name: subscription.product_name,
        variant_name: subscription.variant_name,
        urls: subscription.urls,
      }
    });
  } catch (e: any) {
    if (e?.message === '__unauthorized__') {
      return jsonError('Unauthorized', 401);
    }
    console.error('[subscription/details GET] Error:', e?.message || e, e?.stack);
    return jsonError(e?.message || 'Failed to fetch subscription details.', 500);
  }
}

