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
  ShieldCheck,
  Terminal,
  Code2,
  Map,
  Search,
  Book,
  Feather,
  Award,
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
  CheckCircle2,
  Rocket,
  TrendingUp,
  Clock,
  MessageSquare,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  BarChart3,
  Flag,
  Monitor,
  Download,
  Laptop,
  Bell,
  Calendar,
  Quote,
  Layout,
  Check,
  X,
  HelpCircle,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import { Button } from '@/components/ui/button';
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
import { EventPopup } from "@/components/events/event-popup";
import { useHomepageCourses, useLearningMethods, useFeatures, useFAQs, useComparisons } from "@/hooks/use-homepage-content";
import { useTestimonials } from "@/hooks/use-testimonials";
import { GoogleReviews } from "@/components/sections/google-reviews";
import { GoogleMap } from "@/components/sections/google-map";
import { LMS_URL, testimonials } from "@/lib/constants";
import { WebinarPoster } from "@/components/webinar/webinar-poster";
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
    color: "from-accent-1/20 to-accent-1/5",
    iconColor: "text-accent-1",
    bgGradient: "from-accent-1/10 via-accent-1/5 to-transparent",
    features: ["AI Scoring Practice", "Live Classes", "Full Materials Access", "Mock Tests"],
  },
  {
    title: "CELPIP Prep",
    description: "Your pathway to Canadian immigration with focused CELPIP training.",
    icon: Zap,
    href: "/courses",
    color: "from-accent-4/20 to-accent-4/5",
    iconColor: "text-accent-4",
    bgGradient: "from-accent-4/10 via-accent-4/5 to-transparent",
    features: ["Self-Paced Learning", "Video Guides", "Practice Tests", "Expert Tips"],
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
    link: "/dashboard/ai-tutor",
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
  const displayCourses = realCourses.length > 0 ? realCourses.map(course => ({
    ...course,
    icon: iconMap[course.icon] || Target
  })) : courses;

  const displayMethods = realMethods.length > 0 ? realMethods.map(method => ({
    ...method,
    icon: iconMap[method.icon] || Video
  })) : learningMethods;

  const displayFeatures = realFeatures.length > 0 ? realFeatures.map(feature => ({
    ...feature,
    icon: iconMap[feature.icon] || Cpu
  })) : features;

  const displayFAQs = realFAQs.length > 0 ? realFAQs : faqs;
  const displayComparisons = realComparisons.length > 0 ? realComparisons : comparisons;
  const displayTestimonials = realTestimonials.length > 0 ? realTestimonials : testimonials;
  const featuredCourses = (() => {
    const targets = ['/pte', '/ielts', '/celpip'];
    const selected = displayCourses.filter((c: any) => targets.includes(c.href));
    return selected.length > 0 ? selected : displayCourses.slice(0, 3);
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
    setParticles([...Array(30)].map(() => ({
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
    <main className="relative">
      <EventPopup />


      {/* Hero Section - Ultra Advanced Redesign */}
      <section className="relative overflow-hidden min-h-[100vh] flex items-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-[#020617] dark:via-[#0a0e27] dark:to-[#0f0a1e] py-12 lg:py-20">
        {/* Animated Particle System - Enhanced */}
        <div className="absolute inset-0 -z-30">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [0, -60, 0],
                opacity: [0.1, 0.9, 0.1],
                scale: [1, 2, 1],
              }}
              transition={{
                duration: particle.duration * 1.5,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Advanced Grid Pattern - Interactive */}
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 -z-20 opacity-[0.03] dark:opacity-[0.1]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020617_100%)] opacity-40 dark:opacity-60" />
        </motion.div>

        {/* Dynamic Gradient Orbs - More Vivid */}
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -100, 0],
            scale: [1, 1.4, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-gradient-to-r from-primary/30 via-accent-3/20 to-accent-1/20 blur-[180px] rounded-full opacity-40 pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, 80, 0],
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-gradient-to-l from-accent-2/20 via-primary/20 to-accent-4/20 blur-[160px] rounded-full opacity-30 pointer-events-none"
        />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12 relative z-10 w-full">
          <div className="flex flex-col items-center text-center">

            {/* Content Column - Modern Centered */}
            <motion.div
              style={{ opacity: heroOpacity }}
              className="space-y-12 relative max-w-5xl mx-auto"
            >
              {/* Premium Status Bar */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-6 p-1.5 pr-6 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/50 backdrop-blur-2xl shadow-2xl mx-auto"
              >
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Online</span>
                </div>
                <div className="flex -space-x-3 items-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-slate-200">
                      <Image src={`/images/monsters/monster-green-study.png`} alt="User" width={32} height={32} className="object-cover" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary backdrop-blur-sm">
                    +5k
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground">Joined by <span className="text-foreground dark:text-white font-black">5,000+</span> Students</span>
              </motion.div>

              {/* Ultra-Detailed Headline */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="font-display text-6xl sm:text-8xl xl:text-9xl font-black tracking-tight leading-[0.85] text-slate-900 dark:text-white">
                    UNLEASH <br />
                    <span className="relative inline-block">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient">
                        YOUR SCORE
                      </span>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="absolute -bottom-4 left-0 w-full h-3 bg-primary/20 rounded-full blur-sm"
                      />
                    </span>
                  </h1>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-6 justify-center"
                >
                  <div className="h-px w-24 bg-gradient-to-r from-primary/50 to-transparent" />
                  <span className="text-xs font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">The Future of PTE Training</span>
                  <div className="h-px w-24 bg-gradient-to-l from-primary/50 to-transparent" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="text-xl sm:text-2xl text-muted-foreground dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium"
                >
                  Experience the most <span className="text-primary font-black italic underline decoration-primary/30 underline-offset-8">advanced AI-driven</span> ecosystem for PTE & CELPIP. Personalized strategies that adapt to your unique learning style.
                </motion.p>
              </div>

              {/* Advanced Bento CTA Section */}
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-center w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="w-full lg:w-auto"
                >
                  <Button
                    size="xl"
                    className="w-full lg:w-[280px] h-24 group relative rounded-[32px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-2xl"
                    asChild
                  >
                    <a href={LMS_URL} target="_blank" rel="noopener noreferrer">
                      <div className="relative z-10 flex flex-col items-start gap-1">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60 text-left">Get Started</span>
                        <span className="text-xl font-black tracking-tight flex items-center gap-3">
                          Start Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </span>
                      </div>
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-700">
                        <Rocket className="h-20 w-20" />
                      </div>
                    </a>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15 }}
                  className="w-full lg:w-auto"
                >
                  <Button
                    size="xl"
                    className="w-full lg:w-[280px] h-24 group relative rounded-[32px] bg-primary text-white overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20"
                    asChild
                  >
                    <Link href="/level-test">
                      <div className="relative z-10 flex flex-col items-start gap-1">
                        <span className="text-xs font-black uppercase tracking-widest text-white/70 text-left">Diagnostic</span>
                        <span className="text-xl font-black tracking-tight flex items-center gap-3">
                          Free Level Test <Activity className="h-5 w-5 group-hover:animate-pulse transition-transform" />
                        </span>
                      </div>
                      <div className="absolute -bottom-4 -right-4 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Scan className="h-20 w-20" />
                      </div>
                    </Link>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="w-full lg:w-auto"
                >
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full lg:w-[280px] h-24 group relative rounded-[32px] border-2 border-primary/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-primary/50"
                    asChild
                  >
                    <a href={LMS_URL} target="_blank" rel="noopener noreferrer">
                      <div className="relative z-10 flex flex-col items-start gap-1">
                        <span className="text-xs font-black uppercase tracking-widest text-primary text-left">Consultation</span>
                        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                          Book Expert Call <PlayCircle className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
                        </span>
                      </div>
                      <div className="absolute -bottom-6 -right-6 p-6 opacity-5 group-hover:opacity-10 transition-all duration-700">
                        <Users className="h-24 w-24" />
                      </div>
                    </a>
                  </Button>
                </motion.div>
              </div>

              {/* Key Highlights Row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="flex flex-wrap items-center justify-center gap-8 pt-12 border-t border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-1/10 flex items-center justify-center text-accent-1">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Achievement</p>
                    <p className="text-sm font-black">95% Success Rate</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-2/10 flex items-center justify-center text-accent-2">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technology</p>
                    <p className="text-sm font-black">AI Scoring 2.0</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-3/10 flex items-center justify-center text-accent-3">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recognition</p>
                    <p className="text-sm font-black">Pearson Certified</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Feature Bar - Detailed */}
      <section className="relative -mt-12 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Elite Group Batches",
                desc: "Focused groups of 3-10 students for personalized attention.",
                color: "bg-primary/10 text-primary",
                badge: "Limited Seats"
              },
              {
                icon: Zap,
                title: "Dynamic Power Sessions",
                desc: "Intensive 2-hour sessions targeting your weakest components.",
                color: "bg-accent-3/10 text-accent-3",
                badge: "Live Daily"
              },
              {
                icon: Laptop,
                title: "Premium LMS Ecosystem",
                desc: "24/7 access to recordings, practice tests, and AI tools.",
                color: "bg-accent-1/10 text-accent-1",
                badge: "Free Trial"
              }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + idx * 0.1 }}
                className="group relative"
              >
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
                    <span>Learn more</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WebinarPoster />

      {/* Meet Our Founder Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Founder Image with Decorative Plates */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 w-full h-full bg-accent-3/20 rounded-[48px] -z-10 animate-pulse-glow" />
              <div className="absolute -bottom-6 -right-6 w-full h-full bg-primary/10 rounded-[48px] -z-10" />

              <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] shadow-2xl border border-white/20">
                <Image
                  src="/la.png"
                  alt="Lahiruka Weeraratne - Founder of Smart Labs"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
              </div>
            </motion.div>

            {/* Founder Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                  <User className="h-4 w-4" />
                  <span>Meet Our Founder</span>
                </div>

                <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                  Lahiruka Weeraratne <br />
                  <span className="text-primary italic">(Laheer)</span>
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our Founder and Director, Lahiruka Weeraratne, known in the industry as Laheer, is a distinguished expert trainer officially trained by Pearson UK. She specializes in PTE and CELPIP exams—the essential pathways for students and professionals seeking to study, migrate, or settle abroad. With over 6 years of professional experience, she has successfully trained more than 5,000 students, empowering them to achieve their global aspirations.
                </p>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-black tracking-tight">Areas of Expertise</h3>

                <div className="grid gap-6">
                  {[
                    {
                      icon: GraduationCap,
                      title: "Competency Test Training",
                      desc: "PTE & CELPIP Mastery",
                      color: "bg-accent-1/10 text-accent-1"
                    },
                    {
                      icon: Briefcase,
                      title: "Corporate Language & Communication",
                      desc: "Professional English Development",
                      color: "bg-accent-2/10 text-accent-2"
                    },
                    {
                      icon: Globe,
                      title: "Study Abroad & Migration Guidance",
                      desc: "Complete Pathways Coaching",
                      color: "bg-accent-3/10 text-accent-3"
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110", item.color)}>
                        <item.icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg leading-none">{item.title}</h4>
                        <p className="text-muted-foreground font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
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

      {/* AI Lab Section - Transforming the Scorer */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-[#020617] overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left AI Lab Branding */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-12"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                  <Microscope className="h-5 w-5 animate-pulse" />
                  <span>AI Core v3.0 Powered</span>
                </div>

                <h2 className="font-display text-5xl sm:text-7xl font-black text-white leading-none">
                  Advanced <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient uppercase">Neural Scoring</span>
                </h2>

                <p className="text-xl text-slate-400 leading-relaxed">
                  Our proprietary scoring engine utilizes multi-layer transformer models to evaluate your performance against millions of verified exam data points.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
                  <Database className="h-8 w-8 text-primary mb-6 group-hover:scale-110 transition-transform" />
                  <h4 className="font-black text-white text-xl mb-3">Deep Training</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Trained on 10M+ authentic exam samples for industry-leading precision.</p>
                </div>
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
                  <ShieldCheck className="h-8 w-8 text-accent-1 mb-6 group-hover:scale-110 transition-transform" />
                  <h4 className="font-black text-white text-xl mb-3">Real-time Analysis</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Evaluating grammar, syntax, and cohesion with multi-layer linguistic analysis.</p>
                </div>
              </div>

              <div className="flex items-center gap-12 pt-10 border-t border-white/10">
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white tracking-tighter">99.9%</div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Up-time</div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white tracking-tighter">0.4s</div>
                  <div className="text-[10px] font-black text-accent-1 uppercase tracking-[0.2em]">Latency</div>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive AI Console */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-7 relative"
            >
              <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full animate-pulse opacity-40" />

              <div className="relative">
                <div className="p-1 rounded-[48px] bg-gradient-to-br from-white/20 via-white/5 to-transparent backdrop-blur-3xl">
                  <div className="p-8 lg:p-12 rounded-[46px] bg-[#0f172a]/95 border border-white/10 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Terminal className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500'} animate-pulse`} />
                            <span className="font-black text-[10px] text-white uppercase tracking-[0.2em]">{user ? 'System Ready' : 'Unauthorized'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Terminal ID: SL-AI-2026</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-12 px-6 rounded-xl text-white hover:bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest gap-3"
                        onClick={() => {
                          setAiText("");
                          setAiResult(null);
                          setAnalysisComplete(false);
                          setIsAnalyzing(false);
                          setProgress(0);
                          setTopic(sampleTopics[Math.floor(Math.random() * sampleTopics.length)]);
                          setTopicId(Math.floor(Math.random() * 9000) + 1000);
                        }}
                        disabled={isAnalyzing}
                      >
                        <RefreshCcw className="h-4 w-4" /> Reset Environment
                      </Button>
                    </div>

                    <div className="space-y-8">
                      {/* Topic Display */}
                      <div className="p-8 rounded-[32px] bg-black/40 border border-primary/20 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="text-[10px] font-black text-primary mb-4 uppercase tracking-[0.3em]">Active Prompt</div>
                        <p className="text-lg text-white/90 leading-relaxed font-medium italic">"{topic}"</p>
                      </div>

                      <div className="relative">
                        <Textarea
                          value={aiText}
                          onChange={(e) => setAiText(e.target.value)}
                          placeholder={user ? "Initialize academic response input sequence..." : "Authentication required for engine access."}
                          className="min-h-[240px] bg-black/40 border-white/10 focus:border-primary/50 transition-all resize-none text-white/90 placeholder:text-white/20 rounded-[32px] p-8 font-mono text-sm leading-relaxed no-scrollbar"
                          disabled={isAnalyzing || !user}
                        />
                        {user && (
                          <div className="absolute bottom-6 right-8 flex gap-6 text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <span>{aiText.length} Characters</span>
                            <span>{aiText.split(/\s+/).filter(Boolean).length} Words</span>
                          </div>
                        )}
                      </div>

                      {isAnalyzing ? (
                        <div className="space-y-6 p-2">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                              <Activity className="h-5 w-5 text-primary animate-spin-slow" />
                              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Processing Neural Weights...</span>
                            </div>
                            <span className="text-xl font-black text-white">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2 bg-white/5 rounded-full" indicatorClassName="bg-gradient-to-r from-primary via-accent-3 to-accent-1 shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                        </div>
                      ) : !analysisComplete ? (
                        <Button
                          onClick={handleAnalyze}
                          className="w-full h-20 bg-primary hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] transition-all text-white font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_40px_rgba(79,70,229,0.3)] border-none rounded-[32px]"
                          disabled={!user || aiText.length < 50}
                        >
                          <Zap className="h-5 w-5 mr-3 fill-white" />
                          Execute Analysis Sequence
                        </Button>
                      ) : aiResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { label: 'Overall', score: aiResult.overallScore, color: 'text-primary' },
                              { label: 'Grammar', score: aiResult.grammarScore, color: 'text-accent-1' },
                              { label: 'Vocabulary', score: aiResult.vocabularyScore, color: 'text-accent-3' }
                            ].map((s, idx) => (
                              <div key={idx} className="p-6 bg-black/40 rounded-[28px] flex flex-col items-center justify-center border border-white/5">
                                <div className={cn("text-3xl font-black mb-1", s.color)}>{s.score}</div>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{s.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="p-8 rounded-[32px] bg-primary/10 border border-primary/20">
                            <div className="flex items-start gap-6">
                              <div className="p-3 bg-primary/20 rounded-2xl shrink-0">
                                <Lightbulb className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Neural Recommendation</span>
                                <p className="text-sm leading-relaxed text-slate-300 italic">"{aiResult.feedback}"</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
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
              World-class preparation frameworks for PTE & CELPIP, engineered by international experts.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
          >
            {displayCourses.map((course, index) => (
              <motion.div
                key={course.title}
                variants={itemVariants}
                className="group"
              >
                <Link href={course.href} className="block h-full">
                  <div className="relative h-full p-10 rounded-[48px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:-translate-y-4 hover:border-primary/30 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                    {/* Icon Container */}
                    <div className="mb-10">
                      <div className={cn("inline-flex p-6 rounded-[32px] bg-gradient-to-br shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", course.color)}>
                        <course.icon className={cn("h-10 w-10", course.iconColor)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                      <h3 className="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-lg line-clamp-3">
                        {course.description}
                      </p>

                      <ul className="space-y-4">
                        {course.features.slice(0, 3).map((feature) => (
                          <li key={feature} className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                              <Check className="h-4 w-4" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">View Details</span>
                        <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-2 transition-transform" />
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
                      <a href={LMS_URL} target="_blank" rel="noopener noreferrer">
                        Secure Access <ArrowRight className="ml-4 h-6 w-6" />
                      </a>
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
                  src="/gc.jpg"
                  alt="Grammar Clinic"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
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

      {/* Global Call to Action - Final Impact */}
      <section className="py-24 sm:py-32 relative overflow-hidden bg-[#020617]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.03]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="rounded-[64px] bg-gradient-to-br from-primary/20 via-slate-900 to-accent-1/10 border border-white/10 p-12 sm:p-24 lg:p-32 text-center relative overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"
            />

            <div className="relative z-10 space-y-12">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em]"
                >
                  Global Registration Active
                </motion.div>
                <h2 className="text-6xl sm:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tight">
                  YOUR FUTURE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient italic">REDEFINED.</span>
                </h2>
                <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-medium">
                  Join 5,000+ high-achievers who have already decoded the secret to English proficiency.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button size="xl" className="h-24 px-12 rounded-[32px] bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-[0.2em] text-lg shadow-2xl group" asChild>
                  <a href={LMS_URL} target="_blank" rel="noopener noreferrer">
                    Start Free Trial <Rocket className="ml-4 h-8 w-8 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                  </a>
                </Button>
                <Button variant="outline" size="xl" className="h-24 px-12 rounded-[32px] border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-[0.2em] text-lg backdrop-blur-xl" asChild>
                  <a href={LMS_URL} target="_blank" rel="noopener noreferrer">
                    System Demo
                  </a>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-12 pt-12 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-accent-3" />
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest">Global CDN Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-accent-1" />
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest">AI Scoring 2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
