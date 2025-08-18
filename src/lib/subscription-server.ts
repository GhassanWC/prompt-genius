// /lib/subscriptions.ts
import { firestore } from './firebase-admin';
import { deleteSubscription } from './lemon';

export interface Subscription {
  user_id: string;
  subscription_id: string;
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'cancelled' | 'expired' | 'on_trial' | 'unpaid' | 'paused';
  status_formatted: string;
  card_brand: string;
  card_last_four: string;
  payment_processor: string;
  pause: any | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  first_subscription_item: {
    id: number;
    subscription_id: number;
    price_id: number;
    quantity: number;
    is_usage_based: boolean;
    created_at: string;
    updated_at: string;
  };
  urls: {
    update_payment_method: string;
    customer_portal: string;
    customer_portal_update_subscription: string;
  };
}



export async function createSubscription(sub: Subscription) {
  
  return firestore.collection('subscriptions').doc(sub.user_id).set(sub, { merge: true });
}

export async function updateSubscription(sub: Subscription) {
  return firestore.collection('subscriptions').doc(sub.user_id).set(sub, { merge: true });
}

// This assumes lemonSqueezyId is not the doc ID, so we query for it:
export async function deleteSubscriptionByLemonSqueezyId(lemonSqueezyId: string) {
  const subs = await firestore.collection('subscriptions').where('lemonSqueezyId', '==', lemonSqueezyId).get();
  const batch = firestore.batch();
  subs.forEach(doc => batch.delete(doc.ref));
  return batch.commit();
}
