'use client';

import React from 'react';
import { moodByKey } from '@/lib/moods';

/**
 * Small chip showing the student's current mood — rendered at the top of
 * their dashboard/profile. Renders nothing if no (unexpired) mood is set.
 */
export function MoodBadge({ mood, className = '' }: { mood?: string | null; className?: string }) {
  const m = moodByKey(mood);
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${m.chip} ${className}`}
      title={`Today you're feeling ${m.label}`}
    >
      <span className="text-sm leading-none">{m.emoji}</span>
      Feeling {m.label}
    </span>
  );
}
