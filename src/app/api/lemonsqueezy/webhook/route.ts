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

    // 2. Compute HMAC SHA256, encode as base64
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBodyBuffer);
    const digestBase64 = hmac.digest('base64');

    // 3. Get the Lemon Squeezy X-Signature header
    const signatureHeader = req.headers.get('x-signature') || '';

    // 4. Compare signature (base64)
    const digestBuffer = Buffer.from(digestBase64, 'base64');
    const signatureBuffer = Buffer.from(signatureHeader, 'hex');

    console.log("digestBase64:", digestBase64);
    console.log("signatureHeader:", signatureHeader);
    console.log("Buffer.equals:", digestBuffer.equals(signatureBuffer));


    if (
      digestBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(digestBuffer, signatureBuffer)
    ) {


  

    // 5. Only now, parse the body
    const bodyText = rawBodyBuffer.toString('utf8');
    const payload = JSON.parse(bodyText);
    
    console.log('--- Lemon Squeezy Webhook Received ---');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const { meta, data } = payload;
    const { event_name: eventName, custom_data: customData } = meta;
    const { attributes: subscriptionData } = data;

    
    
    // The user_id is passed in the `custom_data` during checkout creation
    const userId = customData?.user_id;

    console.log(`Event Name: ${eventName}`);
    console.log(`User ID from custom_data: ${userId}`);


    if (!userId) {
      console.warn('Webhook received without a user_id in custom_data. Skipping.');
      return new NextResponse('Webhook processed (no user_id)', { status: 200 });
    }

    // Handle different subscription events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        console.log(`Executing 'createSubscription' for user ${userId}...`);
        await createSubscription({
          userId: userId,
          lemonSqueezyId: data.id, // <<--- THIS FIXES THE ERROR
  
          status: subscriptionData.status,
          planId: subscriptionData.variant_id?.toString() ?? '', // Defensive: avoid undefined
          renewsAt: subscriptionData.renews_at ?? null,
          endsAt: subscriptionData.ends_at ?? null,
          trialEndsAt: subscriptionData.trial_ends_at ?? null,
        });
        console.log(`'createSubscription' completed for user ${userId}.`);
        break;

      case 'subscription_cancelled':
        await updateSubscription(subscriptionData.id, {
          status: 'cancelled',
          endsAt: subscriptionData.ends_at,
        });
        break;

      case 'subscription_expired':
        await deleteSubscriptionByLemonSqueezyId(subscriptionData.id);
         console.log(`Executing 'deleteSubscriptionByLemonSqueezyId' for Lemon Squeezy ID ${lemonSqueezyId}.`);
   
        break;
      default:
        console.log(`Unhandled Lemon Squeezy webhook event: ${eventName}`);
        break;
    }

    return new NextResponse('Webhook processed successfully.', { status: 200 });
  } catch (error: any) {
    console.error('Error processing Lemon Squeezy webhook:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
