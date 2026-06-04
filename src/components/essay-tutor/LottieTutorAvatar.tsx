'use client';

import React, { useEffect, useRef, useState } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import type { AvatarState } from '@/hooks/useLipSync';
import { TutorAvatar } from './TutorAvatar';

/**
 * Lottie-powered tutor character built in LottieFiles Creator.
 *
 * The exported timeline is split into emotion segments (30fps, 120 frames):
 *   talk     0-30   · thinking 30-60 · excited 60-90 · sad 90-120
 *
 * Plays the segment that matches the current `state` (and optional `mood`
 * override for excited/sad). Falls back to the CSS <TutorAvatar/> until the
 * file is exported to /public/nora-tutor.json.
 */

const JSON_SRC = '/nora-tutor.json';
const SEG: Record<string, [number, number]> = {
  talk: [0, 30],
  thinking: [30, 60],
  excited: [60, 90],
  sad: [90, 120],
};

export type TutorMood = 'excited' | 'sad' | null;

export function LottieTutorAvatar({
  mouthOpen,
  state,
  mood = null,
  size = 220,
}: {
  mouthOpen: number;
  state: AvatarState;
  mood?: TutorMood;
  size?: number;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any | null>(null);
  const [failed, setFailed] = useState(false);

  // Load the exported animation once.
  useEffect(() => {
    let active = true;
    fetch(JSON_SRC)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(json => { if (active) setData(json); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  // Drive the right segment whenever state / mood changes.
  useEffect(() => {
    const l = lottieRef.current;
    if (!l || !data) return;
    if (mood === 'excited') { l.playSegments(SEG.excited, true); return; }
    if (mood === 'sad')     { l.playSegments(SEG.sad, true); return; }
    if (state === 'speaking') l.playSegments(SEG.talk, true);
    else if (state === 'thinking') l.playSegments(SEG.thinking, true);
    else l.goToAndStop(SEG.talk[0], true); // idle / listening → rest on closed-mouth frame
  }, [state, mood, data]);

  if (failed || !data) {
    // No exported file yet (or load error) → built-in CSS face.
    return <TutorAvatar mouthOpen={mouthOpen} state={state} />;
  }

  // The Creator scene is 400x460. Map the eye centers into the rendered box so
  // we can overlay app-controlled pupils (marked data-pupil) that track the cursor.
  const SCENE_W = 400, SCENE_H = 460;
  const boxW = size;
  const boxH = (size * SCENE_H) / SCENE_W;
  const sc = size / SCENE_W;
  const EYE_Y = 214 * sc;
  const EYE_LX = 150 * sc;
  const EYE_RX = 250 * sc;
  const pd = Math.max(9, Math.round(20 * sc)); // pupil diameter

  const Pupil = ({ cx }: { cx: number }) => (
    <span
      data-pupil
      style={{
        position: 'absolute',
        left: cx - pd / 2,
        top: EYE_Y - pd / 2,
        width: pd,
        height: pd,
        borderRadius: '50%',
        background: '#1c1f37',
        transition: 'transform 0.12s ease-out',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: pd * 0.18,
          top: pd * 0.14,
          width: pd * 0.32,
          height: pd * 0.32,
          borderRadius: '50%',
          background: '#ffffff',
        }}
      />
    </span>
  );

  return (
    <div className="flex flex-col items-center select-none">
      <div style={{ position: 'relative', width: boxW, height: boxH }}>
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop
          autoplay={false}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Cursor-tracking pupils overlaid on the white eyes */}
        <Pupil cx={EYE_LX} />
        <Pupil cx={EYE_RX} />
      </div>
      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        {state === 'speaking' ? 'Speaking…' : state === 'thinking' ? 'Thinking…' : state === 'listening' ? 'Listening…' : 'Nora · AI Tutor'}
      </div>
    </div>
  );
}
