'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import type { AvatarState } from '@/hooks/useLipSync';
import { TutorAvatar } from './TutorAvatar';

/**
 * Rive-powered animated tutor character.
 *
 * Auto-detects the file's first state machine and its inputs, then maps our live
 * lip-sync amplitude to the mouth/voice input. Works with the NoraBot demo
 * (which exposes a "TTS" number input) and most community files without manual
 * naming. Falls back to the built-in CSS <TutorAvatar/> if the file is missing.
 *
 * Drop your file at: /public/nora.riv
 */

const RIV_SRC = '/nora.riv';
// NoraBot's "TTS" input is discrete: 0 = mouth closed, 1 = mouth open.
// We flap it from the live amplitude with hysteresis so it doesn't jitter.
const OPEN_AT = 0.16;   // amplitude needed to OPEN the mouth
const CLOSE_AT = 0.07;  // amplitude below which it CLOSES again

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SMInput = any;

export function RiveTutorAvatar({
  mouthOpen,
  state,
  size = 220,
}: {
  mouthOpen: number;
  state: AvatarState;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const mouthRef = useRef<SMInput | null>(null);
  const isOpenRef = useRef(false);

  const { rive, RiveComponent } = useRive({
    src: RIV_SRC,
    autoplay: true,
    onLoadError: () => setFailed(true),
  });

  // Detect the state machine + inputs once the instance is ready.
  useEffect(() => {
    if (!rive) return;
    try {
      const names: string[] = rive.stateMachineNames || [];
      if (names.length === 0) {
        console.warn('[RiveTutorAvatar] No state machine found in nora.riv');
        return;
      }
      const sm = names[0];
      rive.play(sm);
      const inputs: SMInput[] = rive.stateMachineInputs(sm) || [];
      // Log so we can see exactly what the file exposes (helps fine-tune mapping).
      console.log(
        '[RiveTutorAvatar] state machine:', sm,
        'inputs:', inputs.map((i) => ({ name: i.name, type: i.type }))
      );
      // The lip-sync/voice driver — NoraBot calls it "TTS".
      mouthRef.current =
        inputs.find((i) => /^tts$|mouth|talk|lip|voice|amplitude|volume/i.test(i.name)) || null;
      if (!mouthRef.current) {
        console.warn('[RiveTutorAvatar] No mouth/TTS input found — character will not lip-sync.');
      }
    } catch (e) {
      console.warn('[RiveTutorAvatar] input detection failed:', e);
    }
  }, [rive]);

  // Flap the mouth open/closed from the live amplitude (with hysteresis).
  useEffect(() => {
    const input = mouthRef.current;
    if (!input) return;
    let open = isOpenRef.current;
    if (!open && mouthOpen > OPEN_AT) open = true;
    else if (open && mouthOpen < CLOSE_AT) open = false;
    if (open !== isOpenRef.current) {
      isOpenRef.current = open;
      try { input.value = open ? 1 : 0; } catch { /* not ready */ }
    }
  }, [mouthOpen]);

  if (failed) {
    return <TutorAvatar mouthOpen={mouthOpen} state={state} />;
  }

  return (
    <div className="flex flex-col items-center select-none">
      <div style={{ width: size, height: size }} className="rounded-3xl overflow-hidden">
        <RiveComponent />
      </div>
      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        {state === 'speaking' ? 'Speaking…' : state === 'thinking' ? 'Thinking…' : state === 'listening' ? 'Listening…' : 'Nora · AI Tutor'}
      </div>
    </div>
  );
}
