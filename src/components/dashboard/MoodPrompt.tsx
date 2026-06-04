'use client';

import React, { useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MOODS } from '@/lib/moods';

/**
 * "How are you feeling today?" mood picker (controlled).
 *
 * The animation IS the picker: hover reactions come from its dotLottie state
 * machine, and we capture the chosen mood by where the user clicks across the
 * emoji strip (no duplicate buttons, hover stays intact).
 *
 * Requires the animation exported as dotLottie at /public/mood.lottie.
 */

// Horizontal band (fraction of the animation width) that the 5 emojis occupy.
// Tune these two if a tap lands on the wrong emoji.
const STRIP_START = 0.18;
const STRIP_END = 0.82;

export function MoodPrompt({
  open,
  onPick,
  onDismiss,
}: {
  open: boolean;
  onPick: (mood: string) => void;
  onDismiss: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dlRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRef = (dl: any) => {
    dlRef.current = dl;
    if (!dl) return;
    const start = () => {
      try {
        if (typeof dl.stateMachineLoad === 'function') {
          dl.stateMachineLoad('StateMachine1');
          dl.stateMachineStart?.();
        } else if (typeof dl.loadStateMachine === 'function') {
          dl.loadStateMachine('StateMachine1');
          dl.startStateMachine?.();
        }
      } catch { /* SM optional — animation still plays */ }
    };
    try { dl.addEventListener('load', start); } catch { /* ignore */ }
  };

  // Map the click X position across the emoji strip to one of the 5 moods.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < STRIP_START || x > STRIP_END) return;
    const span = (STRIP_END - STRIP_START) / MOODS.length;
    const idx = Math.min(MOODS.length - 1, Math.max(0, Math.floor((x - STRIP_START) / span)));
    onPick(MOODS[idx].key);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-3xl bg-slate-900 shadow-2xl border border-white/10 overflow-hidden"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Animation = the picker. Clicks are captured by position (capture
                phase so the canvas can't swallow them); hover stays native. */}
            <div
              onClickCapture={handleClick}
              className="cursor-pointer select-none"
              style={{ height: 300 }}
            >
              <DotLottieReact
                src="/mood.lottie"
                autoplay
                loop
                dotLottieRefCallback={handleRef}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="px-5 pb-5 pt-1 text-center">
              <p className="text-xs font-semibold text-white/50">Tap the emoji that matches your mood</p>
              <button
                onClick={onDismiss}
                className="mt-3 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
