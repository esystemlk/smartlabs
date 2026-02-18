'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Target, Globe, Zap, Sparkles, Book, Video, Phone, ArrowRight, Search } from "lucide-react";
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
  HelpCircle,
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


const courses = [
  {
    name: "PTE Academic",
    href: "/pte",
    description: "AI-powered scoring & expert strategies.",
    icon: Target,
    color: "text-accent-1",
    bgColor: "bg-accent-1/10",
    hoverBorder: "hover:border-accent-1/50"
  },
  {
    name: "IELTS Mastery",
    href: "/ielts",
    description: "Band 8.5+ strategies and mocks.",
    icon: Globe,
    color: "text-accent-2",
    bgColor: "bg-accent-2/10",
    hoverBorder: "hover:border-accent-2/50"
  },
  {
    name: "CELPIP Training",
    href: "/celpip",
    description: "Get CLB 9+ for Canadian PR.",
    icon: Zap,
    color: "text-accent-4",
    bgColor: "bg-accent-4/10",
    hoverBorder: "hover:border-accent-4/50"
  },
];

const featured = [
  {
    name: "LMS Portal",
    href: LMS_URL,
    icon: LayoutDashboard,
    description: "Access your coursework & grades.",
    external: true
  },
  {
    name: "Windows Desktop App",
    href: "/download/windows",
    icon: ZapIcon,
    description: "Get the full PC experience.",
    isDownload: true
  }
];

const navLinks = [
  { name: "LMS Portal", href: LMS_URL, external: true },
  { name: "Windows App", href: "/download/windows" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Help", href: "/support", icon: HelpCircle },
];

// Mock notifications moved to Firebase service


export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const { notifications, loading: notifsLoading } = useNotifications();

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const [isElectron, setIsElectron] = useState(false);
  const [isMac, setIsMac] = useState(false);

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

  const isSpecialLayout = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/welcome' || pathname.startsWith('/payment');

  if (isSpecialLayout) {
    return null;
  }

  const isDesktopClient = isElectron && !isMac;

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/10 transition-all duration-500",
        isDesktopClient ? "top-8" : "top-0"
      )}
    >
      {/* Announcement Bar */}
      <AnimatePresence>
        {!announcementDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="hidden sm:block relative bg-gradient-to-r from-primary to-accent-3 py-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/[0.1] -z-10" />
            <div className="mx-auto max-w-7xl px-4 flex items-center justify-center gap-4 text-[10px] sm:text-xs">
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white font-black uppercase py-0 px-2 h-5 rounded-md animate-pulse">Flash Deal</Badge>
              <p className="font-bold text-white tracking-wide">Get <span className="underline decoration-white/50 underline-offset-4 decoration-2">20% OFF</span> all PTE Mock Test bundles this weekend. Use code: <span className="font-black text-white/90">LUCKY2026</span></p>
              <button
                onClick={() => setAnnouncementDismissed(true)}
                className="absolute right-4 p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src="/logo.png"
              alt="Smart Labs Logo"
              width={180}
              height={64}
              className="relative z-10 transition-transform group-hover:scale-105 h-auto w-auto max-h-[64px]"
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
                    className="absolute top-full left-0 mt-3 w-[580px] bg-card/95 backdrop-blur-3xl border border-border/50 rounded-[28px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.15)] grid grid-cols-2 gap-8"
                  >
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Available Programs</h3>
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <Link
                            key={course.href}
                            href={course.href}
                            className={cn(
                              "group block p-4 rounded-2xl border border-transparent transition-all",
                              course.hoverBorder,
                              pathname === course.href ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", course.bgColor, course.color)}>
                                <course.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-sm text-foreground flex items-center gap-1">
                                  {course.name}
                                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium leading-tight mt-0.5">{course.description}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 border-l pl-8 border-border/50">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Featured Resources</h3>
                      <div className="space-y-3">
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
                      </div>

                      <div className="mt-8 pt-6 border-t border-border/50">
                        <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-2xl border border-primary/10 group/download">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Available for Windows</p>
                          <p className="text-xs font-bold mt-1 leading-tight">Install Smart Labs Desktop</p>
                          <Link href="/download/windows" className="text-[10px] font-black text-primary flex items-center mt-3 bg-primary/10 px-3 py-1.5 rounded-lg w-fit hover:bg-primary hover:text-white transition-all">
                            DOWNLOAD PC APP <ArrowRight className="h-3 w-3 ml-1 group-hover/download:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mounted && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                  pathname === link.href
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA & Search */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="flex items-center gap-6 px-4 py-2 bg-muted/30 border border-border/50 rounded-xl text-xs text-muted-foreground hover:border-primary/30 hover:bg-background transition-all group"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                <span className="hidden xl:inline">Search Matrix...</span>
              </div>
              <div className="flex items-center gap-1 font-sans opacity-40 text-[10px]">
                <span className="text-[8px] border border-border rounded px-1 group-hover:border-primary group-hover:text-primary transition-colors">⌘</span>
                <span className="text-[8px] border border-border rounded px-1 group-hover:border-primary group-hover:text-primary transition-colors">K</span>
              </div>
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
                  <Link href="/notifications" className="text-[10px] font-black text-primary hover:tracking-widest transition-all uppercase">View Matrix Logs <ArrowRight className="h-2.5 w-2.5 inline-block ml-1" /></Link>
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
                        <span className="text-sm font-bold tracking-tight">Access Lab Matrix</span>
                        <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="p-3 rounded-2xl cursor-pointer group focus:bg-muted mb-1 transition-all">
                      <Link href="/settings" className="flex items-center gap-3 w-full">
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
                  <Link href={LMS_URL} target="_blank" rel="noopener noreferrer">Log In</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href={LMS_URL} target="_blank" rel="noopener noreferrer">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background shadow-lg border-t"
          >
            <div className="p-4 space-y-2">
              <div className="pb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">Courses</p>
                {courses.map((course) => (
                  <Link
                    key={course.href}
                    href={course.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    {course.name}
                  </Link>
                ))}
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                >
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
                      <Link href={LMS_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                    </Button>
                    <Button variant="default" className="w-full" asChild>
                      <Link href={LMS_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
