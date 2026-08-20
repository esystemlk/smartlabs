'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Target, Globe, Zap, Sparkles, Book, Video, Phone, ArrowRight, Search, Bot, PenLine, FileText, Headphones, Volume2, Mic, BookOpen, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";
import Image from "next/image";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Bell,
  Settings,
  Trophy,
  TrendingUp,
  Calendar,
  Zap as ZapIcon,
  MessageCircle,
  Megaphone,
  BellDot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNotifications } from "@/hooks/use-notifications";
import { LMS_URL } from "@/lib/constants";
import { DEV_CONSOLE_PATH } from "@/lib/site-mode";
import { PTE_CATALOG } from "@/lib/pte-catalog";

/** Resolve a catalogue task's destination: live trainer if built, else its practice route. */
const taskHref = (t: { built?: boolean; builtHref?: string; slug: string }) =>
  t.built && t.builtHref ? t.builtHref : `/dashboard/practice/${t.slug}`;


const courses = [
  {
    name: "PTE Academic",
    href: "/pte-registration",
    description: "Pearson Test of English — course plans & batches.",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverBorder: "hover:border-blue-500/50"
  },
  {
    name: "KET Exam",
    href: "/courses",
    description: "Cambridge A2 Key — coming soon.",
    icon: Globe,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/50",
    disabled: true,
  },
  {
    name: "IELTS",
    href: "/courses",
    description: "International English Language Testing System — coming soon.",
    icon: Zap,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    hoverBorder: "hover:border-violet-500/50",
    disabled: true,
  },
  {
    name: "PET Exam",
    href: "/courses",
    description: "Cambridge B1 Preliminary — coming soon.",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    hoverBorder: "hover:border-amber-500/50",
    disabled: true,
  },
];

const featured = [
  {
    name: "Feedback Club",
    href: "/feedback-club",
    icon: MessageCircle,
    description: "Weekly live expert feedback sessions.",
    external: false
  },
  {
    name: "LMS Portal",
    href: LMS_URL,
    icon: LayoutDashboard,
    description: "Access your coursework & grades.",
    external: true
  }
];

// Active PTE AI trainers (each themed to match its own page).
const pteAiTools = [
  {
    name: "Write Essay",
    href: "/ai-essay-practice",
    description: "AI band score, 7-criteria analysis & model essay.",
    icon: PenLine,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    hoverBorder: "hover:border-orange-500/50",
    tag: "AI",
  },
  {
    name: "Summarize Written Text",
    href: "/swt-trainer",
    description: "One-sentence summaries with instant marking.",
    icon: FileText,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    hoverBorder: "hover:border-violet-500/50",
    tag: "AI",
  },
  {
    name: "Summarize Spoken Text",
    href: "/ai-sst-practice",
    description: "Listen to a lecture & summarize — AI scored.",
    icon: Headphones,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/50",
    tag: "New",
  },
  {
    name: "Write From Dictation",
    href: "/ai-wfd-practice",
    description: "Type what you hear — instant word-by-word scoring.",
    icon: Volume2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverBorder: "hover:border-blue-500/50",
    tag: "New",
  },
];

const pteAiQuickLinks = [
  { name: "Register for a Course", href: "/pte-registration", icon: GraduationCap, description: "Join a PTE batch — Boostify, Plus or Pro." },
  { name: "Practice Hub", href: "/dashboard", icon: LayoutDashboard, description: "All 20 PTE question types." },
  { name: "Level Test", href: "/level-test", icon: Target, description: "Find your current band." },
];

// IELTS trainers. Only Writing Task 2 (Essay) is live; the rest are shown but
// disabled until each part is built, so students can see what's coming.
const ieltsTools = [
  {
    name: "Writing Task 2 · Essay",
    href: "/ai-ielts-essay-practice",
    description: "Examiner band scoring on all four criteria.",
    icon: PenLine,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "hover:border-red-500/50",
    tag: "Live",
    active: true,
  },
  {
    name: "Writing Task 1",
    href: "#",
    description: "Academic charts & General letters.",
    icon: FileText,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "",
    tag: "Soon",
    active: false,
  },
  {
    name: "Speaking",
    href: "#",
    description: "Fluency, pronunciation & coherence.",
    icon: Mic,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "",
    tag: "Soon",
    active: false,
  },
  {
    name: "Reading",
    href: "#",
    description: "Skimming, scanning & comprehension.",
    icon: BookOpen,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "",
    tag: "Soon",
    active: false,
  },
  {
    name: "Listening",
    href: "#",
    description: "All four listening sections.",
    icon: Headphones,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "",
    tag: "Soon",
    active: false,
  },
  {
    name: "IELTS Mock Test",
    href: "#",
    description: "Full timed mock, AI scored.",
    icon: Clock,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBorder: "",
    tag: "Soon",
    active: false,
  },
];

