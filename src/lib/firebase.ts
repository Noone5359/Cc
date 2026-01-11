// FIX: Updated Firebase imports for v9 compatibility.
// Only import core services - performance and analytics loaded on demand
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Lazy load Performance Monitoring and Analytics only when needed
type FirebasePerformance = ReturnType<typeof firebase.performance>;
type FirebaseAnalytics = ReturnType<typeof firebase.analytics>;
let perf: FirebasePerformance | null = null;
let analytics: FirebaseAnalytics | null = null;

// Helper to lazy load performance monitoring
export async function getPerformance(): Promise<FirebasePerformance | null> {
  if (perf) return perf;
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      await import('firebase/compat/performance');
      perf = firebase.performance();
      return perf;
    } catch (error) {
      console.warn('Failed to load Firebase Performance:', error);
      return null;
    }
  }
  return null;
}

// Helper to lazy load analytics
export async function getAnalytics(): Promise<FirebaseAnalytics | null> {
  if (analytics) return analytics;
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      await import('firebase/compat/analytics');
      analytics = firebase.analytics();
      return analytics;
    } catch (error) {
      console.warn('Failed to load Firebase Analytics:', error);
      return null;
    }
  }
  return null;
}

export { auth, db, storage, perf, analytics };
