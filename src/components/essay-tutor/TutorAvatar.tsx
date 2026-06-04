'use client';

import React from 'react';
import type { AvatarState } from '@/hooks/useLipSync';

/**
 * Animated tutor face — two eyes + a mouth.
 * - idle: gentle blinking
 * - thinking: eyes glance up, mouth closed, soft pulse
 * - listening: mic ring pulse
 * - speaking: mouth openness driven in real time by `mouthOpen` (0..1)
 */
export function TutorAvatar({ mouthOpen, state }: { mouthOpen: number; state: AvatarState }) {
  const open = Math.max(0, Math.min(1, mouthOpen));
  // Mouth scaleY: never fully flat; opens with amplitude when speaking.
  const mouthScaleY = state === 'speaking' ? 0.12 + open * 1.25 : 0.12;
  const speaking = state === 'speaking';
  const thinking = state === 'thinking';
  const listening = state === 'listening';

  return (
    <div className="flex flex-col items-center select-none">
      <style>{`
        @keyframes tutor-blink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
        @keyframes tutor-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tutor-ring  { 0% { transform: scale(0.9); opacity: .6; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes tutor-think { 0%,100% { opacity: .35; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
      `}</style>

      <div
        className="relative"
        style={{ animation: 'tutor-float 5s ease-in-out infinite', willChange: 'transform' }}
      >
        {/* Glow / pulse ring while speaking or listening */}
        {(speaking || listening) && (
          <span
            className="absolute inset-0 rounded-[38%] pointer-events-none"
            style={{
              boxShadow: listening
                ? '0 0 0 4px rgba(59,130,246,0.18)'
                : `0 0 ${18 + open * 40}px rgba(249,115,22,${0.25 + open * 0.4})`,
              animation: listening ? 'tutor-ring 1.4s ease-out infinite' : undefined,
            }}
          />
        )}

        {/* Head */}
        <div
          className="relative w-40 h-40 rounded-[38%] flex items-center justify-center"
          style={{
            background: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 55%, #fed7aa 100%)',
            border: '3px solid #fdba74',
            boxShadow: '0 18px 40px -12px rgba(249,115,22,0.35), inset 0 -10px 24px rgba(249,115,22,0.08)',
          }}
        >
          {/* Eyes */}
          <div
            className="absolute flex gap-7"
            style={{
              top: '34%',
              transform: thinking ? 'translateY(-4px)' : 'none',
              transition: 'transform .4s ease',
            }}
          >
            {[0, 1].map(i => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden"
                style={{
                  border: '2px solid #fb923c',
                  animation: state === 'idle' ? `tutor-blink ${3.6 + i * 0.4}s ease-in-out infinite` : undefined,
                  willChange: 'transform',
                }}
              >
                {/* Pupil — glances up when thinking, follows mouth subtly when speaking */}
                <span
                  data-pupil
                  className="block w-3.5 h-3.5 rounded-full bg-slate-800"
                  style={{
                    transform: thinking
                      ? 'translateY(-4px)'
                      : speaking
                        ? `translateY(${-1 + open * 1}px)`
                        : 'translateY(0)',
                    transition: 'transform .25s ease',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Mouth */}
          <div
            className="absolute"
            style={{
              bottom: '26%',
              width: '46px',
              height: '24px',
              borderRadius: '0 0 24px 24px',
              background: '#7c2d12',
              transform: `scaleY(${mouthScaleY})`,
              transformOrigin: 'center top',
              transition: 'transform 60ms linear',
            }}
          >
            {/* tongue hint */}
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{ bottom: 0, width: '24px', height: '10px', background: '#ef7d5a', opacity: speaking ? 0.9 : 0.5 }}
            />
          </div>

          {/* Thinking dots */}
          {thinking && (
            <div className="absolute -top-3 right-4 flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-orange-400"
                  style={{ animation: `tutor-think 1.1s ease-in-out ${i * 0.18}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status label */}
      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        {speaking ? 'Speaking…' : thinking ? 'Thinking…' : listening ? 'Listening…' : 'Alora · AI Tutor'}
      </div>
    </div>
  );
}
