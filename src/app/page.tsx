'use client';
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import {
  RefreshCw,
  RefreshCcw,
  Lightbulb,
  Scan,
  Cpu,
  Trophy,
  Activity,
  Microscope,
  Database,
  Terminal,
  Code2,
  Map,
  Search,
  Book,
  Feather,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  Target,
  Zap,
  Globe,
  Palette,
  User,
  Briefcase,
  GraduationCap,
  Brain,
  Video,
  Users,
  Clock,
  MessageSquare,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  BarChart3,
  Flag,
  Monitor,
  Laptop,
  Bell,
  Calendar,
  Quote,
  Layout,
  Check,
  X,
  HelpCircle,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/** Where each exam's "Find Our Courses" entry points. PTE → the new
 * registration page; IELTS/KET/PET → /courses (has the IELTS plans + packages). */
const COURSE_LINKS: { name: string; href: string; blurb: string }[] = [
  { name: 'PTE Academic', href: '/pte-registration', blurb: 'Boostify course plans & batches' },
  { name: 'IELTS', href: '/courses', blurb: 'IELTS plans & packages' },
  { name: 'KET', href: '/courses', blurb: 'Cambridge A2 Key' },
  { name: 'PET', href: '/courses', blurb: 'Cambridge B1 Preliminary' },
];

function FindCoursesButton({ className, size = 'xl' as const }: { className?: string; size?: 'xl' | 'lg' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant="outline" className={className}>
          <Sparkles className="mr-2.5 h-5 w-5" />
          Find Our Courses
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {COURSE_LINKS.map(c => (
          <DropdownMenuItem key={c.name} asChild className="cursor-pointer py-2.5">
            <Link href={c.href}>
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.blurb}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedCheckmark } from "@/components/ui/animated-checkmark";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { scorePteWriteEssay } from '@/ai/flows/score-pte-writing-write-essay';
import type { PteWriteEssayOutput } from '@/ai/flows/pte-writing.types';
import { useToast } from "@/hooks/use-toast";
import { useSiteStats } from "@/hooks/use-site-stats";
import { logTestCompletion } from "@/lib/services/activity.service";
import dynamic from "next/dynamic";

// Below-the-fold / non-critical widgets — loaded after hydration to cut
// main-thread work on mobile (Lighthouse TBT/LCP).
const EventPopup = dynamic(() => import("@/components/events/event-popup").then(m => m.EventPopup), { ssr: false });
import { useDelayedPopups } from "@/components/layout/layout-extras";
import { useHomepageCourses, useLearningMethods, useFeatures, useFAQs, useComparisons } from "@/hooks/use-homepage-content";
import { useTestimonials } from "@/hooks/use-testimonials";
const GoogleReviews = dynamic(() => import("@/components/sections/google-reviews").then(m => m.GoogleReviews), { ssr: false });
const GoogleMap = dynamic(() => import("@/components/sections/google-map").then(m => m.GoogleMap), { ssr: false });
const WebinarPoster = dynamic(() => import("@/components/webinar/webinar-poster").then(m => m.WebinarPoster), { ssr: false });
import { testimonials } from "@/lib/constants";
import {
  CalendarBlank as PhCalendar,
  Clock as PhClock,
  ArrowRight as PhArrowRight,
  Sparkle as PhSparkle,
  CaretRight as PhCaretRight
} from "@phosphor-icons/react";




const sampleTopics = [
  "Some people think that technology has made communication easier, while others believe it has made us more isolated. Discuss both views.",
  "Education is the most powerful weapon which you can use to change the world. To what extent do you agree?",
  "Climate change is the biggest threat facing humanity today. What can be done to combat it?",
  "Should university education be free for everyone? Discuss the advantages and disadvantages."
];

type Stat = {
  value?: number;
  valueString?: string;
  suffix: string;
  label: string;
  color: string;
  decimals?: number;
};

const stats: Stat[] = [
  { value: 5000, suffix: "+", label: "Students Trained", color: "text-accent-1" },
  { value: 95, suffix: "%", label: "Success Rate", color: "text-accent-2" },
  { valueString: "6–8", suffix: " Weeks", label: "Target Achievement", color: "text-accent-3" },
  { value: 24, suffix: "/7", label: "AI Support", color: "text-accent-4" },
];

const courses = [
  {
    title: "PTE Academic",
    description: "Master the Pearson Test of English with AI-powered practice and expert strategies.",
    icon: Target,
    href: "/courses",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-500",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    features: ["AI Scoring Practice", "Live Classes", "Full Materials Access", "Mock Tests"],
    badge: "Most Popular",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    title: "KET Exam",
    description: "Cambridge A2 Key — the essential first step in your Cambridge English journey, building core reading, writing, listening and speaking skills.",
    icon: Globe,
    href: "/courses",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-500",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    features: ["Reading & Writing", "Listening Skills", "Speaking Practice", "Cambridge Prep"],
    badge: "Cambridge",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    title: "IELTS",
    description: "International English Language Testing System — the world's most widely accepted English qualification for study, work and migration.",
    icon: Zap,
    href: "/courses",
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-500",
    bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    features: ["Academic & General", "All Four Skills", "Band Score Targeting", "Expert Coaching"],
    badge: "Global",
    badgeColor: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  },
  {
    title: "PET Exam",
    description: "Cambridge B1 Preliminary — a mid-level qualification proving you can communicate in English in everyday situations at work and study.",
    icon: BookOpen,
    href: "/courses",
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-500",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    features: ["Grammar Clinic", "Vocabulary Mastery", "Reading Skills", "Writing Practice"],
    badge: "Cambridge",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
];

const learningMethods = [
  {
    icon: Video,
    title: "Recorded + LMS Package",
    description: "20-hour long class recordings with LMS access for LKR 20,000, valid for 1 month.",
    color: "bg-accent-1/10 text-accent-1",
    gradient: "from-accent-1/20 to-accent-1/5"
  },
  {
    icon: Users,
    title: "Online Group Classes",
    description: "Small focused online groups with 3 to 10 students for better attention and interaction.",
    color: "bg-accent-2/10 text-accent-2",
    gradient: "from-accent-2/20 to-accent-2/5",
    href: "https://register.smartlabs.lk"
  },
  {
    icon: Brain,
    title: "Power Sessions",
    description: "High-impact power sessions for selected PTE components to improve weak areas fast.",
    color: "bg-accent-3/10 text-accent-3",
    gradient: "from-accent-3/20 to-accent-3/5"
  },
  {
    icon: BookOpen,
    title: "Limited Physical Classes",
    description: "Very limited in-person classes with limited seats for students who prefer classroom guidance.",
    color: "bg-accent-4/10 text-accent-4",
    gradient: "from-accent-4/20 to-accent-4/5"
  },
];

const roadmapSteps = [
  {
    id: "01",
    title: "Join & Diagnose",
    desc: "Take our free AI diagnostic test to identify your strengths and weaknesses.",
    link: "/level-test",
    icon: Search,
    color: "text-accent-1",
    bg: "bg-accent-1/10"
  },
  {
    id: "02",
    title: "Personalized Plan",
    desc: "Join our classes for customized study plans to keep you on track. Best for focused attention.",
    link: "/courses",
    icon: Map,
    color: "text-accent-2",
    bg: "bg-accent-2/10"
  },
  {
    id: "03",
    title: "AI-Powered Practice",
    desc: "Master every section with unlimited practice and instant AI feedback with our AI TRAINER.",
    link: "/ai-essay-practice",
    icon: Sparkles,
    color: "text-accent-3",
    bg: "bg-accent-3/10"
  },
  {
    id: "04",
    title: "Target Achieved",
    desc: "Clear the exam with confidence! Check our student feedbacks and success stories.",
    link: "#testimonials",
    icon: Trophy,
    color: "text-accent-4",
    bg: "bg-accent-4/10"
  }
];

const skillModules = [
  {
    icon: Headphones,
    title: "Listening",
    description: "Multi-layered listening exercises designed to mirror real-world accents and exam conditions.",
    color: "text-accent-1"
  },
  {
    icon: MessageSquare,
    title: "Speaking",
    description: "AI-powered pronunciation analysis with real-time feedback on your rhythm and intonation.",
    color: "text-accent-2"
  },
  {
    icon: BookOpen,
    title: "Reading",
    description: "Speed reading strategies and comprehensive vocabulary building for complex academic texts.",
    color: "text-accent-3"
  },
  {
    icon: PenTool,
    title: "Writing",
    description: "From structural templates to grammar clinic refinements—master the art of academic writing.",
    color: "text-accent-4"
  },
];

const comparisons = [
  { item: "AI Feedback", traditional: "Once a week/Delayed", smartlabs: "Instant & 24/7", highlight: true },
  { item: "Practice Tests", traditional: "Limited availability", smartlabs: "Unlimited access", highlight: true },
  { item: "Mock Test Scoring", traditional: "3-5 days wait", smartlabs: "Generated in seconds", highlight: true },
  { item: "Study Schedule", traditional: "Generic class speed", smartlabs: "AI-Personalized flow", highlight: true },
  { item: "Course Materials", traditional: "Physical textbooks", smartlabs: "LMS Digital Hub", highlight: true },
];

const faqs = [
  {
    q: "How accurate is the AI scoring engine?",
    a: "Our AI scoring engine is built using advanced natural language processing and is continuously refined based on official PTE and CELPIP scoring rubrics. It provides detailed feedback on grammar, vocabulary, coherence, and task achievement to help you improve effectively."
  },
  {
    q: "Can I switch between individual and group classes?",
    a: "Yes! Smart Labs offers ultimate flexibility. You can start with our recorded classes and upgrade to 1-on-1 individual mentorship sessions at any point during your preparation."
  },
  {
    q: "Is there a trial period available?",
    a: "Absolutely. You can sign up for free and get access to our diagnostic test immediately. This helps you understand your current level and experience our platform's capabilities before committing to a full course."
  },
  {
    q: "Do you provide assistance with exam booking?",
    a: "Yes, our support team guides you through the official registration process for PTE and CELPIP to ensure all your details are correct for the test day."
  }
];

const features = [
  {
    title: "AI Ecosystem",
    description: "Not just a scorer, but a complete feedback loop that learns your weaknesses.",
    icon: Cpu,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  },
  {
    title: "Expert Mentors",
    description: "Learn from trainers who have consistently achieved Band 9 and PTE 90 scores.",
    icon: GraduationCap,
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500"
  },
  {
    title: "Smart LMS",
    description: "A central dashboard for all your videos, progress reports, and practice materials.",
    icon: Layout,
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500"
  },
  {
    title: "Real Exam Simulation",
    description: "Practice in an environment that looks and feels exactly like the actual testing center.",
    icon: Monitor,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500"
  }
];

// ─── Google Review type used by the hero slideshow ───────────────────────────
interface HeroGoogleReview {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

const HERO_FALLBACK_REVIEWS: HeroGoogleReview[] = [
  { author_name: "Sarah Wijesinghe", profile_photo_url: "", rating: 5, relative_time_description: "2 days ago",
    text: "Smart Labs is the best PTE centre in Sri Lanka. I achieved a score of 82 in just 4 weeks!" },
  { author_name: "Kasun Perera", profile_photo_url: "", rating: 5, relative_time_description: "1 week ago",
    text: "The instructors are experts and the mock exams are very similar to the actual PTE test. Highly recommended!" },
  { author_name: "Nimali Fernando", profile_photo_url: "", rating: 5, relative_time_description: "2 weeks ago",
    text: "Excellent training. The practice sessions built my confidence and the study materials are comprehensive." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};


export default function Home() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);

  // Fetch real data from Firebase
  const { stats: siteStats } = useSiteStats();
  const { courses: realCourses, loading: coursesLoading } = useHomepageCourses();
  const { methods: realMethods, loading: methodsLoading } = useLearningMethods();
  const { features: realFeatures, loading: featuresLoading } = useFeatures();
  const { faqs: realFAQs, loading: faqsLoading } = useFAQs();
  const { comparisons: realComparisons, loading: comparisonsLoading } = useComparisons();
  const { testimonials: realTestimonials, loading: testimonialsLoading } = useTestimonials();
  const popupsReady = useDelayedPopups();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [aiText, setAiText] = useState("");
  const [progress, setProgress] = useState(0);
  const [aiResult, setAiResult] = useState<PteWriteEssayOutput | null>(null);
  const [topic, setTopic] = useState(sampleTopics[0]);
  const [topicId, setTopicId] = useState<number>(0);
  const [usageCount, setUsageCount] = useState<number | null>(null);

  // Map icon strings to actual icon components
  const iconMap: Record<string, any> = {
    Target, Globe, Zap, Video, Users, Brain, BookOpen, Cpu, GraduationCap, Layout, Monitor
  };

  // Use real data from Firebase with fallback to static data
  const displayCourses = (realCourses && realCourses.length > 0) ? realCourses.map(course => ({
    ...course,
    icon: iconMap[course.icon] || Target
  })) : courses;

  const displayMethods = (realMethods && realMethods.length > 0) ? realMethods.map(method => ({
    ...method,
    icon: iconMap[method.icon] || Video
  })) : learningMethods;

  const displayFeatures = (realFeatures && realFeatures.length > 0) ? realFeatures.map(feature => ({
    ...feature,
    icon: iconMap[feature.icon] || Cpu
  })) : features;

  const displayFAQs = (realFAQs && realFAQs.length > 0) ? realFAQs : faqs;
  const displayComparisons = (realComparisons && realComparisons.length > 0) ? realComparisons : comparisons;
  const displayTestimonials = (realTestimonials && realTestimonials.length > 0) ? realTestimonials : testimonials;
  const featuredCourses = (() => {
    const targets = ['/pte', '/ielts', '/celpip'];
    const selected = displayCourses && displayCourses.length > 0 ? displayCourses.filter((c: any) => targets.includes(c.href)) : [];
    return selected.length > 0 ? selected : (displayCourses && displayCourses.length > 0 ? displayCourses.slice(0, 3) : []);
  })();

  const { scrollYProgress } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    setParticles([...Array(10)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
    })));
  }, []);

  const y1 = useTransform(scrollYProgress, [0, 0.5], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);

  // Hero review slideshow — real Google Reviews
  const [heroGoogleReviews, setHeroGoogleReviews] = useState<HeroGoogleReview[]>(HERO_FALLBACK_REVIEWS);
  useEffect(() => {
    fetch('/api/google-reviews')
      .then(r => r.json())
      .then(data => {
        const reviews: HeroGoogleReview[] = data?.reviews ?? [];
        if (reviews.length > 0) setHeroGoogleReviews(reviews);
      })
      .catch(() => {}); // keep fallbacks on network error
  }, []);

  const [heroReviewIndex, setHeroReviewIndex] = useState(0);
  useEffect(() => {
    if (heroGoogleReviews.length <= 1) return;
    const timer = setInterval(() => {
      setHeroReviewIndex(i => (i + 1) % heroGoogleReviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroGoogleReviews.length]);

  // Set random topic and ID on mount
  useEffect(() => {
    setTopic(sampleTopics[Math.floor(Math.random() * sampleTopics.length)]);
    setTopicId(Math.floor(Math.random() * 9000) + 1000);
  }, []);

  // Fetch usage count when user logs in
  useEffect(() => {
    if (user) {
      const fetchUsage = async () => {
        try {
          const ref = doc(db, 'user_test_limits', user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setUsageCount(snap.data().count || 0);
          } else {
            setUsageCount(0);
          }
        } catch (error) {
          console.error("Error fetching usage limits:", error);
        }
      };
      fetchUsage();
    }
  }, [user]);

  const handleAnalyze = async () => {
    if (isAnalyzing) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the AI scoring engine.",
        variant: "destructive",
      });
      return;
    }

    if (!aiText || aiText.split(" ").length < 10) {
      toast({
        title: "Input Too Short",
        description: "Please write at least a few sentences for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setProgress(0);

    try {
      // 1. Check Usage Limit against Server
      const usageRef = doc(db, 'user_test_limits', user.uid);
      const usageSnap = await getDoc(usageRef);
      let currentCount = 0;
      if (usageSnap.exists()) {
        currentCount = usageSnap.data().count || 0;
      }
      // Sync local state
      setUsageCount(currentCount);

      if (currentCount >= 5) {
        setIsAnalyzing(false);
        toast({
          title: "Free Limit Reached",
          description: "You have used your 5 free AI scores. Please contact support to upgrade.",
          variant: "destructive"
        });
        return;
      }

      // 2. Start Progress Simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 100);

      // 3. Real AI Call
      const result = await scorePteWriteEssay({
        topic: topic,
        essay: aiText
      });

      clearInterval(progressInterval);
      setProgress(100);

      // 4. Update Usage
      if (usageSnap.exists()) {
        await updateDoc(usageRef, { count: increment(1) });
      } else {
        await setDoc(usageRef, { count: 1 });
      }

      // Update local state immediately for UI
      setUsageCount(currentCount + 1);

      setAiResult(result);
      setAnalysisComplete(true);
      setIsAnalyzing(false);

      // Log the test completion activity
      await logTestCompletion(
        user.uid,
        'PTE Write Essay - AI Scoring',
        result.overallScore,
        'PTE Writing'
      );

      toast({
        title: "Analysis Complete",
        description: "Your essay has been successfully scored.",
      });

    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Something went wrong during analysis. Please try again.",
        variant: "destructive"
      });
    }
  };
  return (
    <div className="relative overflow-x-hidden w-full max-w-[100vw]">
      {popupsReady && <EventPopup />}


      {/* Hero Section — Diagonal Split (animations defined in globals.css) */}
      <section className="relative overflow-hidden">
        {/* Top accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] origin-left z-50"
             style={{ background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent-3)), hsl(var(--accent-1)))', animation: 'accent-line 1.2s cubic-bezier(0.16,1,0.3,1) 0.1s both' }} />

        {/* ── DESKTOP (lg+) ──────────────────────────────── */}
        <div className="hidden lg:flex relative min-h-screen items-stretch">

          {/* Navy backdrop (full section) */}
          <div className="absolute inset-0 bg-slate-950" />

          {/* White left panel — diagonal right edge */}
          <div className="absolute inset-0 bg-white pointer-events-none"
               style={{ clipPath: 'polygon(0 0, 55% 0, 39% 100%, 0 100%)' }} />

          {/* Dot grid clipped to white zone */}
          <div className="absolute inset-0 pointer-events-none opacity-35"
               style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '36px 36px', clipPath: 'polygon(0 0, 55% 0, 39% 100%, 0 100%)' }} />

          {/* Navy glow orbs (right side) */}
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)', animation: 'orb-pulse 10s ease-in-out infinite', willChange: 'transform' }} />
          <div className="absolute bottom-1/4 right-12 w-56 h-56 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 65%)', animation: 'orb-pulse 14s ease-in-out infinite reverse', willChange: 'transform' }} />

          {/* Subtle grid on navy side */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '56px 56px', clipPath: 'polygon(43% 0, 100% 0, 100% 100%, 30% 100%)' }} />

          {/* ── LEFT content (white side) ── */}
          <div className="relative z-10 w-[46%] flex flex-col justify-center px-14 xl:px-20 pt-28 pb-20">

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400 mb-6">
              Welcome to
            </motion.p>

            <div style={{ overflow: 'hidden' }}>
              <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-black text-slate-900 leading-none tracking-tighter"
                style={{ fontSize: 'clamp(4rem, 10vw, 8.5rem)', lineHeight: 0.88 }}>
                SMART
              </motion.h1>
            </div>
            <div style={{ overflow: 'hidden', marginBottom: '1.75rem' }}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.85, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
                className="font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1"
                style={{ fontSize: 'clamp(4rem, 10vw, 8.5rem)', lineHeight: 0.88 }}>
                LABS
              </motion.div>
            </div>

            <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: 0 }} className="h-px w-20 bg-slate-200 mb-5" />

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.05 }}
              className="mb-2">
              <span className="lightning-text font-extrabold tracking-tight leading-tight"
                style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2.25rem)' }}>
                Sri Lanka's Premium International Exam Prep Hub
              </span>
            </motion.p>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.2 }}
              className="text-[10px] font-medium text-slate-400 tracking-[0.35em] uppercase mb-10">
              PTE &nbsp;·&nbsp; IELTS &nbsp;·&nbsp; KET &nbsp;·&nbsp; PET
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.4 }}
              className="flex flex-wrap items-center gap-4">
              <Button size="xl" className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base transition-all hover:scale-[1.04] shadow-xl shadow-slate-900/10" asChild>
                <Link href="/level-test">
                  <Activity className="mr-2.5 h-5 w-5" />
                  Take Free Level Test
                </Link>
              </Button>
              <FindCoursesButton className="h-14 px-10 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-base transition-all hover:scale-[1.04] hover:bg-slate-900 hover:text-white" />
            </motion.div>
          </div>

          {/* ── RIGHT content (navy side) ── */}
          <div className="relative z-10 w-[54%] flex flex-col justify-center pr-14 xl:pr-20 pt-28 pb-20"
               style={{ paddingLeft: 'clamp(90px, 14vw, 210px)' }}>

            <motion.p initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
              className="text-[10px] font-black uppercase tracking-[0.45em] text-blue-400 mb-3">
              Sri Lanka's #1
            </motion.p>
            <motion.h2 initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.85 }}
              className="text-3xl xl:text-4xl font-black text-white leading-[1.1] tracking-tight mb-8">
              English Training<br />Platform
            </motion.h2>

            {/* Stats 2×2 */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { value: siteStats ? `${siteStats.studentsCount.toLocaleString()}+` : '5,000+', label: 'Students Trained', color: 'text-blue-400',    border: 'border-blue-500/20' },
                { value: siteStats ? `${siteStats.successRate}%` : '95%',                        label: 'Success Rate',     color: 'text-emerald-400', border: 'border-emerald-500/20' },
                { value: siteStats?.targetWeeks ?? '6–8',                                        label: 'Weeks to Target',  color: 'text-violet-400',  border: 'border-violet-500/20' },
                { value: siteStats?.aiSupport ?? '24/7',                                         label: 'AI Support',       color: 'text-amber-400',   border: 'border-amber-500/20' },
              ].map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 + i * 0.1 }}
                  className={`bg-white/5 rounded-2xl p-4 border ${stat.border} backdrop-blur-sm`}>
                  <div className={`text-2xl xl:text-[1.9rem] font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Course badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="flex flex-wrap gap-2 mb-8">
              {[
                { name: 'PTE Academic', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/25' },
                { name: 'IELTS',        cls: 'bg-violet-500/10 text-violet-300 border-violet-500/25' },
                { name: 'KET Exam',     cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
                { name: 'PET Exam',     cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
              ].map(c => (
                <span key={c.name} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${c.cls}`}>
                  {c.name}
                </span>
              ))}
            </motion.div>

            {/* ── Live Review Slideshow ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.7 }}>
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <AnimatePresence mode="wait">
                  {heroGoogleReviews.length > 0 && (() => {
                    const r = heroGoogleReviews[heroReviewIndex % heroGoogleReviews.length];
                    const initials = r.author_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const snippet = r.text.length > 130 ? r.text.slice(0, 130).trimEnd() + '…' : r.text;
                    return (
                      <motion.div
                        key={heroReviewIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar — photo or initials */}
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-sm font-black">
                            {r.profile_photo_url ? (
                              <Image
                                src={r.profile_photo_url}
                                alt={r.author_name}
                                width={36}
                                height={36}
                                unoptimized
                                className="object-cover w-full h-full"
                              />
                            ) : initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs leading-relaxed mb-1.5">"{snippet}"</p>
                            <p className="text-slate-400 text-[10px] font-semibold">— {r.author_name}</p>
                            <p className="text-slate-600 text-[9px] mt-0.5">{r.relative_time_description}</p>
                          </div>
                        </div>
                        {/* Dynamic star rating */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Dot navigation */}
                {heroGoogleReviews.length > 1 && (
                  <div className="flex gap-1.5 mt-4 justify-end">
                    {heroGoogleReviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroReviewIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === heroReviewIndex % heroGoogleReviews.length
                            ? 'w-4 bg-blue-400'
                            : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── MOBILE (< lg) ──────────────────────────────── */}
        <div className="lg:hidden flex flex-col">
          {/* White top — pure-CSS entrance animations so the hero paints
              before hydration (mobile LCP). */}
          <div className="bg-white pt-24 pb-12 px-6 flex flex-col items-center text-center">
            <p className="hero-fade-in text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400 mb-5" style={{ animationDelay: '0.2s' }}>
              Welcome to
            </p>
            <div style={{ overflow: 'hidden' }}>
              <h1 className="hero-rise-in font-black text-slate-900 leading-none tracking-tighter"
                style={{ fontSize: '18vw', lineHeight: 0.88, animationDelay: '0.05s' }}>
                SMART
              </h1>
            </div>
            <div style={{ overflow: 'hidden', marginBottom: '1rem' }}>
              <div className="hero-rise-in font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1"
                style={{ fontSize: '18vw', lineHeight: 0.88, animationDelay: '0.15s' }}>
                LABS
              </div>
            </div>
            <p className="mb-2">
              <span className="lightning-text font-extrabold tracking-tight leading-tight"
                style={{ fontSize: 'clamp(1.25rem, 6vw, 1.75rem)' }}>
                Sri Lanka's Premium International Exam Prep Hub
              </span>
            </p>
            <p className="hero-fade-in text-[10px] font-medium text-slate-400 tracking-[0.3em] uppercase mb-8" style={{ animationDelay: '0.35s' }}>
              PTE · IELTS · KET · PET
            </p>
            <div className="hero-fade-in flex flex-wrap gap-3" style={{ animationDelay: '0.45s' }}>
              <Button size="lg" className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black" asChild>
                <Link href="/level-test"><Activity className="mr-2 h-4 w-4" />Take Free Level Test</Link>
              </Button>
              <FindCoursesButton size="lg" className="h-12 px-8 rounded-2xl border-2 border-slate-900 text-slate-900 font-black" />
            </div>
          </div>

          {/* Navy bottom */}
          <div className="bg-slate-950 px-6 py-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">Sri Lanka's #1</p>
            <h2 className="text-2xl font-black text-white mb-6">English Training Platform</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: siteStats ? `${siteStats.studentsCount.toLocaleString()}+` : '5,000+', label: 'Students Trained', color: 'text-blue-400' },
                { value: siteStats ? `${siteStats.successRate}%` : '95%',                        label: 'Success Rate',     color: 'text-emerald-400' },
                { value: siteStats?.targetWeeks ?? '6–8',                                        label: 'Weeks to Target',  color: 'text-violet-400' },
                { value: siteStats?.aiSupport ?? '24/7',                                         label: 'AI Support',       color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className={`text-xl font-black mb-0.5 ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {['PTE Academic', 'IELTS', 'KET Exam', 'PET Exam'].map(n => (
                <span key={n} className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom marquee — pure CSS */}
        <div className="relative border-t border-slate-100 overflow-hidden bg-white z-10" style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'hero-marquee 30s linear infinite', willChange: 'transform' }}>
            {[...Array(2)].flatMap((_, ri) =>
              ["PTE Academic","·","IELTS","·","KET Exam","·","PET Exam","·",
               "5,000+ Students","·","95% Success Rate","·","AI Powered Scoring","·",
               "Live Expert Classes","·","6–8 Weeks to Target","·","Pearson Certified","·"].map((item, i) => (
                <span key={`${ri}-${i}`}
                  className={item === "·"
                    ? "mx-5 text-slate-200 select-none"
                    : "text-[11px] font-semibold text-slate-400 mx-4 whitespace-nowrap uppercase tracking-widest"}>
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Floating Feature Bar */}
      <section className="relative py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Elite Group Batches",
                desc: "Focused groups of 3-10 students for personalized attention.",
                color: "bg-primary/10 text-primary",
                badge: "Limited Seats",
                href: "/courses"
              },
              {
                icon: Zap,
                title: "Dynamic Power Sessions",
                desc: "Intensive 2-hour sessions targeting your weakest components.",
                color: "bg-accent-3/10 text-accent-3",
                badge: "Live Daily",
                href: "https://register.smartlabs.lk"
              },
              {
                icon: Laptop,
                title: "Essay Practise",
                desc: "Practise PTE essays with instant scoring and detailed feedback using Gemini AI.",
                color: "bg-accent-1/10 text-accent-1",
                badge: "New Release",
                href: "/ai-essay-practice"
              }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + idx * 0.1 }}
                className="group relative"
              >
                <Link href={item.href} className="group relative block h-full">
                  <div className="h-full p-8 rounded-[40px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-800/60 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn("p-4 rounded-2xl", item.color)}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", item.color.replace('10', '20'))}>
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{item.href.startsWith('http') ? 'Register Now' : 'Try Practice Arena'}</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WebinarPoster />

      {/* Power Session Recordings - Self-Paced Vault */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-background">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-accent-3/10 blur-3xl -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — Headline + Description */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                <Video className="h-4 w-4" />
                <span>Power Session Recordings</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                The Ultimate <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 italic">Self-Paced Exam</span> <br />
                Strategy Vault
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Master your exam using our raw, high-intensity strategy sessions. This package is designed
                specifically for highly disciplined, self-guided students who want elite templates and
                techniques without the cost or fixed hours of a live classroom.
              </p>

              {/* Feature highlights */}
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Play className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1">Live Class Recordings</h3>
                    <p className="text-muted-foreground font-medium">Full access to our high-intensity recorded strategy sessions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-3/10 text-accent-3 flex items-center justify-center shrink-0">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1">24/7 Premium LMS Portal Access</h3>
                    <p className="text-muted-foreground font-medium">Log in securely from your phone, laptop, or tablet. Learn anytime, anywhere, for a full <span className="font-bold text-foreground">45 days</span>.</p>
                  </div>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Your Investment</p>
                  <p className="text-4xl font-black tracking-tight">20,000 <span className="text-2xl text-muted-foreground">LKR</span></p>
                </div>
                <Button size="lg" className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-base" asChild>
                  <Link href="/courses"><Zap className="mr-2 h-5 w-5" />Enroll via PayHere</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right — Notice card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="rounded-[32px] border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-8 sm:p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <Bell className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">Important Notice for Independent Learners</h3>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  This budget-friendly package is <span className="font-bold text-foreground">100% self-guided</span>.
                  To keep this package highly affordable, it does <span className="font-bold text-foreground">NOT</span> include:
                </p>

                <ul className="space-y-4">
                  {[
                    "Live lecturer interaction or Q&A sessions",
                    "Personalized writing evaluations or speech grading",
                    "Live mock test feedback sessions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-6 border-t border-amber-500/20">
                  <p className="text-muted-foreground">
                    If you require active teacher feedback, please view our{" "}
                    <Link href="/courses" className="font-bold text-primary hover:underline">Live Hybrid Cohort Plans</Link> instead.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Success Roadmap - Ultra Modern Design */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 dark:bg-slate-950/50 -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
            <div className="max-w-2xl space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
              >
                The Smart Labs Methodology
              </motion.div>
              <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
                Your Strategic <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient italic">Path to Success</span>
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-md pb-2">
              A proprietary four-phase framework engineered to maximize your score in the shortest possible time frame.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Line - Desktop Only */}
            <div className="absolute top-[120px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-accent-3/20 to-accent-1/20 hidden lg:block" />

            {roadmapSteps.map((step, idx) => (
              <Link href={(step as any).link || "#"} key={step.id} className="h-full group">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  className="relative h-full"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-primary/20 flex items-center justify-center text-xs font-black z-20 shadow-xl group-hover:scale-110 group-hover:border-primary transition-all">
                    {step.id}
                  </div>

                  <div className="h-full p-10 rounded-[48px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] group-hover:-translate-y-4 group-hover:border-primary/30 flex flex-col items-center text-center">
                    <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-2xl", step.bg, step.color)}>
                      <step.icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{step.desc}</p>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center gap-2 text-xs font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      Explore Phase <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar - High Impact Grid */}
      <section className="py-20 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24">
            {[
              {
                value: siteStats?.studentsCount || 5000,
                suffix: "+",
                label: "Global Students",
                sub: "Trained & Certified",
                color: "text-accent-1",
                icon: Users
              },
              {
                value: siteStats?.successRate || 95,
                suffix: "%",
                label: "Success Index",
                sub: "Target Achieved",
                color: "text-accent-2",
                icon: Trophy
              },
              {
                valueString: siteStats?.targetWeeks || "6–8",
                suffix: " Wks",
                label: "Avg. Duration",
                sub: "To Mastery",
                color: "text-accent-3",
                icon: Clock
              },
              {
                value: 24,
                suffix: "/7",
                label: "AI Resilience",
                sub: "Instant Support",
                color: "text-accent-4",
                icon: Zap
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left group"
              >
                <div className={cn("mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className={cn("text-4xl sm:text-6xl font-black mb-2 tracking-tighter", stat.color)}>
                  {stat.value ? <AnimatedNumber value={stat.value} /> : stat.valueString}
                  {stat.suffix}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-white uppercase tracking-[0.2em]">{stat.label}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Smart Labs Advantage - Detailed Feature Grid */}
      <section className="py-24 sm:py-32 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-3/5 blur-[120px] rounded-full -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500"
            >
              The Competitive Edge
            </motion.div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              Engineered for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient italic">Peak Performance</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Discover the proprietary technology and expert-led methodologies that have established Smart Labs as the undisputed industry leader.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {displayFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard className="h-full p-10 lg:p-14 rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-primary/30 transition-all duration-500">
                  <div className="flex flex-col sm:flex-row gap-10">
                    <div className={cn("w-24 h-24 rounded-[32px] shrink-0 flex items-center justify-center bg-gradient-to-br transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl", feature.color)}>
                      <feature.icon className={cn("h-12 w-12", feature.iconColor)} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black tracking-tight">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                      <div className="pt-4 flex flex-wrap gap-2">
                        {["Advanced", "Proprietary", "Real-time"].map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section - Smart Labs vs Traditional */}
      <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-1/10 text-accent-1 text-[10px] font-black uppercase tracking-[0.3em]"
                >
                  Market Comparison
                </motion.div>
                <h2 className="text-5xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tight">
                  Transcend the <br />
                  <span className="text-primary italic">Conventional</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Traditional coaching is fundamentally disconnected from modern exam algorithms. Smart Labs bridges that critical gap with data-driven precision.
                </p>
              </div>

              <div className="space-y-4">
                {displayComparisons.slice(0, 3).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6 p-6 rounded-[32px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                      <Check className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.item}</div>
                      <div className="font-black text-xl text-primary">{item.smartlabs}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[56px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-[0_80px_160px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl"
            >
              <div className="p-10 lg:p-16 overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-10 font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Parameter</th>
                      <th className="pb-10 font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Traditional</th>
                      <th className="pb-10 font-black uppercase text-[10px] tracking-[0.3em] text-primary">Smart Labs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {displayComparisons.map((row, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-8 font-black text-lg tracking-tight">{row.item}</td>
                        <td className="py-8 text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <X className="h-4 w-4 text-red-400" />
                            <span className="text-sm font-medium">{row.traditional}</span>
                          </div>
                        </td>
                        <td className="py-8">
                          <div className="flex items-center gap-3 text-primary">
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="text-lg font-black">{row.smartlabs}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Courses Section - Premium Design */}
      <section id="courses" className="relative py-24 sm:py-32 overflow-hidden bg-slate-50 dark:bg-[#020617]">
        {/* Advanced Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.05),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(6,182,212,0.05),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Curated Excellence
            </motion.div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              Choose Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient italic">Victory Path</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              World-class preparation for PTE, IELTS, KET & PET — engineered by internationally trained experts.
            </p>
            {/* Exam badges row */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                { label: "PTE Academic", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
                { label: "KET Exam", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
                { label: "IELTS", color: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
                { label: "PET Exam", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
              ].map(b => (
                <span key={b.label} className={`px-4 py-1.5 rounded-full text-xs font-black border ${b.color}`}>{b.label}</span>
              ))}
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8"
          >
            {displayCourses.map((course: any, index: number) => (
              <motion.div
                key={course.title}
                variants={itemVariants}
                className="group"
              >
                <Link href={course.href} className="block h-full">
                  <div className="relative h-full p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:-translate-y-4 hover:border-primary/30 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 overflow-hidden">
                    {/* Badge */}
                    {course.badge && (
                      <span className={cn("absolute top-6 right-6 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider", course.badgeColor || "bg-primary/10 text-primary border-primary/30")}>
                        {course.badge}
                      </span>
                    )}

                    {/* Icon Container */}
                    <div className="mb-8">
                      <div className={cn("inline-flex p-5 rounded-[24px] bg-gradient-to-br shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", course.color)}>
                        <course.icon className={cn("h-8 w-8", course.iconColor)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3">
                        {course.description}
                      </p>

                      <ul className="space-y-2.5">
                        {course.features.slice(0, 3).map((feature: string) => (
                          <li key={feature} className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Enroll Now</span>
                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Methods Section - Advanced Grid */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-3/5 blur-[160px] rounded-full -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
            <div className="max-w-2xl space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-3/10 text-accent-3 text-[10px] font-black uppercase tracking-[0.3em]"
              >
                Hyper-Flexible Ecosystem
              </motion.div>
              <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
                Mastery on <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-3 via-primary to-accent-1 animate-gradient italic">Your Terms</span>
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-md pb-2 leading-relaxed">
              From intensive group sprints to elite 1-on-1 strategic consulting. We adapt our delivery to your unique schedule and learning velocity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {displayMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={method.href || "#"} className="group block h-full">
                  <div className="h-full p-10 rounded-[48px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-3 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30 flex flex-col items-center text-center">
                    <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl", method.color)}>
                      <method.icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{method.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{method.description}</p>
                    {method.href && (
                      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">
                        Initialize <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Package - Detailed Feature Card */}
      <section className="py-12 sm:py-24 relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[64px] overflow-hidden bg-slate-900 border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.2)] relative"
          >
            <div className="absolute inset-0 bg-grid-white/[0.03]" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

            <div className="relative p-12 sm:p-20">
              <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                      <Video className="h-5 w-5" />
                      <span>Hybrid Learning Model</span>
                    </div>
                    <h3 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tight">
                      Infinite <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient">Replay Access</span>
                    </h3>
                    <p className="text-xl text-slate-400 leading-relaxed">
                      Eliminate scheduling conflicts with our enterprise-grade LMS. Access high-definition recordings of every session, synchronized with digital courseware.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    {[
                      "20H High-Definition Archive",
                      "Cloud-Native LMS Ecosystem",
                      "30-Day Unlimited Retention",
                      "Adaptive Study Interface"
                    ].map(item => (
                      <div key={item} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                          <Check className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="p-10 sm:p-14 rounded-[48px] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-center items-center text-center group hover:border-primary/50 transition-all duration-500">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Investment</p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xs font-black text-white/40">LKR</span>
                      <span className="text-6xl font-black text-white tracking-tighter">20,000</span>
                    </div>
                    <p className="text-sm text-slate-500 font-bold mb-10">All-Inclusive Monthly Pass</p>
                    <Button
                      size="xl"
                      className="w-full h-20 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform"
                      asChild
                    >
                      <Link href="/dashboard/recorded-sessions">
                        Secure Access <ArrowRight className="ml-4 h-6 w-6" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Expert Lifecycle - Detailed Roadmap */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              The Success Protocol
            </motion.div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              Strategic <br />
              <span className="text-primary italic">Lifecycle Management</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 lg:gap-12 relative">
            {/* Connecting Vector - Desktop */}
            <div className="absolute top-[120px] left-[10%] right-[10%] h-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

            {[
              { title: 'Assessment', desc: 'Neural AI Diagnostic Analysis', icon: Scan, color: 'text-accent-1', bg: 'bg-accent-1/10', step: '01' },
              { title: 'Optimization', desc: 'Custom Algorithmic Curriculum', icon: Map, color: 'text-accent-2', bg: 'bg-accent-2/10', step: '02' },
              { title: 'Simulation', desc: 'Real-time Exam Emulation', icon: Trophy, color: 'text-accent-3', bg: 'bg-accent-3/10', step: '03' },
              { title: 'Certification', desc: 'Verified Target Achievement', icon: Flag, color: 'text-accent-4', bg: 'bg-accent-4/10', step: '04' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="relative group h-full p-10 rounded-[48px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-4 hover:border-primary/30 flex flex-col items-center text-center">
                  <div className="absolute top-8 right-10 text-5xl font-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity select-none">{step.step}</div>
                  <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl", step.bg, step.color)}>
                    <step.icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Grammar Clinic - Advanced Detail Section */}
      <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[64px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_80px_160px_rgba(0,0,0,0.1)] relative">
            <div className="grid lg:grid-cols-2 gap-0 items-stretch">
              <div className="p-12 sm:p-20 space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-accent-4/10 border border-accent-4/20 text-accent-4 text-[10px] font-black uppercase tracking-[0.3em]">
                    <BookOpen className="h-5 w-5" />
                    <span>Linguistic Precision</span>
                  </div>
                  <h3 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
                    Grammar <br />
                    <span className="text-accent-4 italic">Clinic</span>
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Master the foundational mechanics of the English language. Our specialized clinic identifies and neutralizes deep-seated linguistic errors through targeted intervention.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    "Structural Analysis",
                    "Syntax Optimization",
                    "Cohesion Mastery",
                    "Expert Correction"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-accent-4/10 flex items-center justify-center text-accent-4 shrink-0">
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>

                <Button size="xl" className="h-20 px-10 rounded-[32px] bg-accent-4 hover:bg-accent-4/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform" asChild>
                  <Link href="/courses">
                    Join Clinical Session <ArrowRight className="ml-4 h-6 w-6" />
                  </Link>
                </Button>
              </div>

              <div className="relative min-h-[500px] lg:min-h-full group overflow-hidden">
                <Image
                  src="/gcd.jpg"
                  alt="Grammar Clinic"
                  fill
                  className="object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-slate-950/60 to-transparent" />
                <div className="absolute bottom-12 left-12 right-12 p-10 rounded-[40px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                  <p className="text-3xl font-black text-white mb-2 tracking-tight">Linguistic Hub</p>
                  <p className="text-sm text-white/60 font-bold uppercase tracking-widest">Mastery through Interaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Mastery - High Tech Grid */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Omni-Skill Development
            </motion.div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              The Four <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient italic">Dimensions</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {skillModules.map((skill, index) => (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group h-full"
              >
                <div className="relative h-full p-10 rounded-[48px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-3 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30 flex flex-col items-center text-center">
                  <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl", skill.color)}>
                    <skill.icon className="h-10 w-10" />
                  </div>
                  <h3 className="font-black text-2xl mb-4 tracking-tight group-hover:text-primary transition-colors">
                    {skill.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      <GoogleReviews />

      {/* FAQ Section - Ultra Modern Accordion */}
      <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Common Inquiries
            </motion.div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              Strategic <br />
              <span className="text-primary italic">Intelligence</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {displayFAQs.map((faq, i) => {
              const question = 'question' in faq ? faq.question : (faq as any).q;
              const answer = 'answer' in faq ? faq.answer : (faq as any).a;
              return (
                <AccordionItem key={i} value={`item-${i}`} className="border-none">
                  <AccordionTrigger className="flex gap-6 p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:no-underline hover:border-primary/30 transition-all text-left data-[state=open]:rounded-b-none data-[state=open]:border-b-0 group">
                    <span className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-0 rounded-b-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-0 text-lg text-muted-foreground leading-relaxed">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      {/* Map Section */}
      <GoogleMap />
    </div>
  );
}
