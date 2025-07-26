'use server';

const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

const PLAN_IDS = {
    plus: process.env.LEMONSQUEEZY_PLUS_PLAN_ID,
    pro: process.env.LEMONSQUEEZY_PRO_PLAN_ID,
};

async function apiRequest(path: string, options: RequestInit = {}) {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) {
        throw new Error('LEMONSQUEEZY_API_KEY is not configured.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${apiKey}`);
    headers.set('Accept', 'application/vnd.api+json');
    headers.set('Content-Type', 'application/vnd.api+json');

    const response = await fetch(`${API_BASE_URL}/${path}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.errors?.[0]?.detail || `API error: ${response.statusText}`;
        console.error('Lemon Squeezy API Error:', data);
        throw new Error(errorMessage);
    }

    return data;
}

export async function createCheckout(plan: 'plus' | 'pro', userId: string, email: string, name: string): Promise<string> {
    const planId = PLAN_IDS[plan];
    const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
    
    if (!planId) {
        throw new Error(`Plan ID for "${plan}" is not configured in environment variables.`);
    }

    try {
        const response = await apiRequest('checkouts', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email,
                            name,
                            custom: {
                                user_id: userId,
                            },
                        },
                       product_options: {
                             redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: storeId,
                            },
                        },
                        variant: {
                            data: 
                                {
                                    type: 'variants',
                                    id: planId,
                                },
                            
                        },
                    },
                },
            }),
        });

        return response.data.attributes.url;

    } catch (e: any) {
        console.error('Lemon Squeezy exception:', e);
        throw new Error(e.message || 'Failed to create a checkout session.');
    }
}

async function listCustomers(email: string): Promise<any[]> {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
    const response = await apiRequest(`customers?filter[store_id]=${storeId}&filter[email]=${email}`);
    return response.data;
}

export async function getSubscriptions(customerId: string): Promise<any[]> {
    console.log("Getting subscriptions for customerId:", customerId);

    const query = new URLSearchParams();
    query.append('filter[customer_id]', customerId);

    const response = await apiRequest(
        `subscriptions?${customerId}`,
        { method: 'GET' }
    );

    if (!response?.data || !Array.isArray(response.data)) {
        throw new Error("Failed to retrieve subscriptions");
    }

    return response.data;
}


export async function getCustomerPortalUrl(email: string): Promise<string> {
    try {
        const customers = await listCustomers(email);
        const customer = customers?.[0];

        if (!customer) {
            console.log(`No Lemon Squeezy customer found for email: ${email}. Redirecting to pricing.`);
            return '/#pricing';
        }
        
        console.log(`Found customer ID: ${customer.id} for email: ${email}.`);

        const subscriptions = await getSubscriptions(customer.id);
        const activeSub = subscriptions.find(sub => sub.attributes.status === 'active' || sub.attributes.status === 'on_trial');
        console.log(subscriptions);
        if (!activeSub) {
            console.log(`No active or trial subscription found for customer ID: ${customer.id}. Redirecting to pricing.`);
            return '/#pricing';
        }
        
        console.log(`Found active subscription for customer ID: ${customer.id}. Portal URL: ${activeSub.attributes.urls.customer_portal}`);

        return activeSub.attributes.urls.customer_portal;
    } catch (e: any) {
        console.error('Error getting customer portal URL:', e);
        throw new Error('Could not retrieve subscription management link.');
    }
}
