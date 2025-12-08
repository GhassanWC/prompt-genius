
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let firebaseConfig: FirebaseOptions;

// Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG with full client config including apiKey
if (process.env.FIREBASE_WEBAPP_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
} else if (process.env.FIREBASE_CONFIG) {
    // Fallback to FIREBASE_CONFIG (may not have apiKey for server-side only config)
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
    // For local development, use NEXT_PUBLIC_ variables from .env file
    firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
}


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
