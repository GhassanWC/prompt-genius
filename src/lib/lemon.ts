
'use server';

import { LemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

const requiredVars = ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID', 'LEMONSQUEEZY_PLUS_PLAN_ID', 'LEMONSQUEEZY_PRO_PLAN_ID'];
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
        const checkout = await lemonsqueezy.createCheckout(parseInt(storeId), parseInt(planId), {
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

export async function getCustomerPortalUrl(email: string): Promise<string> {
    if (!lemonsqueezy) {
        throw new Error('Lemon Squeezy not configured.');
    }
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
        throw new Error('LEMONSQUEEZY_STORE_ID is not configured.');
    }

    try {
        // First, find the customer by their email
        const customers = await lemonsqueezy.listCustomers({ filter: { storeId: parseInt(storeId), email }});
        const customer = customers.data?.data[0];

        if (!customer) {
            return '/#pricing'; 
        }

        const subscriptions = await getSubscriptions(customer.id);
        const subscription = subscriptions?.[0];

        if (!subscription) {
            return '/#pricing';
        }
        
        return subscription.attributes.urls.customer_portal;
    } catch (e: any) {
        console.error('Error getting customer portal URL:', e);
        throw new Error('Could not retrieve subscription management link.');
    }
}

export async function getSubscriptions(customerId: number) {
     if (!lemonsqueezy) {
        throw new Error('Lemon Squeezy not configured.');
    }
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
        throw new Error('LEMONSQUEEZY_STORE_ID is not configured.');
    }

    try {
        const subscriptions = await lemonsqueezy.listSubscriptions({ 
            filter: { storeId: parseInt(storeId), customerId: customerId }
        });
        
        return subscriptions.data?.data;

    } catch (e: any) {
        console.error('Error getting subscriptions:', e);
        throw new Error('Could not retrieve subscriptions.');
    }
}
