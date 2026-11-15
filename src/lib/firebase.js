import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'g-mountain.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'g-mountain',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'g-mountain.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '584300491726',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:584300491726:web:cec3d3afa91f89bb57719f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NYL9R1H6KG',
};

export const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;

// Auth & Firestore instances
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Analytics
export let analytics = null;
if (typeof window !== 'undefined' && app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

/**
 * Sign in using Google Popup
 */
export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not initialized. Check your API key.');
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (err) {
    console.error('[Firebase Auth] Login failed:', err);
    throw err;
  }
}

/**
 * Sign out
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Subscribe to auth changes
 */
export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Save user mountain data to Firestore under `users/{uid}/data/mountain`
 * and write a public reference to `shared_mountains/{uid}` for spectator links
 */
export async function saveMountainToCloud(uid, data, userProfile = {}) {
  if (!db || !uid) return;
  try {
    const payload = {
      roadmap: data.roadmap,
      completed: data.completed || [],
      clock: data.clock || null,
      restingCampId: data.restingCampId || null,
      aiRestNotes: data.aiRestNotes || {},
      lang: data.lang || 'en',
      updatedAt: serverTimestamp(),
      user: {
        uid,
        displayName: userProfile.displayName || 'Climber',
        photoURL: userProfile.photoURL || null,
      },
    };

    // Save to user's private document
    await setDoc(doc(db, 'users', uid), payload, { merge: true });

    // Also update public showcase document so friends can view this mountain
    await setDoc(doc(db, 'shared_mountains', uid), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to save mountain:', err.message);
    throw err;
  }
}

/**
 * Load user mountain data from Firestore
 */
export async function loadMountainFromCloud(uid) {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data();
    }
    // Check shared fallback
    const sharedSnap = await getDoc(doc(db, 'shared_mountains', uid));
    if (sharedSnap.exists()) {
      return sharedSnap.data();
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Failed to load mountain:', err.message);
    return null;
  }
}

/**
 * Load another person's public mountain for spectator view
 */
export async function loadSharedMountain(uid) {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'shared_mountains', uid));
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.warn('[Firestore] Failed to load shared mountain:', err.message);
    return null;
  }
}
