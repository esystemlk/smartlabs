import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, type Auth, type Persistence } from 'firebase/auth';
// `getReactNativePersistence` ships in firebase 10's RN build but is missing
// from the published type defs, so pull it off the namespace with a cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/config';

const getReactNativePersistence = (firebaseAuth as unknown as {
  getReactNativePersistence: (storage: unknown) => Persistence;
}).getReactNativePersistence;

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
