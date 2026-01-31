
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn } from 'lucide-react';
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
        
        await updateDoc(userRef, { lastLogin: serverTimestamp() });

      } else {
        const userEmail = user.email || '';
        if (ADMIN_EMAILS.includes(userEmail)) {
            userRole = userEmail === "thimira.vishwa2003@gmail.com" ? 'developer' : 'admin';
            hasCompletedOnboarding = true; // Admins skip onboarding
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

      if (userRole === 'admin' || userRole === 'developer') {
        router.push('/admin/dashboard');
      } else if (hasCompletedOnboarding) {
        router.push('/dashboard');
      } else {
        router.push('/welcome');
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

  return (
    <div className="w-full">
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center items-center">
              <Image src="/logo.png" alt="Smart Labs Logo" width={64} height={64} className="mb-4" />
              <CardTitle className="font-headline text-3xl">Login</CardTitle>
              <CardDescription>Access your student dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                         <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </Form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={isLoading}>
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />
                Sign in with Google
              </Button>
               <div className="mt-6 text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Don't have an account?{' '}
                  <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
                <Link href="/" className="hover:underline hover:text-primary">
                  <ArrowLeft className="inline-block mr-1 h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
