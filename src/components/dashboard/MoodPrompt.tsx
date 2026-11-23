'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MOODS } from '@/lib/moods';

/**
 * "How are you feeling today?" mood picker (controlled).
 * Five icon buttons, one per mood. onPick receives the mood key, exactly as before.
 */
export function MoodPrompt({
  open,
  onPick,
  onDismiss,
}: {
  open: boolean;
  onPick: (mood: string) => void;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mood-title"
            className="relative w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-white p-6 sm:p-8 text-center"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 id="mood-title" className="text-2xl font-extrabold tracking-tight text-[#0a1733]">How are you feeling today?</h2>
            <p className="mt-2 text-sm text-slate-500">Pick the one that fits. It shows on your profile for today.</p>

            <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => onPick(m.key)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-1 py-3 transition-all hover:-translate-y-0.5 ${m.hover}`}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-full border ${m.chip}`}>
                    <m.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700">{m.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onDismiss}
              className="mt-5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
