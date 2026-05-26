'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle, XCircle, Eye, Spinner, Certificate, Envelope,
  Image, ArrowSquareOut, MagnifyingGlass, Warning, PaperPlaneTilt,
  Plus,
} from '@phosphor-icons/react';
import type { CertificateRequest } from '@/types/certificate';

type FilterStatus = 'all' | 'pending_verification' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  pending_verification: { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

interface AdminCertificateTableProps {
  requests: CertificateRequest[];
  onRefresh: () => void;
}

interface QuickGenerateData { name: string; email: string; type: 'digital' | 'printed' }

export function AdminCertificateTable({ requests, onRefresh }: AdminCertificateTableProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [quickGen, setQuickGen] = useState(false);
  const [qgData, setQgData] = useState<QuickGenerateData>({ name: '', email: '', type: 'digital' });
  const [qgLoading, setQgLoading] = useState(false);

  async function getToken() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  }

  async function handleApprove(requestId: string) {
    setLoadingId(requestId);
    try {
      const token = await getToken();
      const res = await fetch('/api/certificates/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Certificate sent!', description: `Certificate emailed successfully. No: ${data.certificateNumber}` });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(requestId: string) {
    if (!rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please enter a rejection reason.', variant: 'destructive' });
      return;
    }
    setLoadingId(requestId);
    try {
      const token = await getToken();
      const res = await fetch('/api/certificates/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Request rejected', description: 'Student has been notified.' });
      setRejectId(null);
      setRejectReason('');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleQuickGenerate() {
    if (!qgData.name || !qgData.email) {
      toast({ title: 'Required', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    setQgLoading(true);
    try {
      const token = await getToken();
      // Create a direct request and approve it in one step
      const reqRes = await fetch('/api/certificates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nameOnCertificate: qgData.name,
          type: qgData.type,
          identityType: 'passport',
          identityFrontUrl: 'admin-generated',
          country: 'LK',
          adminGenerated: true,
        }),
      });
      const { requestId, error: reqErr } = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqErr);

      const appRes = await fetch('/api/certificates/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, overrideName: qgData.name }),
      });
      const appData = await appRes.json();
      if (!appRes.ok) throw new Error(appData.error);

      toast({ title: 'Certificate generated!', description: `Certificate No: ${appData.certificateNumber}. Email sent to ${qgData.email}` });
      setQuickGen(false);
      setQgData({ name: '', email: '', type: 'digital' });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setQgLoading(false);
    }
  }

  const filtered = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = !search || r.nameOnCertificate.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: requests.length,
    pending_verification: requests.filter(r => r.status === 'pending_verification').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <Button onClick={() => setQuickGen(true)} size="sm" className="rounded-xl font-bold gap-2">
          <Plus weight="bold" className="h-4 w-4" /> Quick Generate
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending_verification', 'approved', 'rejected'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-border'}`}
          >
            {f === 'all' ? 'All' : f === 'pending_verification' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Certificate weight="duotone" className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending_payment;
            const isLoading = loadingId === req.id;
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border-2 border-border/50 bg-card/40 p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-base">{req.nameOnCertificate}</p>
                      <Badge className={`text-[10px] font-bold border ${cfg.color}`}>{cfg.label}</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {req.type === 'digital' ? 'Digital' : 'Printed'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Envelope weight="bold" className="h-3 w-3" /> {req.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Country: <strong>{req.country}</strong> · ID: {req.identityType.toUpperCase()} · LKR {req.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">Ref: {req.id}</p>
                  </div>

                  {/* Actions */}
                  {req.status === 'pending_verification' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-bold gap-1.5"
                        onClick={() => setViewImageUrl(req.identityFrontUrl)}
                      >
                        <Image weight="bold" className="h-3 w-3" /> View ID
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl text-xs font-bold gap-1.5 bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                        onClick={() => handleApprove(req.id!)}
                      >
                        {isLoading ? <Spinner weight="bold" className="h-3 w-3 animate-spin" /> : <CheckCircle weight="bold" className="h-3 w-3" />}
                        Approve & Send
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-bold gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10"
                        onClick={() => { setRejectId(req.id!); setRejectReason(''); }}
                      >
                        <XCircle weight="bold" className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}

                  {req.status === 'approved' && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs font-bold gap-1 border">
                      <PaperPlaneTilt weight="fill" className="h-3 w-3" /> Certificate Sent
                    </Badge>
                  )}
                </div>

                {/* Reject form inline */}
                {rejectId === req.id && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <p className="text-xs font-bold text-red-600">Rejection Reason</p>
                    <Input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. Identity document is unclear, please resubmit..."
                      className="h-9 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setRejectId(null)}>Cancel</Button>
                      <Button
                        size="sm"
                        className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                        onClick={() => handleReject(req.id!)}
                      >
                        {isLoading ? <Spinner className="h-3 w-3 animate-spin" /> : 'Send Rejection'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Admin notes */}
                {req.adminNotes && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Warning weight="fill" className="h-3 w-3 shrink-0" /> {req.adminNotes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Image viewer modal */}
      <AnimatePresence>
        {viewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setViewImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl p-4 max-w-lg w-full space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="font-black text-sm flex items-center gap-2"><Eye weight="bold" className="h-4 w-4" /> Identity Document</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" asChild>
                    <a href={viewImageUrl} target="_blank" rel="noopener noreferrer">
                      <ArrowSquareOut weight="bold" className="h-3 w-3" /> Open Full
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={() => setViewImageUrl(null)}>Close</Button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewImageUrl} alt="Identity document" className="w-full rounded-xl max-h-96 object-contain bg-muted" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Generate modal */}
      <AnimatePresence>
        {quickGen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setQuickGen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 max-w-md w-full space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Certificate weight="bold" className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-black text-base">Quick Generate Certificate</p>
                  <p className="text-xs text-muted-foreground">For admin/developer use — bypasses payment</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold">Student Full Name</p>
                  <Input value={qgData.name} onChange={e => setQgData(p => ({ ...p, name: e.target.value }))} placeholder="Name to appear on certificate" className="h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold">Student Email</p>
                  <Input type="email" value={qgData.email} onChange={e => setQgData(p => ({ ...p, email: e.target.value }))} placeholder="Certificate will be emailed here" className="h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold">Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['digital', 'printed'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQgData(p => ({ ...p, type: t }))}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${qgData.type === t ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-muted-foreground'}`}
                      >
                        {t === 'digital' ? 'Digital PDF' : 'Printed'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setQuickGen(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl font-bold" disabled={qgLoading} onClick={handleQuickGenerate}>
                  {qgLoading ? <Spinner weight="bold" className="h-4 w-4 animate-spin mr-2" /> : <PaperPlaneTilt weight="bold" className="h-4 w-4 mr-2" />}
                  Generate & Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
