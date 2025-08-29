// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, query, where, DocumentSnapshot, QueryDocumentSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Dataset, Photo } from "../types/database";

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
// Persist auth to local storage so user stays logged in between sessions
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});
export const providers = {
  google: new GoogleAuthProvider(),
  github: new GithubAuthProvider(),
};
export const signInGoogle = () => signInWithPopup(auth, providers.google);
export const signInGitHub = () => signInWithPopup(auth, providers.github);
export const signInEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);

// Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collections
export const datasetsCol = collection(db, "datasets");
export const capturesCol = collection(db, "captures");

// Storage References
export const captureStorageRef = (name: string) => ref(storage, `captures/${name}`);
export const datasetStorageRef = (datasetId: string, filename: string) => ref(storage, `datasets/${datasetId}/${filename}`);

// Realtime Firebase Functions
export const uploadImageToFirebase = async (imageDataUrl: string, datasetId: string, timestamp: number): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // Create storage reference
    const imageRef = datasetStorageRef(datasetId, `photo_${timestamp}.jpg`);

    // Upload image
    await uploadBytes(imageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(imageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Function to create or update dataset in Firestore
export const saveDatasetToFirestore = async (dataset: DatasetWithMetadata) => {
  try {
    const docRef = doc(db, "datasets", dataset.id || "");
    const { id, ...dataWithoutId } = dataset; // Remove id from data to be saved
    await setDoc(docRef, dataWithoutId, { merge: true });
    return docRef;
  } catch (error) {
    console.error("Error saving dataset:", error);
    throw error;
  }
};

// Function to listen to dataset changes
export const listenToDataset = (datasetId: string, onChange: (data: DatasetWithMetadata) => void) => {
  const docRef = doc(db, "datasets", datasetId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as Omit<Dataset, "id">;
      onChange({ ...data, id: snapshot.id });
    }
  });
};

// Function to get all datasets for a user
export const getUserDatasets = (userId: string, onChange: (datasets: DatasetWithMetadata[]) => void) => {
  const q = query(collection(db, "datasets"), where("userId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const datasets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Dataset, "id">),
    }));
    onChange(datasets);
  });
};

// Local type for captures before they are uploaded
export type Capture = {
  angle: number;
  level: 1 | 2 | 3 | 4;
  dataUrl: string;
  timestamp: number;
  caption?: string;
};

// Extended Photo type with additional metadata
export interface PhotoWithMetadata extends Photo {
  angle: number;
  level: 1 | 2 | 3 | 4;
  caption?: string;
}

// Dataset type with PhotoWithMetadata
export interface DatasetWithMetadata extends Dataset {
  photos: PhotoWithMetadata[];
  tags: string[];
  metadata: {
    totalPhotos: number;
    levels: { level: 1 | 2 | 3 | 4; captured: number }[];
    angles: number[];
    lastUpdated?: string;
  };
}

// Firebase Realtime Functions
export const uploadPhotoToFirebase = async (photo: Capture, datasetId: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(photo.dataUrl);
    const blob = await base64Response.blob();

    // Upload to Firebase Storage
    const photoRef = datasetStorageRef(datasetId, `${photo.timestamp}.jpg`);
    await uploadBytes(photoRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(photoRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
};

export const syncDatasetWithFirebase = async (dataset: Dataset) => {
  try {
    const docRef = doc(datasetsCol, dataset.id);

    // Create a copy of dataset with URLs instead of base64
    const datasetForFirebase = { ...dataset };

    // Upload each photo and get its URL
    const photoUploadPromises = dataset.photos.map((photo) => uploadPhotoToFirebase(photo, dataset.id));

    // Wait for all photos to upload
    const photoUrls = await Promise.all(photoUploadPromises);

    // Update dataset with photo URLs
    datasetForFirebase.photos = dataset.photos.map((photo, index) => ({
      ...photo,
      firebaseUrl: photoUrls[index],
    }));

    // Save/update dataset document in Firestore
    await setDoc(docRef, datasetForFirebase, { merge: true });

    return docRef;
  } catch (error) {
    console.error("Error syncing dataset:", error);
    throw error;
  }
};

export const listenToDatasetChanges = (datasetId: string, onUpdate: (dataset: Dataset) => void) => {
  const docRef = doc(datasetsCol, dataset.id);

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as Dataset;
      onUpdate(data);
    }
  });
};

export const updateDatasetMetadata = async (datasetId: string, metadata: Partial<Dataset["metadata"]>) => {
  try {
    const docRef = doc(datasetsCol, datasetId);
    await updateDoc(docRef, { metadata: metadata });
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw error;
  }
};