const ieltsQuickLinks = [
  { name: "IELTS Essay Trainer", href: "/ai-ielts-essay-practice", icon: PenLine, description: "Score your Task 2 essay now." },
  { name: "Level Test", href: "/level-test", icon: Target, description: "Find your current band." },
];

// Slimmed nav: Courses/Certificate/LMS Portal/Level Test/Help moved out of the
// bar to reduce clutter. They remain reachable from the homepage hero, the
// Courses mega-menu, and the footer (which shows on every public page).
const navLinks = [
  { name: "Home", href: "/" },
];

// Mock notifications moved to Firebase service


export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [pteAiOpen, setPteAiOpen] = useState(false);
  const [ieltsOpen, setIeltsOpen] = useState(false);
  // "Under development" popup for the new PTE practice trainers.
  const [devNotice, setDevNotice] = useState(false);
  const openDevNotice = () => { setPteAiOpen(false); setMobileMenuOpen(false); setDevNotice(true); };
  const [notifsOpen, setNotifsOpen] = useState(false);
  const { notifications, loading: notifsLoading } = useNotifications();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const [isElectron, setIsElectron] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    const runningInElectron = typeof window !== 'undefined' && !!window.electronAPI;
    setIsElectron(runningInElectron);
    if (runningInElectron) {
      const runningOnMac = navigator.userAgent.includes('Mac');
      setIsMac(runningOnMac);
    }

    // Global CMD+K shortcut placeholder
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  // Hidden on app-style pages and on pages that render their own navigation bar
  // (AI trainers) — two stacked fixed navs block each other's taps on mobile.
  const isSpecialLayout = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/welcome' || pathname.startsWith('/payment')
    || pathname.startsWith('/ai-essay-practice') || pathname.startsWith('/ai-sst-practice') || pathname.startsWith('/swt-trainer')
    || pathname.startsWith('/ai-wfd-practice')
    || pathname.startsWith('/mock/') || pathname === '/site-status' || pathname.startsWith(DEV_CONSOLE_PATH);

  if (isSpecialLayout) {
    return null;
  }

  const isDesktopClient = isElectron && !isMac;
  const isHome = pathname === '/';
  const isTransparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-500",
        isDesktopClient ? "top-8" : "top-0",
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/95 backdrop-blur-xl border-b border-border/10 shadow-sm"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src="/logo.png"
              alt="Smart Labs Logo"
              width={180}
              height={64}
              className="relative z-10 transition-transform group-hover:scale-105"
              style={{ width: 'auto', height: 'auto', maxHeight: '64px' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Mega Menu Courses */}
            <div
              className="relative"
              onMouseEnter={() => setCoursesOpen(true)}
              onMouseLeave={() => setCoursesOpen(false)}
            >
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all group",
                coursesOpen ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                Courses
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", coursesOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {coursesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-[720px] bg-card/95 backdrop-blur-3xl border border-border/50 rounded-[28px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.15)]"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Available Programs</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {courses.map((course) => (
                            (course as any).disabled ? (
                              <div key={course.name} aria-disabled="true"
                                className="group block p-3 rounded-2xl border border-transparent opacity-60 cursor-not-allowed select-none">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-xl shrink-0", course.bgColor, course.color)}>
                                    <course.icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                      {course.name}
                                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-black uppercase text-muted-foreground">Soon</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{course.description}</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                            <Link
                              key={course.name}
                              href={course.href}
                              className={cn(
                                "group block p-3 rounded-2xl border border-transparent transition-all",
                                course.hoverBorder,
                                "hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110", course.bgColor, course.color)}>
                                  <course.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-foreground flex items-center gap-1">
                                    {course.name}
                                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{course.description}</div>
                                </div>
                              </div>
                            </Link>
                            )
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 border-l pl-6 border-border/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Links</h3>
                        <div className="space-y-2">
                          {featured.map((item) => (
                            <Link key={item.name} href={item.href} className="group block p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-xs">{item.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{item.description}</div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          <Link href="/dashboard/certificate-request" className="group block p-3 rounded-2xl hover:bg-amber-500/5 transition-colors border border-transparent hover:border-amber-500/20">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <Sparkles className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-amber-600">Get Certificate</div>
                                <div className="text-[10px] text-muted-foreground">Request your training certificate</div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mega Menu — PTE AI */}
            <div
              className="relative"
              onMouseEnter={() => setPteAiOpen(true)}
              onMouseLeave={() => setPteAiOpen(false)}
            >
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all group",
                pteAiOpen ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <Bot className="h-4 w-4" />
                PTE
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", pteAiOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {pteAiOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[900px] max-w-[94vw] font-display-serif bg-card/95 backdrop-blur-3xl border border-border/50 rounded-[28px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.15)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">PTE Academic / UKVI</span>
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="font-black uppercase text-primary">AI</span> = AI-scored</span>
                        <Link href="/pte-registration" className="text-primary hover:underline">Course plans →</Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-x-5 gap-y-1">
                      {PTE_CATALOG.map((section) => (
                        <div key={section.id}>
                          <h3 className="mb-2 border-b border-border/60 pb-1.5 font-display-serif text-base font-black">{section.label}</h3>
                          <ul className="space-y-0.5">
                            {section.tasks.map((t) => {
                              const rowCls = "group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60";
                              const inner = (
                                <>
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    {t.isNew && <span className="rounded-full bg-primary px-1.5 py-[1px] text-[8px] font-bold uppercase text-primary-foreground shrink-0">New</span>}
                                    <span className="truncate text-[13px] leading-tight text-foreground/85 group-hover:text-foreground">{t.label}</span>
                                    {!t.built && (
                                      <span className="relative flex h-1.5 w-1.5 shrink-0" title="Coming soon">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                                      </span>
                                    )}
                                    {t.scoring === 'ai' && <span className="text-[8px] font-black uppercase text-primary shrink-0">AI</span>}
                                  </span>
                                  <span className="shrink-0 text-[11px] font-semibold text-primary/80">{t.weight}</span>
                                </>
                              );
                              return (
                                <li key={t.taskType}>
                                  {t.builtHref
                                    ? <Link href={t.builtHref} className={rowCls}>{inner}</Link>
                                    : <button type="button" onClick={openDevNotice} className={rowCls}>{inner}</button>}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mega Menu — IELTS */}
            <div
              className="relative"
              onMouseEnter={() => setIeltsOpen(true)}
              onMouseLeave={() => setIeltsOpen(false)}
            >
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all group",
                ieltsOpen ? "text-red-600 bg-red-500/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <GraduationCap className="h-4 w-4" />
                IELTS
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", ieltsOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {ieltsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-[680px] bg-card/95 backdrop-blur-3xl border border-border/50 rounded-[28px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.15)]"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">AI Practice & Scoring</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {ieltsTools.map((tool) => {
                            const inner = (
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl shrink-0 transition-transform", tool.bgColor, tool.color, tool.active && "group-hover:scale-110")}>
                                  <tool.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                    {tool.name}
                                    <span className={cn(
                                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full",
                                      tool.active ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                                    )}>{tool.tag}</span>
                                    {tool.active && <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{tool.description}</div>
                                </div>
                              </div>
                            );
                            return tool.active ? (
                              <Link
                                key={tool.name}
                                href={tool.href}
                                className={cn("group block p-3 rounded-2xl border border-transparent transition-all hover:bg-muted/50", tool.hoverBorder)}
                              >
                                {inner}
                              </Link>
                            ) : (
                              <div
                                key={tool.name}
                                aria-disabled="true"
                                title="Coming soon"
                                className="group block p-3 rounded-2xl border border-transparent opacity-50 cursor-not-allowed select-none"
                              >
                                {inner}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3 border-l pl-6 border-border/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Links</h3>
                        <div className="space-y-2">
                          {ieltsQuickLinks.map((item) => (
                            <Link key={item.name} href={item.href} className="group block p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-xs">{item.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{item.description}</div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mounted && (
              <>
                {user && (
                  <Link
                    href="/dashboard"
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                      pathname === "/dashboard"
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                {navLinks.map((link: any) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                      pathname === link.href
                        ? "text-primary bg-primary/5"
                        : link.highlight
                          ? "text-primary hover:bg-primary/10 bg-primary/5 border border-primary/20 shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.highlight && <Sparkles className="h-3.5 w-3.5 animate-pulse" />}
                    {link.name}
                    {link.highlight && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* CTA & Actions */}
          <div className="hidden lg:flex items-center gap-4">

            {/* Search */}
            <button
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              aria-label="Search the site"
              className="flex items-center gap-2 h-10 pl-3 pr-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs font-semibold">Search</span>
              <kbd className="ml-1 hidden xl:inline-flex items-center rounded-md bg-background border border-border px-1.5 py-0.5 text-[9px] font-black text-muted-foreground">Ctrl K</kbd>
            </button>

            {/* Notifications */}
            <DropdownMenu onOpenChange={setNotifsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/5 group">
                  <Bell className={cn("h-5 w-5 transition-transform group-hover:rotate-12", notifsOpen && "text-primary")} />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[380px] p-0 rounded-[28px] overflow-hidden border-border/50 shadow-2xl" align="end">
                <div className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex items-center justify-between border-b border-border/50">
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      Alert Center
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">You have 3 unread updates today.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-primary tracking-widest px-2 h-7 hover:bg-primary/10">Mark All Seen</Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="p-4 mx-2 rounded-2xl cursor-pointer hover:bg-muted/50 focus:bg-muted/50 border-transparent border transition-all active:scale-[0.98] mb-1">
                        <div className="flex gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                            n.type === 'success' ? "bg-accent-1/10 text-accent-1" :
                              n.type === 'warning' ? "bg-accent-3/10 text-accent-3" :
                                "bg-accent-2/10 text-accent-2"
                          )}>
                            {n.type === 'success' ? <Sparkles className="h-5 w-5" /> :
                              n.type === 'warning' ? <BellDot className="h-5 w-5" /> :
                                <Megaphone className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs">{n.title}</span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-muted-foreground italic">No new notifications</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/30 text-center border-t border-border/50">
                  <Link href="/dashboard" className="text-[10px] font-black text-primary hover:tracking-widest transition-all uppercase">Go to Dashboard <ArrowRight className="h-2.5 w-2.5 inline-block ml-1" /></Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-2xl hover:bg-primary/10 transition-colors p-0 border border-border/50 overflow-hidden">
                    <Avatar className="h-11 w-11 rounded-2xl">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                      <AvatarFallback className="rounded-2xl">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] p-0 rounded-[32px] overflow-hidden border-border/50 shadow-2xl" align="end">
                  <div className="p-6 bg-gradient-to-br from-primary via-accent-3 to-accent-1 relative text-white">
                    <div className="absolute top-4 right-4 h-12 w-12 bg-white/20 blur-2xl rounded-full" />
                    <div className="flex flex-col space-y-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-xl bg-white/20 border border-white/30">
                          <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarFallback className="bg-transparent text-white font-black">{user.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="text-sm font-black leading-none tracking-tight">{user.displayName || 'Learner'}</p>
                          <p className="text-[10px] text-white/70 font-bold mt-1 tracking-wide">{user.email}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Skill Mastery</span>
                          <span className="text-[10px] font-black">74%</span>
                        </div>
                        <Progress value={74} className="h-1.5 bg-white/20" indicatorClassName="bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/10 grid grid-cols-2 gap-2 border-b border-border/50">
                    <div className="p-3 bg-background border border-border/50 rounded-2xl text-center flex flex-col items-center group cursor-pointer hover:border-primary/30 transition-colors">
                      <TrendingUp className="h-4 w-4 text-primary mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Day Streak</span>
                      <span className="text-xs font-black">12 Days</span>
                    </div>
                    <div className="p-3 bg-background border border-border/50 rounded-2xl text-center flex flex-col items-center group cursor-pointer hover:border-accent-1/30 transition-colors">
                      <Trophy className="h-4 w-4 text-accent-1 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Avg Score</span>
                      <span className="text-xs font-black">7.5 Band</span>
                    </div>
                  </div>

                  <div className="p-2">
                    <DropdownMenuItem asChild className="p-3 rounded-2xl cursor-pointer group focus:bg-primary focus:text-white mb-1 transition-all">
                      <Link href="/dashboard" className="flex items-center gap-3 w-full">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center group-focus:bg-white/20 transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-primary group-focus:text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Dashboard</span>
                        <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="p-3 rounded-2xl cursor-pointer group focus:bg-muted mb-1 transition-all">
                      <Link href="/dashboard/settings" className="flex items-center gap-3 w-full">
                        <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center transition-colors">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">System Config</span>
                      </Link>
                    </DropdownMenuItem>

                    <div className="h-px bg-border/50 my-1 mx-2" />

                    <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-2xl cursor-pointer group focus:bg-destructive focus:text-destructive-foreground transition-all">
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center transition-colors group-focus:bg-white/20">
                          <LogOut className="h-4 w-4 text-destructive group-focus:text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Secure Shutdown</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: Search + Menu Buttons */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              aria-label="Search the site"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background shadow-lg border-t max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain"
          >
            <div className="p-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="pb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">Courses</p>
                {courses.map((course) => (
                  (course as any).disabled ? (
                    <div key={course.name} aria-disabled="true"
                      className="flex items-center justify-between px-4 py-2 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed select-none">
                      {course.name}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-black uppercase">Soon</span>
                    </div>
                  ) : (
                    <Link
                      key={course.name}
                      href={course.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                      {course.name}
                    </Link>
                  )
                ))}
              </div>

              <div className="pb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">PTE Practice</p>
                {PTE_CATALOG.map((section) => (
                  <details key={section.id} className="group px-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-2 hover:bg-muted">
                      <span className="text-sm font-bold">{section.label}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-1">
                      {section.tasks.map((t) => {
                        const rowCls = "flex w-full items-center justify-between gap-2 rounded-lg py-2 pl-6 pr-3 text-left text-foreground hover:bg-muted";
                        const inner = (
                          <>
                            <span className="flex items-center gap-1.5 text-sm">
                              {t.isNew && <span className="rounded-full bg-primary px-1.5 py-[1px] text-[8px] font-bold uppercase text-primary-foreground">New</span>}
                              {t.label}
                              {!t.built && (
                                <span className="relative flex h-1.5 w-1.5" title="Coming soon">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                                </span>
                              )}
                              {t.scoring === 'ai' && <span className="text-[8px] font-black uppercase text-primary">AI</span>}
                            </span>
                            <span className="text-[11px] font-semibold text-primary/80">{t.weight}</span>
                          </>
                        );
                        return t.builtHref ? (
                          <Link key={t.taskType} href={t.builtHref} onClick={() => setMobileMenuOpen(false)} className={rowCls}>{inner}</Link>
                        ) : (
                          <button key={t.taskType} type="button" onClick={openDevNotice} className={rowCls}>{inner}</button>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>

              <div className="pb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">IELTS Practice</p>
                {ieltsTools.map((tool) =>
                  tool.active ? (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                      <span className={cn("p-1.5 rounded-lg", tool.bgColor, tool.color)}><tool.icon className="h-3.5 w-3.5" /></span>
                      {tool.name}
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ml-auto bg-red-500/10 text-red-500">{tool.tag}</span>
                    </Link>
                  ) : (
                    <div
                      key={tool.name}
                      aria-disabled="true"
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground opacity-50 cursor-not-allowed select-none"
                    >
                      <span className={cn("p-1.5 rounded-lg", tool.bgColor, tool.color)}><tool.icon className="h-3.5 w-3.5" /></span>
                      {tool.name}
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ml-auto bg-muted text-muted-foreground">{tool.tag}</span>
                    </div>
                  )
                )}
              </div>

              {navLinks.map((link: any) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl transition-all",
                    link.highlight
                      ? "bg-primary/10 text-primary font-bold border border-primary/20"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.highlight && <Sparkles className="h-4 w-4" />}
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="default" className="w-full" asChild>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={async () => {
                      await handleLogout();
                      setMobileMenuOpen(false);
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                    </Button>
                    <Button variant="default" className="w-full" asChild>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Under development" notice for the new PTE practice trainers */}
      {devNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setDevNotice(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold">We&rsquo;re polishing this feature</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This practice section is currently being developed for better accuracy and a better experience.
              Keep in touch with us for more — it&rsquo;s coming soon!
            </p>
            <button
              onClick={() => setDevNotice(false)}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
