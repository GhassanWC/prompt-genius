// Safe, lazy Firebase Admin initializer (no top-level init)
// Works on Firebase App Hosting (ADC) or with env-based key.

import type { App } from 'firebase-admin/app';

let cachedApp: App | null = null;

export function getAdminApp(): App {
  const { getApps, initializeApp, applicationDefault, cert } = require('firebase-admin/app');

  if (cachedApp) return cachedApp;
  if (getApps().length) return (cachedApp = getApps()[0]);

  // Prefer Application Default Credentials (no env keys needed on App Hosting)
  const pj = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT;
  const ce = process.env.FIREBASE_CLIENT_EMAIL;
  let pk = process.env.FIREBASE_PRIVATE_KEY;

  if (pj && ce && pk) {
    // If using env key, all 3 must exist; normalize newlines
    pk = pk.replace(/\\n/g, '\n');
    cachedApp = initializeApp({ credential: cert({ projectId: pj, clientEmail: ce, privateKey: pk }) });
  } else {
    // Fallback to ADC (recommended on App Hosting)
    cachedApp = initializeApp({ credential: applicationDefault() });
  }

  return cachedApp;
}

export function getDb() {
  const { getFirestore } = require('firebase-admin/firestore');
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  const { getAuth } = require('firebase-admin/auth');
  return getAuth(getAdminApp());
}
