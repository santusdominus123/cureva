// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const providers = {
  google: new GoogleAuthProvider(),
  github: new GithubAuthProvider(),
};
export const signInGoogle = () => signInWithPopup(auth, providers.google);
export const signInGitHub = () => signInWithPopup(auth, providers.github);
export const signInEmail   = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// Firestore & Storage
export const db      = getFirestore(app);
export const storage = getStorage(app);

export const capturesCol       = collection(db, 'captures');
export const captureStorageRef = (name: string) =>
  ref(storage, `captures/${name}`);