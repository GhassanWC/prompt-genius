// /lib/subscriptions.ts
import { firestore } from './firebase-admin';

export interface Subscription {
  userId: string;
  lemonSqueezyId: string;
  status: 'active' | 'cancelled' | 'expired' | 'on_trial' | 'unpaid' | 'paused';
  planId: string; // e.g., the plan variant ID from Lemon Squeezy
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export async function createSubscription(sub: Subscription) {
  const now = new Date().toISOString();

  // Always overwrite with up-to-date timestamps
  const data: Subscription = {
    ...sub,
    createdAt: sub.createdAt ?? now,
    updatedAt: now,
  };
  return firestore.collection('subscriptions').doc(sub.userId).set(data, { merge: true });
}

export async function updateSubscription(userId: string, updates: Partial<Subscription>) {
  const now = new Date().toISOString();
  return firestore.collection('subscriptions').doc(userId).update({
    ...updates,
    updatedAt: now,
  });
}

// This assumes lemonSqueezyId is not the doc ID, so we query for it:
export async function deleteSubscriptionByLemonSqueezyId(lemonSqueezyId: string) {
  const subs = await firestore.collection('subscriptions').where('lemonSqueezyId', '==', lemonSqueezyId).get();
  const batch = firestore.batch();
  subs.forEach(doc => batch.delete(doc.ref));
  return batch.commit();
}
