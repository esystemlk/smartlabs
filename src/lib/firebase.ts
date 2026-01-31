
// This file is retained for legacy compatibility but is no longer the primary
// entry point for Firebase services. Please use the provider and hooks
// from '@//firebase' for all new development.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "smart-labs-ekk8j",
  "appId": "1:43848204138:web:1aafd9e847ef780b60ef13",
  "storageBucket": "smart-labs-ekk8j.firebasestorage.app",
  "apiKey": "AIzaSyCOwWJwPln4v4ihUBu-3L5QRj34UR-ext0",
  "authDomain": "smart-labs-ekk8j.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "43848204138"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
