import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
  const subDocRef = doc(subscriptionsRef, subscriptionData.userId);
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
