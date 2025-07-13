'use server';

import LemonSqueezy from '@lemonsqueezy/lemonsqueezy.js';

const requiredVars = ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID'];
const missingVars = requiredVars.filter(
  (varName) => !process.env[varName]
);

let lemonsqueezy: LemonSqueezy | null = null;

if (missingVars.length > 0) {
  // In a real app, you'd want to handle this more gracefully.
  // For this context, we'll log an error.
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
        const { data, error } = await lemonsqueezy.createCheckout({
            store: parseInt(storeId, 10),
            variant: parseInt(planId, 10),
            checkout_data: {
                email,
                name,
                custom: {
                    user_id: userId,
                },
            },
            product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
            },
        });

        if (error) {
            console.error('Lemon Squeezy API Error:', error);
            throw new Error(error.message || 'Failed to create a checkout session.');
        }

        if (!data) {
             throw new Error('No data returned from checkout creation.');
        }

        return data.data.attributes.url;
    } catch (e: any) {
        console.error('Lemon Squeezy exception:', e);
        throw new Error(e.message || 'Failed to create a checkout session.');
    }
}
