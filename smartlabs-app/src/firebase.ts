import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/config';

/**
 * Firebase JS SDK initialised for React Native. `initializeAuth` with
 * AsyncStorage persistence keeps the user signed in across app restarts (the
 * default in-memory persistence would log them out every launch).
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Fast-refresh may re-run this file after auth is already initialised.
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
