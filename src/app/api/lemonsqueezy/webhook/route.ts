
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSubscription, createSubscription, deleteSubscriptionByLemonSqueezyId } from '@/lib/subscriptions';
import crypto from 'crypto';

// Ensure the Lemon Squeezy webhook secret is set in your environment variables
const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not configured.');
    return new NextResponse('Webhook secret is not configured.', { status: 500 });
  }

  try {
    const rawBody = await req.text();
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers.get('x-signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      return new NextResponse('Invalid signature.', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;
    const { event_name: eventName, custom_data: customData } = meta;
    const { attributes: subscriptionData, id: lemonSqueezyId } = data;
    
    // The user_id is passed in the `custom_data` during checkout creation
    const userId = customData?.user_id;

    if (!userId) {
        console.warn('Webhook received without a user_id in custom_data. Skipping.');
        return new NextResponse('Webhook processed (no user_id)', { status: 200 });
    }

    // Handle different subscription events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        // For 'subscription_updated', this will also create one if it doesn't exist yet (resilience).
        await createSubscription({
          userId: userId,
          lemonSqueezyId: lemonSqueezyId, // Use the top-level ID from the data object
          status: subscriptionData.status,
          planId: subscriptionData.variant_id.toString(),
          renewsAt: subscriptionData.renews_at,
          endsAt: subscriptionData.ends_at,
          trialEndsAt: subscriptionData.trial_ends_at,
        });
        break;

      case 'subscription_cancelled':
        await updateSubscription(lemonSqueezyId, {
          status: 'cancelled',
          endsAt: subscriptionData.ends_at,
        });
        break;
      
      case 'subscription_expired':
         await deleteSubscriptionByLemonSqueezyId(lemonSqueezyId);
        break;

      default:
        console.log(`Unhandled Lemon Squeezy webhook event: ${eventName}`);
    }

    return new NextResponse('Webhook processed successfully.', { status: 200 });

  } catch (error: any) {
    console.error('Error processing Lemon Squeezy webhook:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
