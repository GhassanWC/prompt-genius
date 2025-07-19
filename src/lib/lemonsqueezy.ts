
import { LemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

const requiredVars = ['LEMONSQUEEZY_API_KEY'];
const missingVars = requiredVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
    console.warn(`Lemon Squeezy client is not configured. Missing environment variables: ${missingVars.join(', ')}`);
}

export const lemonsqueezy = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY!);
