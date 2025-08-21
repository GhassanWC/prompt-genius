import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateSubscription, createSubscription, deleteSubscriptionByLemonSqueezyId } from '@/lib/subscription-server';
const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not configured.');
    return new NextResponse('Webhook secret is not configured.', { status: 500 });
  }

  try {
    // 1. Get the raw request body
    const rawBodyBuffer = Buffer.from(await req.arrayBuffer());

    // 2. Compute HMAC SHA256, encode as hex
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBodyBuffer);
    const digest = hmac.digest('hex');

    // 3. Get the Lemon Squeezy X-Signature header
    const signatureHeader = req.headers.get('x-signature') || '';

    // 4. Compare signatures
    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader))) {
      console.warn('Invalid webhook signature received.');
      return new NextResponse('Invalid signature.', { status: 400 });
    }

    // 5. Only now, parse the body
    const bodyText = rawBodyBuffer.toString('utf8');
    const payload = JSON.parse(bodyText);
    const { meta, data } = payload;
    const { event_name: eventName, custom_data: customData } = meta;
    const { attributes: subscriptionData, id: lemonSqueezyId } = data;

    // The user_id is passed in the custom_data during checkout creation
    const userId = customData?.user_id;

    if (!userId) {
      console.warn(`Webhook received for event '${eventName}' without a user_id in custom_data. Skipping.`);
      return new NextResponse('Webhook processed (no user_id)', { status: 200 });
    }

    let tierId: 'plus' | 'pro' | null = null;
    if (subscriptionData.variant_name?.toLowerCase().includes('plus')) {
        tierId = 'plus';
    } else if (subscriptionData.variant_name?.toLowerCase().includes('pro')) {
        tierId = 'pro';
    }

    // Handle different subscription events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        if (!tierId) {
            console.warn(`Webhook received for event '${eventName}' with an unknown plan: '${subscriptionData.variant_name}'. Skipping.`);
            break;
        }
        console.log(`Executing 'createOrUpdateSubscription' for user ${userId} with plan ${tierId}`);
        await createSubscription({
          user_id: userId,
          subscription_id: lemonSqueezyId,
          tier_id: tierId,
          ...subscriptionData,
        });
        break;

      case 'subscription_cancelled':
        console.log(`Executing 'updateSubscription' for cancellation for user ${userId}`);
        // For cancellations, tierId might be null, but we still update the status
        await updateSubscription({
          user_id: userId,
          subscription_id: lemonSqueezyId,
          tier_id: tierId!, // Will be null, but base object needs it
          ...subscriptionData,
        });
        break;

      case 'subscription_expired':
        console.log(`Executing 'deleteSubscription' for user ${userId}`);
        await deleteSubscriptionByLemonSqueezyId(lemonSqueezyId);
        break;

      default:
        console.log(`Webhook event '${eventName}' received, but no action configured. Skipping.`);
        break;
    }

    return new NextResponse('Webhook processed successfully.', { status: 200 });
  } catch (error: any) {
    console.error('Error processing Lemon Squeezy webhook:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
