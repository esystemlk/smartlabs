
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User,
} from 'firebase/auth';
import { useAuth, useFirebase } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { incrementStudentCount } from '@/lib/services/stats.service';
import { logUserActivity } from '@/lib/services/activity.service';
import { RegisterSuccess } from '@/components/auth/RegisterSuccess';

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const ADMIN_EMAILS = ["admin@smartlabs.com", "thimira.vishwa2003@gmail.com"];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const { firestore } = useFirebase();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  // Right after an account is created, Firestore can still be using the signed-out session for a
  // moment, so the first profile read/write is refused ("insufficient permissions"). Retry briefly.
  const withAuthRetry = async <T,>(fn: () => Promise<T>): Promise<T> => {
    for (let i = 0; ; i++) {
      try { return await fn(); }
      catch (e: any) {
        if (e?.code !== 'permission-denied' || i >= 4) throw e;
        await new Promise(r => setTimeout(r, 400 * (i + 1)));
      }
    }
  };

  const handleAuthSuccess = async (user: User, displayNameFromForm?: string) => {
    if (!firestore) {
      handleAuthError(new Error("Firestore is not initialized."));
      return;
    }
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await user.getIdToken();
      const userDoc = await withAuthRetry(() => getDoc(userRef));

      const finalDisplayName = displayNameFromForm || user.displayName;

      if (!userDoc.exists()) {
        const userEmail = user.email || '';
        let userRole = 'user';
        let hasCompletedOnboarding = false;
        if (ADMIN_EMAILS.includes(userEmail)) {
          userRole = userEmail === "thimira.vishwa2003@gmail.com" ? 'developer' : 'admin';
          hasCompletedOnboarding = true; // Admins skip onboarding
        }
        await withAuthRetry(() => setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: finalDisplayName,
          photoURL: user.photoURL,
          role: userRole,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          hasCompletedOnboarding: hasCompletedOnboarding,
        }));

        // Increment global student count
        await incrementStudentCount();

        // Log signup activity
        await logUserActivity(
          user.uid,
          'enrollment',
          'Account Created',
          'Welcome to Smart Labs!',
          { role: userRole }
        );

        // Best-effort partner referral attribution (from the /r/{code} cookie).
        // Never blocks or fails signup.
        try {
          const refCode = document.cookie.match(/(?:^|;\s*)ref_code=([^;]+)/)?.[1];
          if (refCode) {
            const token = await user.getIdToken();
            await fetch('/api/partners/attribute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ code: decodeURIComponent(refCode), studentName: finalDisplayName || '', studentContact: user.email || '' }),
            });
            document.cookie = 'ref_code=; Max-Age=0; path=/';
          }
        } catch { /* attribution is best-effort */ }

        setIsLoading(false);

        // Show the success animation (~3s), then redirect.
        const target = (userRole === 'admin' || userRole === 'developer')
          ? '/admin/dashboard'
          : '/dashboard';
        setShowSuccess(true);
        setTimeout(() => router.push(target), 3200);
      } else {
        // User already exists — enforce correct role for admin/developer emails,
        // then redirect as normal.
        const userData = userDoc.data();
        const userEmail = user.email || '';
        let existingRole: string = userData.role || 'user';

        if (ADMIN_EMAILS.includes(userEmail)) {
          const correctRole = userEmail === "thimira.vishwa2003@gmail.com" ? 'developer' : 'admin';
          existingRole = correctRole;
          await updateDoc(userRef, { role: correctRole, lastLogin: serverTimestamp() });
        }

        setIsLoading(false);
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${finalDisplayName || user.email}!`,
        });

        if (existingRole === 'admin' || existingRole === 'developer') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleAuthError = (error: any) => {
    setIsLoading(false);
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: error.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please login instead.'
        : error.message || 'There was a problem with your request.',
    });
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });
      await handleAuthSuccess(userCredential.user, data.displayName);
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
      {showSuccess && <RegisterSuccess />}
      <div className="frame">
        <aside className="side" aria-hidden="true">
          <Link href="/" className="brand" tabIndex={-1}><Image src="/logo.png" alt="" width={140} height={78} priority /></Link>
          <h2>Start your PTE<br />journey <em>today.</em></h2>
          <p>Free account. AI-scored practice, mock tests and your results in one place.</p>
        </aside>

        <main className="card">
          <Link href="/" className="brand"><Image src="/logo.png" alt="Smart Labs home" width={170} height={95} /></Link>
          <h1>Create your <em>account</em></h1>
          <p className="lead">Join Smart Labs to start practising</p>

          <button type="button" className="google" onClick={handleGoogleSignIn} disabled={isLoading}>
            <Image src="/google-logo.svg" alt="" width={20} height={20} />
            Continue with Google
          </button>
          <div className="or">or</div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="stack" noValidate>
            <div>
              <label className={`field${errors.displayName ? ' err' : ''}`}>
                <UserRound aria-hidden="true" />
                <input autoComplete="name" placeholder="Full name" aria-label="Full name" aria-invalid={!!errors.displayName} {...form.register('displayName')} />
              </label>
              {errors.displayName && <p className="msg" role="alert">{errors.displayName.message}</p>}
            </div>
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
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Password (at least 6 characters)" aria-label="Password" aria-invalid={!!errors.password} {...form.register('password')} />
                <button type="button" className="eye" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </label>
              {errors.password && <p className="msg" role="alert">{errors.password.message}</p>}
            </div>
            <button type="submit" className="submit" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</button>
          </form>

          <p className="foot">Already have an account? <Link href="/login">Log in</Link></p>
          <Link href="/guide" className="home">New here? Read the website guide</Link>
          <Link href="/" className="home">← Back to home</Link>
        </main>
      </div>
    </div>
  );
}
