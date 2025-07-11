
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
    try {
      await setDoc(userRef, {
        displayName,
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
  signUpWithEmail: (email: string, pass: string) => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: { displayName: string }) => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserProfileDocument(user);
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSuccessfulSignIn = async (userCredential: any) => {
    if (userCredential.user) {
        await createUserProfileDocument(userCredential.user);
    }
    router.push('/dashboard');
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

  const signUpWithEmail = async (email: string, pass: string) => {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await handleSuccessfulSignIn(result);
      return result;
  }

  const signInWithEmail = async (email: string, pass: string) => {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await handleSuccessfulSignIn(result);
      return result;
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateUserProfile = async (data: { displayName: string }) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
      });
       // Also update the user profile document in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { displayName: data.displayName }, { merge: true });
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

  const value = { user, loading, signInWithGoogle, signInWithGithub, signUpWithEmail, signInWithEmail, signOut, updateUserProfile, changeUserPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
