import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBJEcvvyf9niYfdrU6DYXqvwCLN0NtlVjk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "projekt90app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "projekt90app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "projekt90app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "693155758574",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:693155758574:web:485da3b33d35dc571a4eff",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T1KGZ3CJB5"
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Enable Offline Persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}
