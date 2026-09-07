import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface AuthState {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Web: opens the Google popup and signs in. Native: use the Google id token. */
  signInWithGoogleWeb: () => Promise<void>;
  /** Native: finish Google sign-in with an id token from expo-auth-session. */
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    // Create the users/{uid} document the backend expects. Merge so we never
    // clobber an existing web account that signs up again.
    const ref = doc(db, 'users', cred.user.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      // Mirror the website's users/{uid} shape so accounts are interchangeable.
      await setDoc(
        ref,
        {
          uid: cred.user.uid,
          email: email.trim(),
          displayName: name.trim(),
          photoURL: cred.user.photoURL ?? null,
          role: 'student',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          hasCompletedOnboarding: false,
          source: 'mobile-app',
        },
        { merge: true },
      );
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  /** Ensure a signed-in Google user has the users/{uid} doc the backend expects. */
  const ensureUserDoc = async (cred: UserCredential) => {
    const u = cred.user;
    const ref = doc(db, 'users', u.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(
        ref,
        {
          uid: u.uid,
          email: u.email ?? '',
          displayName: u.displayName ?? 'Student',
          photoURL: u.photoURL ?? null,
          role: 'student',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          hasCompletedOnboarding: false,
          source: 'mobile-app',
        },
        { merge: true },
      );
    }
  };

  const signInWithGoogleWeb = async () => {
    if (Platform.OS !== 'web') throw new Error('Use the native Google flow.');
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureUserDoc(cred);
  };

  const signInWithGoogleIdToken = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
    await ensureUserDoc(cred);
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, signIn, signUp, resetPassword, signOut, signInWithGoogleWeb, signInWithGoogleIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
