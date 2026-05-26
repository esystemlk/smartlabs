'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeSlash, Certificate, FileText } from '@phosphor-icons/react';

interface CertificatePreviewProps {
  studentName: string;
  userEmail: string;
  tab?: 'certificate' | 'letter';
}

function CertPreview({ studentName, userEmail }: { studentName: string; userEmail: string }) {
  const displayName = studentName.trim() || 'Your Full Name';
  const certNo = 'SL-PTE-2026-SAMPLE';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div
      style={{
        background: '#0D1B35',
        padding: '32px',
        borderRadius: '4px',
        position: 'relative',
        fontFamily: 'Georgia, serif',
        aspectRatio: '1.414 / 1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Outer border */}
      <div style={{ position: 'absolute', inset: '12px', border: '2.5px solid #C9A84C', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '18px', border: '0.5px solid rgba(201,168,76,0.4)', pointerEvents: 'none' }} />

      {/* Corner ornaments */}
      {[
        { top: 8, left: 8 },
        { top: 8, right: 8 },
        { bottom: 8, left: 8 },
        { bottom: 8, right: 8 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', width: 20, height: 20,
          borderColor: '#F5D978', borderStyle: 'solid',
          borderTopWidth: i < 2 ? 3 : 0, borderBottomWidth: i >= 2 ? 3 : 0,
          borderLeftWidth: i % 2 === 0 ? 3 : 0, borderRightWidth: i % 2 === 1 ? 3 : 0,
          ...pos,
        }} />
      ))}

      {/* Content */}
      <div style={{ textAlign: 'center', zIndex: 1, padding: '0 24px', width: '100%' }}>
        <p style={{ color: '#C9A84C', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
          Smart Labs LK — Est. 2020
        </p>
        <h1 style={{ color: '#fff', fontSize: '22px', margin: '0 0 2px', letterSpacing: '3px', fontFamily: 'Arial, sans-serif', fontWeight: 900 }}>
          SMART<span style={{ color: '#F5D978' }}>LABS</span>
        </h1>
        <div style={{ height: '1.5px', background: '#C9A84C', width: '140px', margin: '8px auto', opacity: 0.8 }} />
        <p style={{ color: '#E8C97A', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', margin: '0 0 14px', fontFamily: 'Arial, sans-serif' }}>
          Certificate of Completion
        </p>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'Arial, sans-serif' }}>
          This is to certify that
        </p>

        <div style={{ margin: '4px 0 10px' }}>
          <p style={{ color: '#F5D978', fontSize: '24px', margin: 0, letterSpacing: '1px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
            {displayName}
          </p>
          <div style={{ height: '1px', background: '#C9A84C', width: '260px', margin: '6px auto', opacity: 0.7 }} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '8.5px', margin: '0 0 6px', fontFamily: 'Arial, sans-serif' }}>
          has successfully completed the
        </p>
        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', margin: '0 0 3px', letterSpacing: '1px', fontFamily: 'Arial, sans-serif' }}>
          PTE Academic Training Programme
        </p>
        <p style={{ color: '#E8C97A', fontSize: '8px', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 14px', fontFamily: 'Arial, sans-serif', opacity: 0.85 }}>
          Conducted by Smart Labs LK
        </p>

        <div style={{ height: '1px', background: '#C9A84C', margin: '0 0 14px', opacity: 0.6 }} />

        {/* Footer row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px' }}>Issue Date</p>
            <p style={{ color: '#E8C97A', fontWeight: 'bold', margin: 0 }}>{today}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '1px', width: '100px', background: '#C9A84C', opacity: 0.5, margin: '0 auto 4px' }} />
            <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 1px' }}>Lahiruka Weeraratne</p>
            <p style={{ color: '#E8C97A', margin: 0, opacity: 0.85 }}>Lecturer · Smart Labs LK</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px' }}>Certificate No.</p>
            <p style={{ color: '#E8C97A', fontWeight: 'bold', margin: 0 }}>{certNo}</p>
          </div>
        </div>
      </div>

      {/* Watermark overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{
          transform: 'rotate(-35deg)',
          color: 'rgba(201,168,76,0.25)',
          fontSize: '13px',
          fontWeight: 900,
          letterSpacing: '3px',
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          lineHeight: 2.2,
          padding: '80px 0',
        }}>
          {['PREVIEW ONLY — NOT VALID', userEmail || 'SMARTLABS.LK', 'PREVIEW ONLY — NOT VALID', userEmail || 'SMARTLABS.LK'].map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LetterPreview({ studentName, userEmail }: { studentName: string; userEmail: string }) {
  const displayName = studentName.trim() || 'Your Full Name';
  const certNo = 'SL-PTE-2026-SAMPLE';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: '#fff',
      borderRadius: '4px',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: '0.707 / 1',
    }}>
      {/* Header */}
      <div style={{ background: '#0D1B35', padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ color: '#fff', margin: '0 0 2px', fontSize: '18px', letterSpacing: '1.5px', fontWeight: 900 }}>
            SMART<span style={{ color: '#F5D978' }}>LABS</span> LK
          </h2>
          <p style={{ color: '#C9A84C', margin: 0, fontSize: '7px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            PTE Academic Training Centre
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '7px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
          <div>www.smartlabs.lk</div>
          <div>077 453 3233</div>
        </div>
      </div>
      <div style={{ height: '3px', background: '#C9A84C' }} />

      {/* Ref band */}
      <div style={{ background: '#f8f9fa', padding: '8px 28px', display: 'flex', gap: '40px', borderBottom: '1px solid #e5e7eb', fontSize: '7.5px' }}>
        {[['Reference No.', certNo], ['Date', today], ['Document', 'Completion Letter']].map(([label, val]) => (
          <div key={label}>
            <p style={{ color: '#6b7280', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <p style={{ color: '#0D1B35', fontWeight: 'bold', margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 28px', fontSize: '8px', color: '#374151', lineHeight: 1.65 }}>
        <p style={{ marginBottom: '12px' }}>{today}</p>
        <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>To Whom It May Concern,</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ width: '3px', height: '20px', background: '#C9A84C', borderRadius: '1px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontWeight: 'bold', color: '#0D1B35', fontSize: '9px' }}>
            RE: Confirmation of PTE Academic Training Completion
          </p>
        </div>

        <p>This letter is to confirm that <strong>{displayName}</strong> has successfully completed the PTE Academic Training Programme conducted by Smart Labs LK. The programme encompasses comprehensive preparation for the Pearson Test of English (PTE) Academic examination, covering all four core competencies: Speaking, Writing, Reading, and Listening.</p>
        <br />
        <p>Throughout the training, the participant demonstrated consistent dedication and effort in developing the academic English language skills required for the PTE Academic examination.</p>
        <br />
        <p>Yours sincerely,</p>
        <div style={{ marginTop: '28px' }}>
          <div style={{ height: '1px', width: '120px', background: '#0D1B35', opacity: 0.3, marginBottom: '4px' }} />
          <p style={{ fontWeight: 'bold', margin: '0 0 1px', fontSize: '9px' }}>Lahiruka Weeraratne</p>
          <p style={{ color: '#6b7280', margin: '0 0 1px' }}>Lecturer — PTE Academic Training</p>
          <p style={{ color: '#C9A84C', fontWeight: 'bold', margin: 0 }}>Smart Labs LK</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#0D1B35', padding: '10px 28px', display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: 'rgba(255,255,255,0.5)', marginTop: 'auto' }}>
        <span>Smart Labs LK · www.smartlabs.lk</span>
        <span style={{ color: '#C9A84C' }}>Ref: {certNo}</span>
      </div>

      {/* Watermark overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{
          transform: 'rotate(-35deg)',
          color: 'rgba(13,27,53,0.18)',
          fontSize: '11px',
          fontWeight: 900,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          lineHeight: 2.5,
        }}>
          {['PREVIEW ONLY — NOT VALID', userEmail || 'SMARTLABS.LK', 'PREVIEW ONLY — NOT VALID'].map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CertificatePreview({ studentName, userEmail, tab = 'certificate' }: CertificatePreviewProps) {
  const [activeTab, setActiveTab] = useState<'certificate' | 'letter'>(tab);
  const [hidden, setHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Anti-screenshot & screen-recording protection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setHidden(true);
      else setHidden(false);
    };

    const blockContextMenu = (e: MouseEvent) => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setHidden(true);
        setTimeout(() => setHidden(false), 1200);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    containerRef.current?.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      containerRef.current?.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  return (
    <div ref={containerRef} className="select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-3">
        {(['certificate', 'letter'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t
                ? 'bg-amber-500/20 text-amber-600 border-2 border-amber-500/40'
                : 'bg-muted/40 text-muted-foreground border-2 border-transparent hover:border-border'
            }`}
          >
            {t === 'certificate' ? <Certificate weight="bold" className="h-3.5 w-3.5" /> : <FileText weight="bold" className="h-3.5 w-3.5" />}
            {t === 'certificate' ? 'Certificate' : 'Letter'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          {hidden ? <EyeSlash weight="bold" className="h-3 w-3" /> : <Eye weight="bold" className="h-3 w-3" />}
          Preview only
        </div>
      </div>

      {/* Preview wrapper */}
      <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/20 bg-muted/10">
        {/* Screenshot-blocked overlay */}
        <AnimatePresence>
          {hidden && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center gap-3"
            >
              <EyeSlash weight="bold" className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">Preview hidden for security</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actual preview (pointer-events none so can't interact) */}
        <div style={{ pointerEvents: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'certificate' ? (
                <CertPreview studentName={studentName} userEmail={userEmail} />
              ) : (
                <LetterPreview studentName={studentName} userEmail={userEmail} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Notice */}
      <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
        Sample preview — actual document generated upon approval · Watermark removed in final PDF
      </p>
    </div>
  );
}
