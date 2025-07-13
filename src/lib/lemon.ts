'use server';

import { LemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

const requiredVars = ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID'];
const missingVars = requiredVars.filter(
  (varName) => !process.env[varName]
);

let lemonsqueezy: LemonSqueezy | null = null;

if (missingVars.length > 0) {
  console.error(`Lemon Squeezy is not configured. Missing environment variables: ${missingVars.join(', ')}`);
} else {
    lemonsqueezy = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY!);
}


const PLAN_IDS = {
    plus: process.env.LEMONSQUEEZY_PLUS_PLAN_ID,
    pro: process.env.LEMONSQUEEZY_PRO_PLAN_ID,
};

export async function createCheckout(plan: 'plus' | 'pro', userId: string, email: string, name: string): Promise<string> {
    if (!lemonsqueezy) {
        throw new Error(`Cannot create checkout. Lemon Squeezy is not configured on the server.`);
    }

    const planId = PLAN_IDS[plan];
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!planId) {
        throw new Error(`Plan ID for "${plan}" is not configured in environment variables.`);
    }
    if (!storeId) {
        throw new Error(`LEMONSQUEEZY_STORE_ID is not configured in environment variables.`);
    }

    try {
        const checkout = await lemonsqueezy.createCheckout({
            storeId: parseInt(storeId, 10),
            variantId: parseInt(planId, 10),
            checkoutData: {
                email,
                name,
                custom: {
                    user_id: userId,
                },
            },
            productOptions: {
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
            },
        });

        if (checkout.error) {
            console.error('Lemon Squeezy API Error:', checkout.error);
            throw new Error(checkout.error.message || 'Failed to create a checkout session.');
        }

        if (!checkout.data) {
             throw new Error('No data returned from checkout creation.');
        }

        return checkout.data.attributes.url;
    } catch (e: any) {
        console.error('Lemon Squeezy exception:', e);
        throw new Error(e.message || 'Failed to create a checkout session.');
    }
}
