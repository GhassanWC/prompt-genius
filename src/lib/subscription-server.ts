// src/lib/subscription-server.ts
import "server-only";
import { getDb } from './firebase-admin';

export interface Subscription {
  user_id: string;
  tier_id: 'plus' | 'pro';
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
  cumulative_quantity: number;
  last_processed_updated_at: string | null;
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

// Upserts from the webhook are often partials—require user_id always.
type SubscriptionUpsert = Partial<Subscription> & { user_id: string };

/** Create (or merge) a subscription doc keyed by user_id */
export async function createSubscription(sub: SubscriptionUpsert) {
  const db = getDb();
  return db.collection('subscriptions').doc(sub.user_id).set(sub, { merge: true });
}

/** Update (merge) a subscription doc keyed by user_id */
export async function updateSubscription(sub: SubscriptionUpsert) {
  const db = getDb();
  return db.collection('subscriptions').doc(sub.user_id).set(sub, { merge: true });
}

/** Delete by Lemon Squeezy subscription id (field is `subscription_id` in your schema) */
export async function deleteSubscriptionByLemonSqueezyId(lemonSqueezyId: string) {
  const db = getDb();
  const snap = await db.collection('subscriptions')
    .where('subscription_id', '==', lemonSqueezyId)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(doc.ref));
  return batch.commit();
}

/** Fast path: your docs are stored with docId = user_id, so fetch directly */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const db = getDb();
  const doc = await db.collection('subscriptions').doc(userId).get();
  return doc.exists ? (doc.data() as Subscription) : null;
}
