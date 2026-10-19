'use client';

import { useEffect, useState, useMemo } from 'react';
import {AdminOverview} from '@/components/admin/admin-overview';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import Image from 'next/image';

interface RecentAction {
    id: string;
    type: string;
    description: string;
    performedBy: string;
    targetUid: string;
    timestamp: Date;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalAdmins: 0,
        activeMonthlyPlans: 0,
        totalPaidCredits: 0,
        pendingEnrollments: 0,
        pendingCertificates: 0,
        openSupport: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError,setStatsError]=useState(false);

    // ── All users ──────────────────────────────────────────────────────────────
    const usersQuery = useMemoFirebase(() =>
        firestore ? collection(firestore, 'users') : null,
        [firestore]
    );
    const { data: users, isLoading: usersLoading, error: usersError } = useCollection(usersQuery);

    // ── Derived user counts ────────────────────────────────────────────────────
    const userCounts = useMemo(() => {
        if (!users) return { total: 0, students: 0, teachers: 0, admins: 0 };
        const counts = { total: users.length, students: 0, teachers: 0, admins: 0 };
        users.forEach((u: any) => {
            const r = u.role ?? 'student';
            if (r === 'student' || r === 'user') counts.students++;
            else if (r === 'teacher') counts.teachers++;
            else if (r === 'admin' || r === 'developer') counts.admins++;
        });
        return counts;
    }, [users]);

    // ── Auth check ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isUserLoading && currentUser && firestore) {
            getDoc(doc(firestore, 'users', currentUser.uid)).then(snap => {
                if (snap.exists()) {
                    const role = snap.data().role;
                    setCurrentUserRole(role);
                    if (['admin', 'developer', 'teacher'].includes(role)) {
                        setIsAdmin(true);
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    router.push('/login');
                }
            });
        } else if (!isUserLoading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, isUserLoading, router, firestore]);

    // ── Extra stats from Firestore ─────────────────────────────────────────────
    useEffect(() => {
        if (!firestore || !isAdmin) return;

        const load = async () => {
            setStatsLoading(true);
            setStatsError(false);
            try {
                const now = new Date();

                // Active monthly plans
                const monthlySnap = await getDocs(
                    query(collection(firestore, 'users'),
                        where('essayMonthlyExpiry', '>', Timestamp.fromDate(now))
                    )
                );

                // Pending enrollments
                let pendingEnroll = 0;
                try {
                    const enrollSnap = await getDocs(
                        query(collection(firestore, 'enrollments'),
                            where('status', '==', 'pending')
                        )
                    );
                    pendingEnroll = enrollSnap.size;
                } catch { setStatsError(true); }

                // Pending certificates
                let pendingCerts = 0;
                try {
                    const certSnap = await getDocs(
                        query(collection(firestore, 'certificate_requests'),
                            where('status', '==', 'pending')
                        )
                    );
                    pendingCerts = certSnap.size;
                } catch { setStatsError(true); }

                // Open support tickets
                let openSupport = 0;
                try {
                    const supSnap = await getDocs(
                        query(collection(firestore, 'support_tickets'),
                            where('status', '==', 'open')
                        )
                    );
                    openSupport = supSnap.size;
                } catch { setStatsError(true); }

                // Recent admin actions
                let actions: RecentAction[] = [];
                try {
                    const actSnap = await getDocs(
                        query(collection(firestore, 'admin_actions'),
                            orderBy('timestamp', 'desc'),
                            limit(8)
                        )
                    );
                    actions = actSnap.docs.map(d => {
                        const data = d.data();
                        const ts = data.timestamp;
                        return {
                            id: d.id,
                            type: data.type ?? '',
                            description: data.description ?? '',
                            performedBy: data.performedBy ?? '',
                            targetUid: data.targetUid ?? '',
                            timestamp: ts?.toDate ? ts.toDate() : new Date(ts ?? 0),
                        };
                    });
                } catch { setStatsError(true); }

                setStats(prev => ({
                    ...prev,
                    activeMonthlyPlans: monthlySnap.size,
                    pendingEnrollments: pendingEnroll,
                    pendingCertificates: pendingCerts,
                    openSupport,
                }));
                setRecentActions(actions);
            } catch (e) {
                setStatsError(true);
                console.error('Stats load error:', e);
            } finally {
                setStatsLoading(false);
            }
        };

        load();
    }, [firestore, isAdmin]);

    // ── Loading state ──────────────────────────────────────────────────────────
    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center flex flex-col items-center gap-4">
                    <Image src="/logo.png" alt="Smart Labs Logo" width={80} height={80} style={{ width: 'auto', height: 'auto' }} className="animate-pulse-glow" />
                    <p className="text-lg font-semibold">Verifying Access...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we check your credentials.</p>
                </div>
            </div>
        );
    }

    return <AdminOverview name={currentUser?.displayName||''} role={currentUserRole} loading={statsLoading} usersLoading={usersLoading} usersUnavailable={!!usersError} statsError={statsError} userCounts={userCounts} stats={stats} actions={recentActions}/>;
}
