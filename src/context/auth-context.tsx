
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
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';


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
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: { firstName: string, lastName: string }) => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If the user just verified their email, they will be redirected to the login flow
        // and onAuthStateChanged will fire again. If they are now verified, send to dashboard.
        if (user.emailVerified && window.location.pathname.startsWith('/login')) {
            router.push('/dashboard');
        }
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
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, {
          displayName: `${firstName} ${lastName}`.trim()
      });
      await sendVerificationEmail();
      // Don't create the user doc here yet, wait for sign-in after verification.
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return result;
  }

  const signInWithEmail = async (email: string, pass: string) => {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (!result.user.emailVerified) {
        // User exists but email is not verified
        await sendVerificationEmail();
        throw new Error(`Your email is not verified. A new verification link has been sent to ${email}.`);
      }
      await handleSuccessfulSignIn(result);
      return result;
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulSignIn(result);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulSignIn(result);
    } catch (error) {
      console.error("Error signing in with Github", error);
      throw error;
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

       // Also update the user profile document in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { 
        displayName,
        firstName: data.firstName,
        lastName: data.lastName,
       }, { merge: true });
       
      // The onAuthStateChanged listener will eventually handle updating the user state.
      // For immediate feedback, we can manually update the local state.
      setUser(auth.currentUser);
    } else {
      throw new Error('User not signed in.');
    }
  };

  const changeUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          throw new Error(
            'This action is sensitive and requires a recent login. Please sign out and sign in again to change your password.'
          );
        }
        throw error;
      }
    } else {
      throw new Error('User not signed in.');
    }
  };

  const value = { user, loading, signInWithGoogle, signInWithGithub, signUpWithEmail, signInWithEmail, signOut, updateUserProfile, changeUserPassword, sendVerificationEmail };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
