import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Financenuvem Project
const firebaseConfig = {
  apiKey: "AIzaSyBshFJCgKDPLy2dG6GbuvTvP9lV7ehdJjI",
  authDomain: "financenuvem.firebaseapp.com",
  projectId: "financenuvem",
  storageBucket: "financenuvem.appspot.com",
  messagingSenderId: "745688239352",
  appId: "1:745688239352:web:e741f9908087d7b5c0ff0d",
  measurementId: "G-700B45EHBC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable auth persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('[Firebase] Auth persistence enabled'))
  .catch((error) => console.error('[Firebase] Auth persistence error:', error));

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .then(() => console.log('[Firebase] Firestore offline persistence enabled'))
  .catch((error) => {
    if (error.code === 'failed-precondition') {
      console.warn('[Firebase] Multiple tabs open, persistence can only be enabled in one tab at a time');
    } else if (error.code === 'unimplemented') {
      console.warn('[Firebase] Browser does not support offline persistence');
    }
  });

export default app;
