'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useUserActivity } from '@/hooks/use-user-activity';
import { doc, getDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { MoodPrompt } from '@/components/dashboard/MoodPrompt';
import { MoodBadge } from '@/components/dashboard/MoodBadge';
import { getUserMood, setUserMood, isMoodSetToday } from '@/lib/services/mood.service';
import Link from 'next/link';
import {
  Microphone,
  PencilSimple,
  BookOpen,
  Headphones,
  Lightning,
  Target,
  Briefcase,
  CaretRight,
  Fire,
  Star,
  ArrowRight,
  ArrowLeft,
  House,
  ChatCircleDots,
  GraduationCap,
  Globe,
  CalendarBlank,
} from '@phosphor-icons/react';

// ─── PTE Section Data ────────────────────────────────────────────────────────

const pteSections = [
  {
    id: 'speaking',
    disabled: true,
    title: 'Speaking',
    icon: Microphone,
    description: 'Pronunciation, fluency & oral communication',
    gradient: 'from-blue-600 to-blue-400',
    lightBg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-500/40',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    tasks: [
      { title: 'Read Aloud', href: '/dashboard/practice-tests/pte-speaking-read-aloud', ai: true, hot: true },
      { title: 'Repeat Sentence', href: '/dashboard/practice-tests/pte-speaking-repeat-sentence', ai: true, hot: true },
      { title: 'Describe Image', href: '/dashboard/practice-tests/pte-speaking-describe-image', ai: true, hot: false },
      { title: 'Re-tell Lecture', href: '/dashboard/practice-tests/pte-speaking-retell-lecture', ai: true, hot: false },
      { title: 'Answer Short Question', href: '/dashboard/practice-tests/pte-speaking-answer-short-question', ai: true, hot: false },
    ],
    sectionHref: '/dashboard/ai-score-test/speaking',
  },
  {
    id: 'writing',
    disabled: false,
    title: 'Writing',
    icon: PencilSimple,
    description: 'Essay writing & summarization skills',
    gradient: 'from-violet-600 to-purple-400',
    lightBg: 'bg-violet-500/5',
    border: 'border-violet-500/20',
    hoverBorder: 'hover:border-violet-500/40',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
    badgeClass: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    tasks: [
      { title: 'Write Essay', href: '/ai-essay-practice', ai: true, hot: true, featured: true },
      { title: 'Summarize Written Text', href: '/swt-trainer', ai: true, hot: true },
    ],
    sectionHref: '/dashboard/ai-score-test/writing',
  },
  {
    id: 'reading',
    disabled: true,
    title: 'Reading',
    icon: BookOpen,
    description: 'Comprehension, vocabulary & analysis',
    gradient: 'from-emerald-600 to-green-400',
    lightBg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/40',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    tasks: [
      { title: 'R&W Fill in the Blanks', href: '/dashboard/practice-tests/pte-reading-fill-in-blanks-dropdown', ai: false, hot: true },
      { title: 'MCQ Multiple Answer', href: '/dashboard/practice-tests/pte-reading-multiple-choice-multiple-answer', ai: false, hot: false },
      { title: 'Re-order Paragraphs', href: '/dashboard/practice-tests/pte-reading-reorder-paragraphs', ai: false, hot: false },
      { title: 'Fill in the Blanks', href: '/dashboard/practice-tests/pte-reading-fill-in-blanks-drag-drop', ai: false, hot: false },
      { title: 'MCQ Single Answer', href: '/dashboard/practice-tests/pte-reading-test', ai: true, hot: false },
    ],
    sectionHref: '/dashboard/ai-score-test/reading',
  },
  {
    id: 'listening',
    disabled: true,
    title: 'Listening',
    icon: Headphones,
    description: 'Audio comprehension & dictation accuracy',
    gradient: 'from-orange-600 to-amber-400',
    lightBg: 'bg-orange-500/5',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-500/40',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    tasks: [
      { title: 'Write from Dictation', href: '/ai-wfd-practice', ai: true, hot: true, featured: true, enabled: true },
      { title: 'Summarize Spoken Text', href: '/ai-sst-practice', ai: true, hot: true, featured: true, enabled: true },
      { title: 'MCQ Multiple Answer', href: '/dashboard/practice-tests/pte-listening-multiple-choice-multiple-answer', ai: false, hot: false },
      { title: 'Fill in the Blanks', href: '/dashboard/practice-tests/pte-listening-fill-in-blanks', ai: false, hot: false },
      { title: 'Highlight Correct Summary', href: '/dashboard/practice-tests/pte-listening-highlight-correct-summary', ai: false, hot: false },
      { title: 'MCQ Single Answer', href: '/dashboard/practice-tests/pte-listening-multiple-choice-single-answer', ai: false, hot: false },
      { title: 'Select Missing Word', href: '/dashboard/practice-tests/pte-listening-select-missing-word', ai: false, hot: false },
      { title: 'Highlight Incorrect Words', href: '/dashboard/practice-tests/pte-listening-highlight-incorrect-words', ai: false, hot: false },
    ],
    sectionHref: '/dashboard/ai-score-test/listening',
  },
];

