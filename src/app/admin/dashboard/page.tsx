'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';
import {
    LogOut, Users, UserCog, MessageSquare, GraduationCap, FileText, Library,
    DollarSign, UserCheck, LayoutDashboard, Video, Brain, Presentation,
    ShieldCheck, Gift, ChevronRight, Activity, Clock, Zap,
    BookOpen, CreditCard, Star, AlertTriangle, CheckCircle2, BarChart3,
    Settings, Globe, Bell, Layers, ArrowUpRight, RefreshCw, Crown, Award
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    trend?: { value: string; up: boolean } | null;
}

interface NavSection {
    label: string;
    icon: React.ElementType;
    items: NavItem[];
}

interface NavItem {
    title: string;
    desc: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    badgeColor?: string;
    accent?: string;
}

interface RecentAction {
    id: string;
    type: string;
    description: string;
    performedBy: string;
    targetUid: string;
    timestamp: Date;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
    return (
        <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                {trend && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${trend.up ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        <ArrowUpRight className={`h-3 w-3 ${!trend.up && 'rotate-90'}`} />
                        {trend.value}
                    </span>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
                {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Nav Section Card ─────────────────────────────────────────────────────────
function SectionCard({ section }: { section: NavSection }) {
    const SectionIcon = section.icon;
    return (
        <div className="bg-card border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center gap-2">
                <SectionIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{section.label}</span>
            </div>
            <div className="divide-y">
                {section.items.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                        <Link key={i} href={item.href}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                        >
                            <div className={`p-2 rounded-lg ${item.accent ?? 'bg-muted'} shrink-0`}>
                                <ItemIcon className="h-4 w-4 text-foreground/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    {item.badge && (
                                        <Badge variant="secondary" className={`text-xs py-0 ${item.badgeColor ?? ''}`}>{item.badge}</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const auth = useAuth();
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

    // ── All users ──────────────────────────────────────────────────────────────
    const usersQuery = useMemoFirebase(() =>
        firestore ? collection(firestore, 'users') : null,
        [firestore]
    );
    const { data: users } = useCollection(usersQuery);

    // ── Derived user counts ────────────────────────────────────────────────────
    const userCounts = useMemo(() => {
        if (!users) return { total: 0, students: 0, teachers: 0, admins: 0 };
        const counts = { total: users.length, students: 0, teachers: 0, admins: 0 };
        users.forEach((u: any) => {
            const r = u.role ?? 'student';
            if (r === 'student') counts.students++;
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
                } catch { /* collection may not exist */ }

                // Pending certificates
                let pendingCerts = 0;
                try {
                    const certSnap = await getDocs(
                        query(collection(firestore, 'certificate_requests'),
                            where('status', '==', 'pending')
                        )
                    );
                    pendingCerts = certSnap.size;
                } catch { /* collection may not exist */ }

                // Open support tickets
                let openSupport = 0;
                try {
                    const supSnap = await getDocs(
                        query(collection(firestore, 'support_tickets'),
                            where('status', '==', 'open')
                        )
                    );
                    openSupport = supSnap.size;
                } catch { /* collection may not exist */ }

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
                } catch { /* collection may not exist */ }

                setStats(prev => ({
                    ...prev,
                    activeMonthlyPlans: monthlySnap.size,
                    pendingEnrollments: pendingEnroll,
                    pendingCertificates: pendingCerts,
                    openSupport,
                }));
                setRecentActions(actions);
            } catch (e) {
                console.error('Stats load error:', e);
            } finally {
                setStatsLoading(false);
            }
        };

        load();
    }, [firestore, isAdmin]);

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/login');
    };

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

    // ── Nav sections ───────────────────────────────────────────────────────────
    const navSections: NavSection[] = [
        {
            label: 'People',
            icon: Users,
            items: [
                { title: 'User Management', desc: 'Edit roles, ban, and manage all accounts', icon: UserCog, href: '/admin/dashboard/users', accent: 'bg-blue-500/10' },
                { title: 'Enrollments', desc: 'Approve and manage student enrollments', icon: UserCheck, href: '/admin/dashboard/enrollments', badge: stats.pendingEnrollments > 0 ? `${stats.pendingEnrollments} pending` : undefined, badgeColor: 'bg-amber-500/20 text-amber-600', accent: 'bg-amber-500/10' },
            ],
        },
        {
            label: 'Content',
            icon: BookOpen,
            items: [
                { title: 'Course Management', desc: 'Add, edit, or delete courses & lessons', icon: GraduationCap, href: '/admin/dashboard/courses', accent: 'bg-purple-500/10' },
                { title: 'Resource Library', desc: 'Upload and organise learning materials', icon: Library, href: '/admin/dashboard/resources', accent: 'bg-indigo-500/10' },
                { title: 'Blog Management', desc: 'Publish and edit articles & announcements', icon: FileText, href: '/admin/dashboard/blog', accent: 'bg-teal-500/10' },
                { title: 'Workshop Management', desc: 'Free monthly workshops — dates & slots', icon: Presentation, href: '/admin/dashboard/workshops', badge: 'Free', badgeColor: 'bg-green-500/20 text-green-600', accent: 'bg-green-500/10' },
                { title: 'Webinar Management', desc: 'Webinar registrations and recordings', icon: Video, href: '/admin/dashboard/webinars', accent: 'bg-blue-500/10' },
                { title: 'Session Manager', desc: 'Active Zoom session links for live classes', icon: Video, href: '/admin/dashboard/sessions', accent: 'bg-cyan-500/10' },
            ],
        },
        {
            label: 'Finance',
            icon: DollarSign,
            items: [
                { title: 'Payment Settings', desc: 'PayHere merchant config and course prices', icon: Settings, href: '/admin/dashboard/payments/settings', accent: 'bg-emerald-500/10' },
                { title: 'Payment History', desc: 'Browse and export all transactions', icon: CreditCard, href: '/admin/dashboard/payments', accent: 'bg-green-500/10' },
                { title: 'Essay Credit Manager', desc: 'Give or adjust essay scoring & gen credits', icon: Gift, href: '/admin/dashboard/essay-credits', badge: 'AI', badgeColor: 'bg-orange-500/20 text-orange-600', accent: 'bg-orange-500/10' },
                { title: 'Question Bank', desc: 'Manage PTE practice questions (Writing active)', icon: FileText, href: '/admin/dashboard/question-bank', badge: 'New', badgeColor: 'bg-violet-500/20 text-violet-600', accent: 'bg-violet-500/10' },
            ],
        },
        {
            label: 'Reports & Support',
            icon: BarChart3,
            items: [
                { title: 'Level Test Results', desc: 'Student diagnostic reports & analytics', icon: Brain, href: '/admin/dashboard/level-tests', accent: 'bg-violet-500/10' },
                { title: 'Certificate Requests', desc: 'Review and issue PTE certificates', icon: Award, href: '/admin/dashboard/certificates', badge: stats.pendingCertificates > 0 ? `${stats.pendingCertificates} pending` : undefined, badgeColor: 'bg-amber-500/20 text-amber-600', accent: 'bg-amber-500/10' },
                { title: 'Support Center', desc: 'Manage student queries and tickets', icon: MessageSquare, href: '/admin/dashboard/support', badge: stats.openSupport > 0 ? `${stats.openSupport} open` : undefined, badgeColor: 'bg-red-500/20 text-red-600', accent: 'bg-red-500/10' },
            ],
        },
        {
            label: 'System',
            icon: Settings,
            items: [
                {
                    title: 'AI API Settings',
                    desc: currentUserRole === 'developer' ? 'Gemini API key, model status & usage' : 'Developer-only access',
                    icon: ShieldCheck,
                    href: '/admin/dashboard/ai-settings',
                    badge: currentUserRole === 'developer' ? undefined : 'Dev Only',
                    badgeColor: 'bg-slate-500/20 text-slate-500',
                    accent: 'bg-primary/10',
                },
            ],
        },
    ];

    // ── Role badge color ───────────────────────────────────────────────────────
    const roleBadgeClass =
        currentUserRole === 'developer' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0' :
        currentUserRole === 'admin' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0' :
        'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0';

    const roleIcon =
        currentUserRole === 'developer' ? <ShieldCheck className="h-3 w-3" /> :
        currentUserRole === 'admin' ? <Crown className="h-3 w-3" /> :
        <Star className="h-3 w-3" />;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="w-full min-h-screen bg-background">
            {/* ── Top Header ──────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Smart Labs" width={32} height={32} style={{ width: 'auto', height: 32 }} />
                        <div className="hidden sm:block">
                            <p className="text-xs text-muted-foreground leading-none">SmartLabs Admin</p>
                            <p className="text-sm font-semibold leading-tight">{greeting}, {currentUser?.displayName?.split(' ')[0] || 'Admin'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`text-xs px-2.5 py-1 flex items-center gap-1.5 capitalize ${roleBadgeClass}`}>
                            {roleIcon}
                            {currentUserRole}
                        </Badge>
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs">
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Student View
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs">
                                <Globe className="h-3.5 w-3.5" />
                                Website
                            </Button>
                        </Link>
                        <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* ── Hero / Overview ──────────────────────────────────────────── */}
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {stats.pendingEnrollments > 0 && (
                                <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-600 border border-amber-500/30 px-3 py-1.5 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    {stats.pendingEnrollments} enrollment{stats.pendingEnrollments > 1 ? 's' : ''} awaiting approval
                                </span>
                            )}
                            {stats.pendingCertificates > 0 && (
                                <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-600 border border-amber-500/30 px-3 py-1.5 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    {stats.pendingCertificates} certificate{stats.pendingCertificates > 1 ? 's' : ''} to review
                                </span>
                            )}
                            {stats.openSupport > 0 && (
                                <span className="flex items-center gap-1.5 text-xs bg-red-500/15 text-red-600 border border-red-500/30 px-3 py-1.5 rounded-full">
                                    <Bell className="h-3 w-3" />
                                    {stats.openSupport} open support ticket{stats.openSupport > 1 ? 's' : ''}
                                </span>
                            )}
                            {stats.pendingEnrollments === 0 && stats.pendingCertificates === 0 && stats.openSupport === 0 && !statsLoading && (
                                <span className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-600 border border-green-500/30 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" />
                                    All clear — no pending actions
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <Link href="/admin/dashboard/users">
                            <Button size="sm" variant="secondary" className="flex items-center gap-2">
                                <UserCog className="h-4 w-4" /> Manage Users
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/enrollments">
                            <Button size="sm" className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" /> Enrollments
                                {stats.pendingEnrollments > 0 && (
                                    <Badge className="ml-1 bg-white text-primary h-5 w-5 p-0 flex items-center justify-center text-xs">{stats.pendingEnrollments}</Badge>
                                )}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Key Stats ────────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Platform Overview
                        </h2>
                        {statsLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            title="Total Users"
                            value={userCounts.total}
                            sub="Registered accounts"
                            icon={Users}
                            iconColor="text-blue-500"
                            iconBg="bg-blue-500/10"
                        />
                        <StatCard
                            title="Students"
                            value={userCounts.students}
                            sub="Active learners"
                            icon={GraduationCap}
                            iconColor="text-purple-500"
                            iconBg="bg-purple-500/10"
                        />
                        <StatCard
                            title="Teachers"
                            value={userCounts.teachers}
                            sub="Instructors"
                            icon={Presentation}
                            iconColor="text-teal-500"
                            iconBg="bg-teal-500/10"
                        />
                        <StatCard
                            title="Staff / Devs"
                            value={userCounts.admins}
                            sub="Admin-level access"
                            icon={ShieldCheck}
                            iconColor="text-violet-500"
                            iconBg="bg-violet-500/10"
                        />
                        <StatCard
                            title="Active AI Plans"
                            value={statsLoading ? '...' : stats.activeMonthlyPlans}
                            sub="Unlimited monthly"
                            icon={Zap}
                            iconColor="text-orange-500"
                            iconBg="bg-orange-500/10"
                        />
                        <StatCard
                            title="Pending Actions"
                            value={statsLoading ? '...' : stats.pendingEnrollments + stats.pendingCertificates + stats.openSupport}
                            sub="Requires attention"
                            icon={AlertTriangle}
                            iconColor={stats.pendingEnrollments + stats.pendingCertificates + stats.openSupport > 0 ? 'text-amber-500' : 'text-green-500'}
                            iconBg={stats.pendingEnrollments + stats.pendingCertificates + stats.openSupport > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}
                        />
                    </div>
                </section>

                {/* ── Main Content: Nav sections + Activity ────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Nav sections — 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Management Panels
                        </h2>
                        {navSections.map((section, i) => (
                            <SectionCard key={i} section={section} />
                        ))}
                    </div>

                    {/* Right column: Activity + Quick Links */}
                    <div className="space-y-6">

                        {/* Quick Links */}
                        <div className="bg-card border rounded-xl overflow-hidden">
                            <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Add Course', icon: GraduationCap, href: '/admin/dashboard/courses', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    { label: 'Give Credits', icon: Gift, href: '/admin/dashboard/essay-credits', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                    { label: 'Enrollments', icon: UserCheck, href: '/admin/dashboard/enrollments', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    { label: 'Certificates', icon: Award, href: '/admin/dashboard/certificates', color: 'text-teal-500', bg: 'bg-teal-500/10' },
                                    { label: 'Support', icon: MessageSquare, href: '/admin/dashboard/support', color: 'text-red-500', bg: 'bg-red-500/10' },
                                    { label: 'Payments', icon: CreditCard, href: '/admin/dashboard/payments', color: 'text-green-500', bg: 'bg-green-500/10' },
                                    { label: 'Sessions', icon: Video, href: '/admin/dashboard/sessions', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                                    { label: 'AI Settings', icon: ShieldCheck, href: '/admin/dashboard/ai-settings', color: 'text-primary', bg: 'bg-primary/10' },
                                ].map((q, i) => {
                                    const QIcon = q.icon;
                                    return (
                                        <Link key={i} href={q.href}
                                            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-center group"
                                        >
                                            <div className={`p-2 rounded-lg ${q.bg}`}>
                                                <QIcon className={`h-4 w-4 ${q.color}`} />
                                            </div>
                                            <span className="text-xs font-medium leading-tight">{q.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Admin Activity */}
                        <div className="bg-card border rounded-xl overflow-hidden">
                            <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</span>
                                </div>
                                {statsLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                            </div>
                            <div className="divide-y">
                                {recentActions.length === 0 && !statsLoading && (
                                    <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                                        No recent admin actions logged.
                                    </div>
                                )}
                                {statsLoading && (
                                    <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                                        Loading activity...
                                    </div>
                                )}
                                {recentActions.map(action => {
                                    const diff = Date.now() - action.timestamp.getTime();
                                    const mins = Math.floor(diff / 60000);
                                    const hours = Math.floor(diff / 3600000);
                                    const days = Math.floor(diff / 86400000);
                                    const ago = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : 'Just now';

                                    const typeIcon = action.type === 'essay_credits' ? Gift :
                                        action.type === 'enrollment' ? UserCheck :
                                        action.type === 'certificate' ? Award :
                                        action.type === 'user' ? UserCog : Activity;
                                    const TypeIcon = typeIcon;

                                    return (
                                        <div key={action.id} className="px-5 py-3 flex items-start gap-3">
                                            <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                                                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium leading-tight truncate">{action.description}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {ago}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="bg-card border rounded-xl p-5 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                <Settings className="h-4 w-4" /> System
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Signed in as</span>
                                    <span className="font-medium truncate max-w-[140px]">{currentUser?.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Role</span>
                                    <Badge className={`text-xs px-2 py-0.5 capitalize ${roleBadgeClass}`}>{currentUserRole}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">UID</span>
                                    <span className="font-mono text-muted-foreground text-[10px] truncate max-w-[120px]">{currentUser?.uid}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Session</span>
                                    <span className="flex items-center gap-1 text-green-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span>
                                        Active
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <Link href="/">
                                    <Button variant="outline" size="sm" className="w-full text-xs flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5" /> View Public Website
                                    </Button>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
