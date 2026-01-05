import admin from 'firebase-admin';

let firebaseApp: admin.app.App;

export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (!serviceAccount) {
    console.warn('Firebase service account not configured. Running in mock mode.');
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return firebaseApp;
}

export function getFirestore() {
  const app = initializeFirebase();
  if (!app) return null;
  return admin.firestore();
}

export function getStorage() {
  const app = initializeFirebase();
  if (!app) return null;
  return admin.storage();
}

export function getAuth() {
  const app = initializeFirebase();
  if (!app) return null;
  return admin.auth();
}

export async function verifyToken(token: string) {
  const auth = getAuth();
  if (!auth) throw new Error('Firebase not initialized');
  return await auth.verifyIdToken(token);
}

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}
