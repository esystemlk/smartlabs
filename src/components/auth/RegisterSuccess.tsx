'use client';

import React from 'react';
import Lottie from 'lottie-react';
// Statically imported (bundled) → plays instantly, no fetch flash.
import successAnim from '../../../public/su.json';

/**
 * Full-screen "account successfully registered" success animation,
 * shown briefly after a new account is created before redirecting.
 */
export function RegisterSuccess() {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white">
      <div style={{ width: 360, maxWidth: '85vw' }}>
        <Lottie animationData={successAnim} loop={false} autoplay />
      </div>
    </div>
  );
}
