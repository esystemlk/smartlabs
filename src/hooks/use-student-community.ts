'use client';
import { useEffect, useState } from 'react';
import { EXISTING_LEARNERS } from '@/lib/student-community';

export function useStudentCommunity() {
  const [total, setTotal] = useState(EXISTING_LEARNERS);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const response = await fetch('/api/student-community', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted && Number.isSafeInteger(data.total) && data.total >= EXISTING_LEARNERS) setTotal(data.total);
      } catch { /* Keep the last known total, or the confirmed 6,000-learner baseline. */ }
      finally { pending = false; }
    };
    void refresh();
    const interval = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return total;
}
