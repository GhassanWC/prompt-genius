'use server';

import { LemonSqueezyClient } from '@lemonsqueezy/lemonsqueezy.js';

const requiredVars = ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID'];
const missingVars = requiredVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
}

const client = new LemonSqueezyClient(process.env.LEMONSQUEEZY_API_KEY!);

const PLAN_IDS = {
    plus: process.env.LEMONSQUEEZY_PLUS_PLAN_ID, // Replace with your actual Plus plan variant ID
    pro: process.env.LEMONSQUEEZY_PRO_PLAN_ID, // Replace with your actual Pro plan variant ID
};

export async function createCheckout(plan: 'plus' | 'pro', userId: string, email: string, name: string): Promise<string> {
    const planId = PLAN_IDS[plan];

    if (!planId) {
        throw new Error(`Plan ID for "${plan}" is not configured in environment variables.`);
    }

    try {
        const checkout = await client.createCheckout(process.env.LEMONSQUEEZY_STORE_ID!, planId, {
            checkoutData: {
                email,
                name,
                custom: {
                    user_id: userId,
                },
            },
            productOptions: {
                enabled: true,
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, // Redirect back to your app after payment
            },
        });

        return checkout.data.attributes.url;
    } catch (error: any) {
        console.error('Lemon Squeezy API Error:', error);
        throw new Error('Failed to create a checkout session.');
    }
}
