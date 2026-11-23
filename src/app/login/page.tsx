
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { useAuth, useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_EMAILS = ["admin@smartlabs.com", "thimira.vishwa2003@gmail.com"];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const { firestore } = useFirebase();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleAuthSuccess = async (user: User) => {
    if (!firestore) {
      handleAuthError(new Error("Firestore is not initialized."));
      return;
    }
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      let userRole = 'user';
      let hasCompletedOnboarding = false;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role || 'user';
        hasCompletedOnboarding = userData.hasCompletedOnboarding || false;

        // Always enforce the correct role for known admin/developer emails on
        // every login — this corrects any account whose role was set wrong or
        // was created before the developer role existed.
        const userEmail = user.email || '';
        if (ADMIN_EMAILS.includes(userEmail)) {
          const correctRole = userEmail === "thimira.vishwa2003@gmail.com" ? 'developer' : 'admin';
          userRole = correctRole; // use correct role for redirect logic below
          await updateDoc(userRef, { role: correctRole, lastLogin: serverTimestamp() });
        } else {
          await updateDoc(userRef, { lastLogin: serverTimestamp() });
        }

      } else {
        const userEmail = user.email || '';
        if (ADMIN_EMAILS.includes(userEmail)) {
          userRole = userEmail === "thimira.vishwa2003@gmail.com" ? 'developer' : 'admin';
          hasCompletedOnboarding = true;
        }
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: userRole,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          hasCompletedOnboarding: hasCompletedOnboarding,
        });
      }

      setIsLoading(false);
      toast({
        title: 'Login Successful!',
        description: `Welcome back, ${user.displayName || user.email}!`,
      });

      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectPath = searchParams?.get('redirect');

      if (redirectPath) {
        router.push(redirectPath);
      } else if (userRole === 'admin' || userRole === 'developer') {
        router.push('/admin/dashboard');
      } else {
        // /welcome is the public review landing page, not account onboarding.
        router.push('/dashboard');
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleAuthError = (error: any) => {
    setIsLoading(false);
    console.error("Login Error:", error);

    let description = 'An unexpected error occurred.';
    const invalidCredentialCodes = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'];

    if (invalidCredentialCodes.includes(error.code)) {
      description = 'Invalid email or password. Please try again.';
      // Also show it under the password field, as in the design.
      form.setError('password', { message: 'Incorrect email or password' });
    }

    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: description,
    });
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleAuthSuccess(userCredential.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const { errors } = form.formState;
  return (
    <div className="sl-login">
      <div className="frame">
        <aside className="side" aria-hidden="true">
          <Link href="/" className="brand" tabIndex={-1}><Image src="/logo.png" alt="" width={140} height={78} priority /></Link>
          <h2>Your PTE journey<br />starts <em>here.</em></h2>
          <p>Practise smarter. Score higher. Achieve your goals.</p>
        </aside>

        <main className="card">
          <Link href="/" className="brand"><Image src="/logo.png" alt="Smart Labs home" width={170} height={95} /></Link>
          <h1>Welcome <em>back</em></h1>
          <p className="lead">Log in to continue your practice</p>

          <button type="button" className="google" onClick={handleGoogleSignIn} disabled={isLoading}>
            <Image src="/google-logo.svg" alt="" width={20} height={20} />
            Continue with Google
          </button>
          <div className="or">or</div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="stack" noValidate>
            <div>
              <label className={`field${errors.email ? ' err' : ''}`}>
                <Mail aria-hidden="true" />
                <input type="email" autoComplete="email" placeholder="Email address" aria-label="Email address" aria-invalid={!!errors.email} {...form.register('email')} />
              </label>
              {errors.email && <p className="msg" role="alert">{errors.email.message}</p>}
            </div>
            <div>
              <label className={`field${errors.password ? ' err' : ''}`}>
                <Lock aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" aria-label="Password" aria-invalid={!!errors.password} {...form.register('password')} />
                <button type="button" className="eye" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </label>
              {errors.password && <p className="msg" role="alert">{errors.password.message}</p>}
            </div>
            <Link href="/forgot-password" className="forgot">Forgot password?</Link>
            <button type="submit" className="submit" disabled={isLoading}>{isLoading ? 'Logging in…' : 'Log in'}</button>
          </form>

          <p className="foot">New to Smart Labs? <Link href="/signup">Create an account</Link></p>
          <Link href="/" className="home">← Back to home</Link>
        </main>
      </div>
    </div>
  );
}
