'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Certificate, ArrowLeft, ArrowsClockwise, CheckCircle, Clock, XCircle } from '@phosphor-icons/react';
import { AdminCertificateTable } from '@/components/certificates/AdminCertificateTable';
import type { CertificateRequest } from '@/types/certificate';
import Link from 'next/link';

export default function AdminCertificatesPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    } else if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(snap => {
        if (snap.exists()) {
          const role = snap.data().role;
          if (role === 'admin' || role === 'developer' || role === 'teacher') {
            setIsAdmin(true);
          } else {
            router.push('/dashboard');
          }
        }
      });
    }
  }, [user, isUserLoading, router, firestore]);

  const fetchRequests = useCallback(async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/admin/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin, fetchRequests]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests();
  }

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm font-medium">Verifying access...</p>
      </div>
    );
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending_verification').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-4 hover:text-foreground transition-colors">
              <ArrowLeft weight="bold" className="h-3 w-3" /> Admin Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Certificate weight="fill" className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black">Certificate Requests</h1>
                  <p className="text-sm text-muted-foreground">Manage PTE completion certificate requests</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2" onClick={handleRefresh} disabled={refreshing}>
                <ArrowsClockwise weight="bold" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Requests', value: stats.total, icon: Certificate, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
              { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
              { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/5', border: 'border-green-500/20' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`rounded-xl border-2 ${stat.border} ${stat.bg} p-4 flex items-center justify-between`}>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-black mt-0.5">{stat.value}</p>
                  </div>
                  <Icon weight="bold" className={`h-7 w-7 ${stat.color} opacity-60`} />
                </div>
              );
            })}
          </motion.div>

          {/* Requests table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border-2 border-border/50 bg-card/40 p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-base">All Requests</h2>
              {stats.pending > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold">
                  {stats.pending} need{stats.pending === 1 ? 's' : ''} review
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : (
              <AdminCertificateTable requests={requests} onRefresh={handleRefresh} />
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
