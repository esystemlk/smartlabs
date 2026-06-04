'use client';

import { useEffect, useRef } from 'react';

/**
 * Makes the tutor avatar "look" toward the mouse cursor.
 *
 * Returns a ref to attach to the avatar wrapper. On mouse move it directly
 * mutates the wrapper's transform (a subtle 3D head-turn) and shifts any child
 * element marked with `data-pupil` toward the cursor — all via requestAnimationFrame
 * and direct DOM writes, so it never triggers React re-renders.
 *
 * Works with ANY avatar (Rive, Lottie, or the CSS face): the head-turn applies to
 * the whole wrapper; pupil tracking only affects elements that opt in with data-pupil.
 */
export function useCursorTracking(options?: {
  /** Distance (px) from the avatar center at which the look reaches its max. */
  range?: number;
  /** Max pupil shift in px. */
  pupilShift?: number;
  /** Subtle whole-avatar lean toward the cursor, in px. 0 = no body movement. */
  lean?: number;
  /** Pause tracking (e.g. while a strong emotion plays). */
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const range = options?.range ?? 550;
  const pupilShift = options?.pupilShift ?? 6;
  const lean = options?.lean ?? 0;
  const disabled = options?.disabled ?? false;

  useEffect(() => {
    const reset = () => {
      const el = ref.current;
      if (!el) return;
      if (lean) el.style.transform = '';
      el.querySelectorAll<HTMLElement>('[data-pupil]').forEach(p => { p.style.transform = ''; });
    };
    if (disabled) { reset(); return; }

    let raf = 0;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clamp((e.clientX - cx) / range);
      const dy = clamp((e.clientY - cy) / range);

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Pupils track the cursor (works on overlay pupils + the CSS face).
        el.querySelectorAll<HTMLElement>('[data-pupil]').forEach(p => {
          p.style.transform = `translate(${dx * pupilShift}px, ${dy * pupilShift}px)`;
        });
        // Optional subtle lean of the whole avatar (no rotation).
        if (lean) el.style.transform = `translate(${dx * lean}px, ${dy * lean}px)`;
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [range, pupilShift, lean, disabled]);

  return ref;
}
