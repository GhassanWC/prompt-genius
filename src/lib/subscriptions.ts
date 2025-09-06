import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface Subscription {
  user_id: string;
  tier_id: 'plus' | 'pro' | 'free'; // Added tier_id
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
  last_processed_updated_at:string | null;
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


const subscriptionsRef = collection(db, 'subscriptions');

// Get a user's subscription from Firestore
export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  const docRef = doc(db, 'subscriptions', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Subscription;
  }
  return null;
};

// Create or update a subscription in Firestore.
// We use the Lemon Squeezy subscription ID as the primary way to find and update.
export const createSubscription = async (subscriptionData: Subscription): Promise<void> => {
  const subDocRef = doc(subscriptionsRef, subscriptionData.user_id);
  await setDoc(subDocRef, { 
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
  }, { merge: true });
};


// Update a subscription using its Lemon Squeezy ID
export const updateSubscription = async (lemonSqueezyId: string, data: Partial<Subscription>): Promise<void> => {
  const q = query(subscriptionsRef, where('lemonSqueezyId', '==', lemonSqueezyId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.warn(`Tried to update subscription with Lemon Squeezy ID ${lemonSqueezyId}, but it was not found.`);
    return;
  }

  const subDocRef = querySnapshot.docs[0].ref;
  await updateDoc(subDocRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};


// Delete a subscription using its Lemon Squeezy ID
export const deleteSubscriptionByLemonSqueezyId = async (lemonSqueezyId: string): Promise<void> => {
    const q = query(subscriptionsRef, where('lemonSqueezyId', '==', lemonSqueezyId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn(`Tried to delete subscription with Lemon Squeezy ID ${lemonSqueezyId}, but it was not found.`);
        return;
    }

    const subDocRef = querySnapshot.docs[0].ref;
    await deleteDoc(subDocRef);
}