// ─── Feature Spotlight Cards ──────────────────────────────────────────────────

const featureCards = [
  {
    title: 'AI Essay Scorer',
    subtitle: 'Write Essay · Full AI Analysis',
    description: 'Get instant band scores, 7-criteria breakdown, model essay, and target score analysis.',
    href: '/ai-essay-practice',
    icon: PencilSimple,
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    badge: 'Most Advanced',
    badgeColor: 'bg-white/20 text-white',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function calculateStudyStreak(activities: any[]) {
  if (!activities || activities.length === 0) return 0;
  const sorted = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  let streak = 0;
  let lastDate: Date | null = null;
  for (const activity of sorted) {
    const cur = new Date(activity.timestamp);
    cur.setHours(0, 0, 0, 0);
    if (!lastDate) {
      streak = 1;
    } else {
      const diff = Math.ceil(Math.abs(cur.getTime() - lastDate.getTime()) / 86400000);
      if (diff === 1) streak++;
      else if (diff > 1) break;
    }
    lastDate = cur;
  }
  return streak;
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: (typeof pteSections)[0]; index: number }) {
  const Icon = section.icon;
  const disabled = !!section.disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
        disabled
          ? 'border-slate-200 bg-slate-50/60'
          : `${section.border} ${section.lightBg} ${section.hoverBorder}`
      }`}
    >
      {/* Section Header */}
      <div className={`p-5 flex items-center justify-between ${disabled ? 'bg-gradient-to-r from-slate-400 to-slate-300' : `bg-gradient-to-r ${section.gradient}`}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon weight="bold" className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-black text-base">{section.title}</h3>
            <p className="text-white/70 text-[11px] font-medium">{section.tasks.length} practice tasks</p>
          </div>
        </div>
        {disabled ? (
          <span className="text-[10px] font-black uppercase tracking-wider text-white bg-white/25 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        ) : (
          <Button asChild size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl text-xs font-bold h-8 px-3">
            <Link href={section.sectionHref}>
              View All <CaretRight weight="bold" className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      {/* Task List */}
      <div className="p-3 space-y-1">
        {section.tasks.map((task, i) => {
          // A task can be individually enabled even inside a "Coming Soon" section.
          const taskEnabled = !disabled || (task as { enabled?: boolean }).enabled === true;
          const dim = !taskEnabled;
          const inner = (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${dim ? 'opacity-50' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}>
              <div className={`w-2 h-2 rounded-full ${task.hot && !dim ? 'bg-primary/60' : 'bg-muted-foreground/20'} shrink-0`} />
              <span className="text-sm font-semibold flex-1 text-foreground/80 group-hover/task:text-foreground transition-colors">
                {task.title}
              </span>
              <div className="flex items-center gap-1.5">
                {task.featured && !dim && (
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20 font-black">
                    🔥 Top
                  </Badge>
                )}
                {task.ai && (
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 ${dim ? 'bg-slate-200 text-slate-500 border-slate-300' : section.badgeClass} font-black border`}>
                    AI
                  </Badge>
                )}
                {!dim && (
                  <CaretRight weight="bold" className="h-3 w-3 text-muted-foreground/40 group-hover/task:text-muted-foreground transition-colors" />
                )}
              </div>
            </div>
          );
          return taskEnabled ? (
            <Link key={i} href={task.href} className="block group/task">{inner}</Link>
          ) : (
            <div key={i} className="block cursor-not-allowed select-none">{inner}</div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pb-4">
        {disabled ? (
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400 cursor-not-allowed select-none">
            Coming Soon
          </div>
        ) : (
          <Link href={section.sectionHref} className="block">
            <div className={`flex items-center justify-center gap-2 py-2 rounded-xl border-2 ${section.border} ${section.hoverBorder} text-xs font-black uppercase tracking-wider ${section.iconColor} transition-all hover:bg-white/50 dark:hover:bg-white/5`}>
              Practice {section.title} <ArrowRight weight="bold" className="h-3 w-3" />
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [moodPromptOpen, setMoodPromptOpen] = useState(false);

  const enrollmentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);
  const { activities: userActivities, loading: userActivitiesLoading } = useUserActivity(user?.uid);

  const studyStreak = useMemo(() => calculateStudyStreak(userActivities), [userActivities]);

  const todayCount = useMemo(() => {
    if (!userActivities) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return userActivities.filter((a: any) => {
      const d = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return d >= today;
    }).length;
  }, [userActivities]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    } else if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          if (userData.role === 'user' && !userData.hasCompletedOnboarding) {
            router.push('/welcome');
          }
        } else {
          router.push('/login');
        }
      });
    }
  }, [user, isUserLoading, router, firestore]);

  // Load today's mood; prompt the first time they arrive on a given day.
  useEffect(() => {
    if (!user) return;
    let active = true;
    getUserMood(user.uid)
      .then(m => {
        if (!active) return;
        setMood(m?.value ?? null);
        if (!isMoodSetToday(m)) {
          setTimeout(() => { if (active) setMoodPromptOpen(true); }, 700);
        }
      })
      .catch(() => { if (active) setMood(null); });
    return () => { active = false; };
  }, [user]);

  const handlePickMood = async (m: string) => {
    setMood(m);
    setMoodPromptOpen(false);
    if (user) { try { await setUserMood(user.uid, m); } catch { /* ignore */ } }
  };

  const handleDismissMood = async () => {
    setMoodPromptOpen(false);
    // Remember they were asked today so we don't re-prompt on every page load.
    if (user) { try { await setUserMood(user.uid, 'skipped'); } catch { /* ignore */ } }
  };

  const isLoading = isUserLoading || enrollmentsLoading || !userRole || userActivitiesLoading;
  const isAdminOrDev = userRole === 'admin' || userRole === 'developer' || userRole === 'teacher';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Daily mood prompt (first arrival of the day) */}
      <MoodPrompt open={moodPromptOpen} onPick={handlePickMood} onDismiss={handleDismissMood} />

      {/* ─── Back to Home ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group"
        >
          <ArrowLeft weight="bold" className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <House weight="bold" className="h-4 w-4" />
          Back to Home
        </Link>
      </motion.div>

      {/* ─── Welcome Hero ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6 sm:p-8"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left — Greeting */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 mb-3">
              <Lightning weight="fill" className="h-3 w-3 text-yellow-400" />
              AI-Powered PTE Practice
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              {getGreeting()},<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                {user?.displayName?.split(' ')[0] || 'Student'}!
              </span>
            </h1>
            <p className="text-white/50 text-sm font-medium mt-2">
              Ready to improve your PTE score today? Let's practice.
            </p>
            {mood && <div className="mt-3"><MoodBadge mood={mood} /></div>}
          </div>

          {/* Right — Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[90px]">
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                {studyStreak}
                <Fire weight="fill" className="h-5 w-5 text-orange-400" />
              </div>
              <div className="text-[10px] font-bold uppercase text-white/50 tracking-widest mt-0.5">Day Streak</div>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[90px]">
              <div className="text-2xl font-black text-white">{todayCount}</div>
              <div className="text-[10px] font-bold uppercase text-white/50 tracking-widest mt-0.5">Today</div>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[90px]">
              <div className="text-2xl font-black text-white">{userActivities?.length || 0}</div>
              <div className="text-[10px] font-bold uppercase text-white/50 tracking-widest mt-0.5">Total Practice</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Admin Panel Banner ─────────────────────────────────────────────── */}
      {isAdminOrDev && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase weight="bold" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black">Admin Access Unlocked</p>
              <p className="text-xs text-muted-foreground font-medium">Your account has administrative privileges.</p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl font-bold shrink-0">
            <Link href="/admin/dashboard">Admin Panel <CaretRight weight="bold" className="ml-1 h-3 w-3" /></Link>
          </Button>
        </motion.div>
      )}

      {/* ─── Practice Hub ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Target weight="bold" className="h-5 w-5 text-primary" />
              PTE Practice Hub
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              All 20 PTE question types — organised by section
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {pteSections.map((section, i) => (
            <SectionCard key={section.id} section={section} index={i} />
          ))}
        </div>
      </div>

      {/* ─── Feature Spotlight ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2 mb-5">
          <Star weight="fill" className="h-5 w-5 text-amber-500" />
          AI Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featureCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Link href={card.href} className="block group">
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 h-full min-h-[180px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                    {/* Glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Icon weight="bold" className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="text-white font-black text-lg leading-tight">{card.title}</h3>
                      <p className="text-white/60 text-[11px] font-semibold mt-0.5">{card.subtitle}</p>
                    </div>

                    <div className="relative z-10 mt-4">
                      <p className="text-white/70 text-xs font-medium leading-relaxed mb-3">{card.description}</p>
                      <div className="flex items-center gap-1.5 text-white text-xs font-black group-hover:gap-2.5 transition-all">
                        Start Practicing <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── More Tools Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
        {[
          { title: 'My Certificate', href: '/dashboard/certificate-request', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { title: 'Live Workshops', href: '/workshops', icon: CalendarBlank, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { title: 'Support Chat', href: '/dashboard/support', icon: ChatCircleDots, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { title: 'Main Website', href: '/', icon: Globe, color: 'text-gray-500', bg: 'bg-gray-500/10' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} href={item.href} className="block group">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-border bg-card/40 hover:bg-card transition-all duration-200">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon weight="bold" className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {item.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
