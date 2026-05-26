'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Certificate, CheckCircle, ArrowLeft } from '@phosphor-icons/react';
import { RequestForm } from '@/components/certificates/RequestForm';
import { CertificatePreview } from '@/components/certificates/CertificatePreview';
import type { CertificateRequest } from '@/types/certificate';
import Link from 'next/link';

export default function CertificateRequestPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userRole, setUserRole] = useState('');
  const [existingRequests, setExistingRequests] = useState<CertificateRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [previewName, setPreviewName] = useState('');

  // Handle PayHere return
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast({ title: 'Payment received!', description: 'Your certificate request is now under review. You will receive an email once verified.' });
    } else if (status === 'cancelled') {
      toast({ title: 'Payment cancelled', description: 'Your request was not submitted. You can try again.', variant: 'destructive' });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    } else if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(snap => {
        if (snap.exists()) {
          setUserRole(snap.data().role || 'user');
        }
      });
    }
  }, [user, isUserLoading, router, firestore]);

  useEffect(() => {
    if (!user) return;
    async function fetchRequests() {
      setLoadingRequests(true);
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        // Fetch from Firestore client-side via API
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/certificates/my-requests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setExistingRequests(data.requests || []);
        }
      } catch {
        // silently ignore
      } finally {
        setLoadingRequests(false);
      }
    }
    fetchRequests();
  }, [user]);

  const isLoading = isUserLoading || !userRole;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1B35] via-[#132240] to-[#0D1B35] border border-white/10 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/50 text-xs font-medium mb-4 hover:text-white/70 transition-colors">
              <ArrowLeft weight="bold" className="h-3 w-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Certificate weight="fill" className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Request Certificate</h1>
                <p className="text-white/50 text-xs font-medium mt-0.5">PTE Academic Training · Smart Labs LK</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">
              Receive an official certificate and completion letter signed by{' '}
              <span className="text-amber-300 font-semibold">Lahiruka Weeraratne</span>,
              Lecturer at Smart Labs LK.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 text-white/70 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <CheckCircle weight="fill" className="h-4 w-4 text-green-400 shrink-0" />
              <span>Digital PDF — <strong className="text-white">LKR 1,500</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <CheckCircle weight="fill" className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Printed & Signed — <strong className="text-white">LKR 3,500</strong></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border-2 border-border/50 bg-card/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base">Your Request</h2>
            <Badge variant="outline" className="text-[10px] font-bold">Secure · PayHere</Badge>
          </div>

          {loadingRequests ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : (
            <RequestForm
              user={{ uid: user!.uid, email: user!.email, displayName: user!.displayName }}
              existingRequests={existingRequests}
              onNameChange={setPreviewName}
            />
          )}
        </motion.div>

        {/* Right: Preview */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-amber-500/20 bg-card/40 p-5 space-y-4 lg:sticky lg:top-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base flex items-center gap-2">
              <Certificate weight="duotone" className="h-4 w-4 text-amber-500" />
              Document Preview
            </h2>
            <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
              Sample Only
            </Badge>
          </div>
          <CertificatePreview
            studentName={previewName}
            userEmail={user?.email || ''}
          />
        </motion.div>
      </div>
    </div>
  );
}
