'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

/**
 * Branded loading animation — plays /public/walking.json (a Lottie walking character).
 * Falls back to a simple spinner until the file is present.
 */
export function WalkingLoader({
  message,
  size = 160,
  className = '',
}: {
  message?: string;
  size?: number;
  className?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/walking.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(json => { if (active) setData(json); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {data && !failed ? (
        <div style={{ width: size, height: size }}>
          <Lottie animationData={data} loop autoplay />
        </div>
      ) : (
        <div
          className="rounded-full border-[3px] border-slate-200 border-t-[#f97316] animate-spin"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
      {message && <p className="text-sm font-semibold text-slate-500">{message}</p>}
    </div>
  );
}
