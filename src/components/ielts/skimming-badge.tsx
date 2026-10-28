'use client';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { Trophy, Lock, BookOpenCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/** Achievements card for the profile — shows the IELTS "Skimming Master" badge. */
export function SkimmingBadge() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user],
  );
  const { data } = useDoc(userRef);
  const badge = (data as { skimmingMasterBadge?: { awardedAt?: number; version?: string } } | null)?.skimmingMasterBadge;
  const earned = !!badge?.awardedAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>IELTS Reading Skills</CardTitle>
            <CardDescription>Achievements you&apos;ve earned in the IELTS Studio.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center gap-4 rounded-2xl border p-4 ${earned ? 'border-amber-300 bg-gradient-to-br from-slate-900 to-indigo-950 text-amber-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
          <div className={`flex h-16 w-16 flex-none items-center justify-center rounded-full ${earned ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-400'}`}>
            {earned ? <Trophy className="h-8 w-8" /> : <Lock className="h-7 w-7" />}
          </div>
          <div className="flex-1">
            <p className={`text-lg font-black ${earned ? 'text-white' : 'text-slate-700'}`}>Skimming Master</p>
            {earned ? (
              <p className="text-sm text-slate-300">
                Earned {badge?.awardedAt ? new Date(badge.awardedAt).toLocaleDateString() : ''}
                {badge?.version ? ` · edition ${badge.version}` : ''} — all five skimming levels passed.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pass all five levels of the{' '}
                <Link href="/dashboard/ielts/reading/skimming" className="font-bold text-primary hover:underline">Skimming Mastery Challenge</Link>{' '}
                to earn this badge.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
