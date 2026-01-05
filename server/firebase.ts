import admin from 'firebase-admin';

let firebaseApp: admin.app.App;

export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountStr = process.env.OMNISEND_FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    console.warn('Firebase service account not configured. Running in mock mode.');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    console.log('Firebase service account loaded for project:', serviceAccount.project_id);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.OMNISEND_FIREBASE_STORAGE_BUCKET,
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
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

export const ADMIN_EMAILS = (process.env.OMNISEND_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}
