
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { type SubscriptionPlan } from '@/lib/project-server';
import { Subscription } from '@/lib/subscription-server';



// Function to create a user profile document in Firestore if it doesn't exist
const createUserProfileDocument = async (user: User) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user;
    let firstName = '';
    let lastName = '';
    
    if (displayName) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    try {
      await setDoc(userRef, {
        displayName,
        firstName,
        lastName,
        email,
        photoURL,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user profile document: ", error);
    }
  }
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscriptionPlan: SubscriptionPlan | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: { firstName: string, lastName: string }) => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  getUserSubscription: () => Promise<Subscription | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If the user just verified their email, they will be redirected to the login flow
        // and onAuthStateChanged will fire again. If they are now verified, send to dashboard.
        if (user.emailVerified && window.location.pathname.startsWith('/login')) {
            router.push('/dashboard');
        }
        const token = await auth.currentUser?.getIdToken(); // ensure user is signed in first!
    
        const res = await fetch('/api/projects?subscriptionPlan=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        });
        if(!res.ok) {
          setLoading(false);
          throw new Error('Failed to fetch subscription plan.');
        }
        const {plan} = await res.json();
        setSubscriptionPlan(plan);
      } else {
        setSubscriptionPlan(null);
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSuccessfulSignIn = async (userCredential: any) => {
    if (userCredential.user) {
      await createUserProfileDocument(userCredential.user);
    }
    router.push('/dashboard');
  }

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
    } else {
        throw new Error('No user is currently signed in to send a verification email.');
    }
  }

  const signUpWithEmail = async (email: string, pass: string, firstName: string, lastName: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(result.user, {
            displayName: `${firstName} ${lastName}`.trim()
        });
        await sendVerificationEmail();
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return result;
    } catch (err: any) {
        switch (err.code) {
            case 'auth/email-already-in-use':
                throw new Error('An account with this email already exists. Try signing in instead.');
            case 'auth/weak-password':
                throw new Error('Your password must be at least 6 characters long.');
            case 'auth/invalid-email':
                throw new Error('Please enter a valid email address.');
            default:
                throw new Error('Something went wrong while creating your account. Please try again.');
        }
    }
  }

  const signInWithEmail = async (email: string, pass: string) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        if (!result.user.emailVerified) {
            await sendVerificationEmail();
            throw new Error(`Your email is not verified. A new verification link has been sent to ${email}.`);
        }
        await handleSuccessfulSignIn(result);
        return result;
      } catch (err: any) {
        // Re-throw specific, user-friendly messages
        if (err.message && err.message.includes('Your email is not verified')) {
            throw err;
        }
        switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                throw new Error('Invalid email or password. Please check your details and try again.');
            default:
                throw new Error('An unexpected error occurred during sign-in. Please try again later.');
        }
      }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulSignIn(result);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('This email is already linked to an account using a different sign-in method.');
      }
      throw new Error("We couldn't sign you in with Google. Please try again.");
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result:any = await signInWithPopup(auth, provider);
      result.user.email = result._tokenResponse.email;
      result.user.photoUrl = result._tokenResponse.photoURL;
      await handleSuccessfulSignIn(result);
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('This email is already linked to an account using a different sign-in method.');
        }
        console.error("GitHub sign-in error:", error);
        throw new Error("We couldn't sign you in with GitHub. Please try again.");
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateUserProfile = async (data: { firstName: string, lastName: string }) => {
    if (auth.currentUser) {
        const displayName = `${data.firstName} ${data.lastName}`.trim();
        await updateProfile(auth.currentUser, { displayName });

        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { 
            displayName,
            firstName: data.firstName,
            lastName: data.lastName
        }, { merge: true });
        
        setUser(auth.currentUser);
    } else {
        throw new Error("You must be signed in to update your profile.");
    }
  };

  const changeUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          throw new Error(
            'For your security, please sign out and sign back in before changing your password.'
          );
        }
        throw new Error("We couldn't update your password. Please try again.");
      }
    } else {
      throw new Error('You must be signed in to change your password.');
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
      await firebaseSendPasswordResetEmail(auth, email);
  }

  const getUserSubscription = async () => {
    const token = await auth.currentUser?.getIdToken();

    const res = await fetch("/api/subscription/features/subscriptionProjectsCount", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store", // optional if you want fresh data always
    });
    if (!res.ok) {
      setLoading(false);
      throw new Error("Failed to fetch subscription plan.");
    }
    const subscription = await res.json();
    return subscription;
  }
  const value = { 
    user, 
    loading, 
    subscriptionPlan, 
    signInWithGoogle, 
    signInWithGithub, 
    signUpWithEmail, 
    signInWithEmail, 
    signOut, 
    updateUserProfile, 
    changeUserPassword, 
    sendVerificationEmail, 
    sendPasswordResetEmail,
    getUserSubscription
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
