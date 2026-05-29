'use client';

import { useState, useRef } from 'react';
import { payhereUrls } from '@/lib/payhere';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  User, CreditCard, IdentificationCard, CheckCircle,
  ArrowRight, ArrowLeft, Phone, Warning, Spinner,
  Certificate, Envelope, MapPin, Globe,
} from '@phosphor-icons/react';
import { useFirebase } from '@/firebase';
import type { CertificateRequest } from '@/types/certificate';

const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IN', name: 'India' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TH', name: 'Thailand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'OTHER', name: 'Other Country' },
];

const step1Schema = z.object({ nameOnCertificate: z.string().min(2, 'Name must be at least 2 characters').max(80) });
const step2Schema = z.object({
  type: z.enum(['digital', 'printed']),
  country: z.string().min(1, 'Please select your country'),
  shippingAddress: z.string().optional(),
});
type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface RequestFormProps {
  user: { uid: string; email: string | null; displayName: string | null };
  existingRequests: CertificateRequest[];
  onNameChange: (name: string) => void;
}

interface UploadedFile { url: string; name: string }

export function RequestForm({ user, existingRequests, onNameChange }: RequestFormProps) {
  const { storage } = useFirebase();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state across steps
  const [nameData, setNameData] = useState<Step1Data>({ nameOnCertificate: '' });
  const [typeData, setTypeData] = useState<Step2Data>({ type: 'digital', country: 'LK' });
  const [identityType, setIdentityType] = useState<'nic' | 'passport'>('nic');
  const [frontFile, setFrontFile] = useState<UploadedFile | null>(null);
  const [backFile, setBackFile] = useState<UploadedFile | null>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: nameData });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: typeData });

  const certType = form2.watch('type');
  const country = form2.watch('country');
  const isNonSriLanka = country !== 'LK' && certType === 'printed';

  const price = certType === 'digital' ? 1500 : 3500;

  async function uploadFile(file: File, path: string): Promise<string> {
    if (!storage) throw new Error('Storage not initialized');
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    return getDownloadURL(sRef);
  }

  async function handleFileUpload(
    file: File,
    side: 'front' | 'back',
    setSetter: (f: UploadedFile | null) => void,
    setLoading: (b: boolean) => void
  ) {
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `identity-docs/${user.uid}/${Date.now()}_${side}.${ext}`;
      const url = await uploadFile(file, path);
      setSetter({ url, name: file.name });
      toast({ title: 'Upload successful', description: `${side === 'front' ? 'Front' : 'Back'} image uploaded.` });
    } catch {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleStep1(data: Step1Data) {
    setNameData(data);
    onNameChange(data.nameOnCertificate);
    setStep(2);
  }

  async function handleStep2(data: Step2Data) {
    setTypeData(data);
    setStep(3);
  }

  function handleStep3Next() {
    if (!frontFile) {
      toast({ title: 'Upload required', description: `Please upload the ${identityType === 'nic' ? 'front side of NIC' : 'passport photo'}.`, variant: 'destructive' });
      return;
    }
    if (identityType === 'nic' && !backFile) {
      toast({ title: 'Upload required', description: 'Please upload the back side of NIC.', variant: 'destructive' });
      return;
    }
    setStep(4);
  }

  async function handleSubmitAndPay() {
    setSubmitting(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const token = await currentUser.getIdToken();

      // Create certificate request
      const res = await fetch('/api/certificates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nameOnCertificate: nameData.nameOnCertificate,
          type: typeData.type,
          identityType,
          identityFrontUrl: frontFile!.url,
          identityBackUrl: backFile?.url,
          country: typeData.country,
          shippingAddress: typeData.shippingAddress,
        }),
      });

      const { requestId, error: reqError } = await res.json();
      if (!res.ok) throw new Error(reqError || 'Failed to create request');

      // Get PayHere payment params
      const payRes = await fetch('/api/certificates/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId }),
      });

      const { params, error: payError } = await payRes.json();
      if (!payRes.ok) throw new Error(payError || 'Failed to initialize payment');

      // Submit form to PayHere
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payhereUrls.checkout;

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setSubmitting(false);
    }
  }

  // Show existing requests if any
  const pendingVerification = existingRequests.filter(r => r.status === 'pending_verification');
  const approved = existingRequests.filter(r => r.status === 'approved');

  return (
    <div className="space-y-4">
      {/* Existing approved requests */}
      {approved.length > 0 && (
        <div className="rounded-xl border-2 border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">Certificate Issued</span>
          </div>
          <p className="text-xs text-muted-foreground">Your certificate has been approved and emailed to <strong>{user.email}</strong>. Check your inbox (including spam).</p>
        </div>
      )}

      {/* Pending verification */}
      {pendingVerification.length > 0 && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Warning weight="fill" className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Request Under Review</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your request is being verified by our team. You will receive an email once approved.
          </p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
              s < step ? 'bg-green-500 text-white' : s === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <CheckCircle weight="fill" className="h-3.5 w-3.5" /> : s}
            </div>
            {s < 4 && <div className={`flex-1 h-0.5 w-8 rounded ${s < step ? 'bg-green-500' : 'bg-muted'}`} />}
          </div>
        ))}
        <span className="text-[11px] text-muted-foreground ml-1 font-medium">
          {['Your Name', 'Certificate Type', 'Identity Docs', 'Review & Pay'][step - 1]}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Name ──────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
              <div className="rounded-xl border-2 border-border/50 bg-card/40 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User weight="bold" className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Name on Certificate</p>
                    <p className="text-[11px] text-muted-foreground">Exactly as it should appear — double-check spelling</p>
                  </div>
                </div>
                <Input
                  {...form1.register('nameOnCertificate')}
                  placeholder="e.g. Kavindu Ashan Perera"
                  className="h-11 font-medium text-base"
                  onChange={e => {
                    form1.setValue('nameOnCertificate', e.target.value);
                    onNameChange(e.target.value);
                  }}
                />
                {form1.formState.errors.nameOnCertificate && (
                  <p className="text-xs text-destructive">{form1.formState.errors.nameOnCertificate.message}</p>
                )}
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Warning weight="fill" className="h-3 w-3 shrink-0" />
                  This name cannot be changed after submission. Verify carefully.
                </p>
              </div>
              <Button type="submit" className="w-full h-11 font-bold rounded-xl">
                Continue <ArrowRight weight="bold" className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}

        {/* ─── Step 2: Type + Country ────────────────────────────── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
              {/* Type selector */}
              <div className="rounded-xl border-2 border-border/50 bg-card/40 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Certificate weight="bold" className="h-4 w-4 text-violet-500" />
                  </div>
                  <p className="text-sm font-black">Certificate Type</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'digital', label: 'Digital PDF', price: 'LKR 1,500', desc: 'Emailed to you instantly after approval', icon: Envelope },
                    { value: 'printed', label: 'Printed & Signed', price: 'LKR 3,500', desc: 'Physically posted to Sri Lanka addresses', icon: MapPin },
                  ] as const).map(opt => {
                    const Icon = opt.icon;
                    const selected = certType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => form2.setValue('type', opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`}
                      >
                        <Icon weight="bold" className={`h-5 w-5 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="font-black text-sm">{opt.label}</p>
                        <p className={`text-base font-black mt-0.5 ${selected ? 'text-primary' : 'text-foreground'}`}>{opt.price}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Country selector */}
              <div className="rounded-xl border-2 border-border/50 bg-card/40 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe weight="bold" className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-black">Your Country</p>
                </div>
                <select
                  {...form2.register('country')}
                  className="w-full h-11 rounded-xl border-2 border-border/50 bg-background px-3 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>

                {/* Non-Sri Lanka printed certificate warning */}
                {isNonSriLanka && (
                  <div className="rounded-xl border-2 border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Warning weight="fill" className="h-4 w-4 text-orange-500 shrink-0" />
                      <p className="text-sm font-black text-orange-700 dark:text-orange-400">International Shipping — Contact Required</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Printed certificates are posted to Sri Lanka addresses only. For international delivery, please contact our administration team to discuss shipping options and pricing.
                    </p>
                    <a
                      href="tel:0774533233"
                      className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors"
                    >
                      <Phone weight="fill" className="h-4 w-4" />
                      Call Administration — 077 453 3233
                    </a>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Or choose <strong>Digital PDF</strong> above to receive your documents via email.
                    </p>
                  </div>
                )}

                {/* Sri Lanka shipping address */}
                {certType === 'printed' && country === 'LK' && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground">Shipping Address (Sri Lanka)</p>
                    <Input
                      {...form2.register('shippingAddress')}
                      placeholder="Full address for postal delivery..."
                      className="h-11"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setStep(1)}>
                  <ArrowLeft weight="bold" className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={isNonSriLanka}
                  className="flex-1 h-11 rounded-xl font-bold"
                >
                  Continue <ArrowRight weight="bold" className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ─── Step 3: Identity Upload ───────────────────────────── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-border/50 bg-card/40 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <IdentificationCard weight="bold" className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Identity Verification</p>
                    <p className="text-[11px] text-muted-foreground">Required to issue your certificate</p>
                  </div>
                </div>

                {/* NIC / Passport toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {(['nic', 'passport'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setIdentityType(type); setFrontFile(null); setBackFile(null); }}
                      className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${identityType === type ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-border/50 text-muted-foreground'}`}
                    >
                      {type === 'nic' ? 'NIC (Both Sides)' : 'Passport (Photo Page)'}
                    </button>
                  ))}
                </div>

                {/* Front upload */}
                <div className="space-y-2">
                  <p className="text-xs font-bold">
                    {identityType === 'nic' ? 'NIC — Front Side' : 'Passport — Clear Photo Page'}
                  </p>
                  <input
                    ref={frontInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'front', setFrontFile, setUploadingFront); }}
                  />
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    disabled={uploadingFront}
                    className={`w-full h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${frontFile ? 'border-green-500 bg-green-500/5 text-green-600' : 'border-border/50 hover:border-border text-muted-foreground'}`}
                  >
                    {uploadingFront ? <Spinner weight="bold" className="h-5 w-5 animate-spin" /> : frontFile ? (
                      <><CheckCircle weight="fill" className="h-5 w-5 text-green-500" />{frontFile.name}</>
                    ) : (
                      <><IdentificationCard weight="bold" className="h-5 w-5" />Click to upload image</>
                    )}
                  </button>
                </div>

                {/* Back upload (NIC only) */}
                {identityType === 'nic' && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold">NIC — Back Side</p>
                    <input
                      ref={backInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'back', setBackFile, setUploadingBack); }}
                    />
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      disabled={uploadingBack}
                      className={`w-full h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${backFile ? 'border-green-500 bg-green-500/5 text-green-600' : 'border-border/50 hover:border-border text-muted-foreground'}`}
                    >
                      {uploadingBack ? <Spinner weight="bold" className="h-5 w-5 animate-spin" /> : backFile ? (
                        <><CheckCircle weight="fill" className="h-5 w-5 text-green-500" />{backFile.name}</>
                      ) : (
                        <><IdentificationCard weight="bold" className="h-5 w-5" />Click to upload back side</>
                      )}
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">Images are securely stored and only used for identity verification. They will not be shared.</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setStep(2)}>
                  <ArrowLeft weight="bold" className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="button" className="flex-1 h-11 rounded-xl font-bold" onClick={handleStep3Next}>
                  Continue <ArrowRight weight="bold" className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Step 4: Review & Pay ──────────────────────────────── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-border/50 bg-card/40 p-5 space-y-3">
                <p className="text-sm font-black flex items-center gap-2">
                  <CheckCircle weight="fill" className="h-4 w-4 text-green-500" /> Review Your Request
                </p>
                {[
                  ['Name on Certificate', nameData.nameOnCertificate],
                  ['Certificate Type', typeData.type === 'digital' ? 'Digital PDF' : 'Printed & Signed'],
                  ['Country', COUNTRIES.find(c => c.code === typeData.country)?.name || typeData.country],
                  ['Identity', identityType === 'nic' ? 'NIC (both sides)' : 'Passport'],
                  ['Email (delivery)', user.email || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
                {typeData.shippingAddress && (
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-muted-foreground">Ship to</span>
                    <span className="font-bold text-right max-w-[200px]">{typeData.shippingAddress}</span>
                  </div>
                )}
              </div>

              {/* Price box */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Amount to Pay</p>
                  <p className="text-2xl font-black text-primary">LKR {price.toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-primary/40">
                  <CreditCard weight="bold" className="mr-1.5 h-3 w-3" /> PayHere · Secure
                </Badge>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  <Warning weight="fill" className="inline h-3 w-3 mr-1" />
                  After payment, our team will verify your identity document (1–3 business days).
                  Once verified, your certificate will be emailed to <strong>{user.email}</strong>.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setStep(3)}>
                  <ArrowLeft weight="bold" className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-11 rounded-xl font-bold bg-primary"
                  disabled={submitting}
                  onClick={handleSubmitAndPay}
                >
                  {submitting ? <Spinner weight="bold" className="h-4 w-4 animate-spin mr-2" /> : <CreditCard weight="bold" className="mr-2 h-4 w-4" />}
                  Pay LKR {price.toLocaleString()}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
