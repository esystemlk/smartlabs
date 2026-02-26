'use client';
import Link from "next/link";
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
  Bell
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedCheckmark } from "@/components/ui/animated-checkmark";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Layout, Check, X, HelpCircle, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { scorePteWriteEssay } from '@/ai/flows/score-pte-writing-write-essay';
import type { PteWriteEssayOutput } from '@/ai/flows/pte-writing.types';
import { useToast } from "@/hooks/use-toast";
import { useSiteStats } from "@/hooks/use-site-stats";
import { useTestimonials } from "@/hooks/use-testimonials";
import { logTestCompletion } from "@/lib/services/activity.service";
import { EventPopup } from "@/components/events/event-popup";
import { useHomepageCourses, useLearningMethods, useFeatures, useFAQs, useComparisons } from "@/hooks/use-homepage-content";


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
    href: "/pte",
    color: "from-accent-1/20 to-accent-1/5",
    iconColor: "text-accent-1",
    bgGradient: "from-accent-1/10 via-accent-1/5 to-transparent",
    features: ["AI Scoring Practice", "Live Classes", "Full Materials Access", "Mock Tests"],
  },
  {
    title: "IELTS Training",
    description: "Achieve your target band score with comprehensive IELTS preparation.",
    icon: Globe,
    href: "/ielts",
    color: "from-accent-2/20 to-accent-2/5",
    iconColor: "text-accent-2",
    bgGradient: "from-accent-2/10 via-accent-2/5 to-transparent",
    features: ["Speaking Practice", "Writing Feedback", "Full Materials", "Band 8.5+ Strategies"],
  },
  {
    title: "CELPIP Prep",
    description: "Your pathway to Canadian immigration with focused CELPIP training.",
    icon: Zap,
    href: "/celpip",
    color: "from-accent-4/20 to-accent-4/5",
    iconColor: "text-accent-4",
    bgGradient: "from-accent-4/10 via-accent-4/5 to-transparent",
    features: ["Self-Paced Learning", "Video Guides", "Practice Tests", "Expert Tips"],
  },
];

const learningMethods = [
  {
    icon: Video,
    title: "Recorded Classes",
    description: "Access our comprehensive library of recorded sessions anytime, anywhere.",
    color: "bg-accent-1/10 text-accent-1",
    gradient: "from-accent-1/20 to-accent-1/5"
  },
  {
    icon: Users,
    title: "Individual Classes",
    description: "One-on-one personalized sessions with expert instructors.",
    color: "bg-accent-2/10 text-accent-2",
    gradient: "from-accent-2/20 to-accent-2/5",
    href: "https://register.smartlabs.lk"
  },
  {
    icon: Brain,
    title: "AI Scoring Tests",
    description: "Get instant feedback with our advanced AI-powered scoring system.",
    color: "bg-accent-3/10 text-accent-3",
    gradient: "from-accent-3/20 to-accent-3/5"
  },
  {
    icon: BookOpen,
    title: "Grammar Clinic",
    description: "Master English grammar with our specialized clinic sessions.",
    color: "bg-accent-4/10 text-accent-4",
    gradient: "from-accent-4/20 to-accent-4/5"
  },
];

const roadmapSteps = [
  {
    id: "01",
    title: "Join & Diagnose",
    desc: "Take our free AI diagnostic test to identify your strengths and weaknesses.",
    icon: Search,
    color: "text-accent-1",
    bg: "bg-accent-1/10"
  },
  {
    id: "02",
    title: "Personalized Plan",
    desc: "Receive a custom study schedule tailored to your target score and timeline.",
    icon: Map,
    color: "text-accent-2",
    bg: "bg-accent-2/10"
  },
  {
    id: "03",
    title: "AI-Powered Practice",
    desc: "Master every section with unlimited practice and instant AI feedback.",
    icon: Sparkles,
    color: "text-accent-3",
    bg: "bg-accent-3/10"
  },
  {
    id: "04",
    title: "Target Achieved",
    desc: "Confidence to clear the exam and achieve your dream score!",
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
    a: "Our AI scoring engine is built using advanced natural language processing and is continuously refined based on official PTE, IELTS, and CELPIP scoring rubrics. It provides detailed feedback on grammar, vocabulary, coherence, and task achievement to help you improve effectively."
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
    a: "Yes, our support team guides you through the official registration process for PTE, IELTS, and CELPIP to ensure all your details are correct for the test day."
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

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'PTE Score: 85 | Sri Lanka',
    content: 'Smart Labs transformed my preparation journey. The AI feedback and personalized study plan helped me achieve my target score in just 3 weeks!',
    avatar: 'PS',
    color: 'from-accent-1/80 to-accent-3/80',
  },
  {
    name: 'Liam Smith',
    role: 'IELTS Band: 8.5 | Australia',
    content: 'The instructors are incredibly knowledgeable. Their strategies for the speaking section were game-changers. Highly recommended!',
    avatar: 'LS',
    color: 'from-accent-2/80 to-accent-4/80',
  },
  {
    name: 'Nimali Perera',
    role: 'CELPIP Score: 12 | Sri Lanka',
    content: 'The self-paced CELPIP course was perfect for my schedule. The materials are comprehensive and the practice tests are very close to the real exam.',
    avatar: 'NP',
    color: 'from-primary/80 to-accent-2/80',
  },
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
  const { testimonials: realTestimonials } = useTestimonials(3);
  const { courses: realCourses, loading: coursesLoading } = useHomepageCourses();
  const { methods: realMethods, loading: methodsLoading } = useLearningMethods();
  const { features: realFeatures, loading: featuresLoading } = useFeatures();
  const { faqs: realFAQs, loading: faqsLoading } = useFAQs();
  const { comparisons: realComparisons, loading: comparisonsLoading } = useComparisons();

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
    <>
      <EventPopup />
      {/* Hero Section - Ultra Advanced */}
      <section className="relative overflow-hidden min-h-[100vh] flex items-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-[#020617] dark:via-[#0a0e27] dark:to-[#0f0a1e] py-20">
        {/* Animated Particle System */}
        <div className="absolute inset-0 -z-30">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Advanced Grid Pattern */}
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 -z-20 opacity-[0.02] dark:opacity-[0.08]"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"]
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
        </motion.div>

        {/* Dynamic Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 via-accent-3/20 to-accent-1/20 blur-[150px] rounded-full opacity-60 pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-gradient-to-l from-accent-2/15 via-primary/15 to-accent-4/15 blur-[140px] rounded-full opacity-50 pointer-events-none"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left Content Column - Enhanced */}
            <motion.div
              style={{ opacity: heroOpacity }}
              className="lg:col-span-7 text-left space-y-10"
            >
              {/* Premium Badge with Live Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-4 px-5 py-3 rounded-full bg-gradient-to-r from-primary/10 via-accent-3/10 to-accent-1/10 border border-primary/20 backdrop-blur-xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <span className="text-xs font-bold text-foreground/70 dark:text-white/70 uppercase tracking-wider">Live Now</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-7 h-7 rounded-full border-2 border-background bg-gradient-to-br from-primary via-accent-3 to-accent-1"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground dark:text-white tracking-wider">{siteStats?.studentsCount?.toLocaleString() || '5,000'}+ Active Learners</span>
              </motion.div>

              {/* Ultra-Advanced Headline */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3"
                >
                  <h1 className="font-display text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter text-foreground dark:text-white leading-[0.85]">
                    ELEVATE
                  </h1>
                  <div className="flex items-center gap-6">
                    <h1 className="font-display text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 animate-gradient">
                        YOUR
                      </span>
                    </h1>
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="hidden sm:block"
                    >
                      <div className="px-6 py-3 bg-primary/10 border border-primary/30 rounded-2xl backdrop-blur-sm">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-1 bg-gradient-to-r from-primary via-accent-3 to-transparent rounded-full"
                    />
                  </div>
                </motion.div>

                {/* Animated Typewriter */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-4"
                >
                  <TypewriterEffect
                    words={[
                      { text: "ENGLISH", className: "text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-foreground dark:text-white" },
                    ]}
                    className="text-5xl sm:text-6xl lg:text-8xl font-black"
                    cursorClassName="bg-primary h-10 sm:h-14 lg:h-20 w-1 sm:w-2"
                  />
                </motion.div>
              </div>

              {/* Enhanced Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-xl sm:text-2xl text-muted-foreground dark:text-white/70 max-w-2xl leading-relaxed font-medium"
              >
                Experience the convergence of{" "}
                <span className="text-primary font-bold">AI-powered precision</span> and{" "}
                <span className="text-accent-3 font-bold">world-class expertise</span>.
                Real-time scoring, unlimited practice, guaranteed results.
              </motion.p>

              {/* Advanced CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="xl"
                    className="group relative h-16 px-10 rounded-2xl bg-gradient-to-r from-primary via-accent-3 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-white text-lg font-bold transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(79,70,229,0.4)]"
                    asChild
                  >
                    <Link href="/signup">
                      <span className="relative z-10">Start Free Trial</span>
                      <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform relative z-10" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/50 to-accent-3/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="group h-16 px-10 rounded-2xl border-2 border-primary/30 bg-background/80 hover:bg-primary/5 backdrop-blur-xl text-lg text-primary font-bold transition-all hover:scale-105 active:scale-95 hover:border-primary/60"
                    asChild
                  >
                    <a href="https://register.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                      Book Consultation
                      <PlayCircle className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </a>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground dark:text-white">{siteStats?.rating || 5.0}</span>
                    <span className="text-sm text-muted-foreground">({siteStats?.reviewsCount || 1200}+ reviews)</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground dark:text-white">Pearson Trained Educator</span>
                  </div>
                </div>
              </motion.div>

              {/* PREMIUM COURSES HIGHLIGHT - Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="pt-8"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-accent-3/10 to-accent-1/10 border border-primary/20 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black text-foreground dark:text-white uppercase tracking-widest">Featured Courses</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {displayCourses.slice(0, 3).map((course, idx) => (
                    <motion.div
                      key={course.title}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1.6 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group relative"
                    >
                      <Link href={course.href} className="block">
                        {/* Glow Effect */}
                        <div className={`absolute -inset-1 bg-gradient-to-r ${course.color.replace('/20', '/40').replace('/5', '/20')} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />

                        {/* Card */}
                        <div className="relative h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-white/20 dark:border-slate-800/50 rounded-3xl p-6 overflow-hidden transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-2xl">
                          {/* Animated Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${course.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                          {/* Shine Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatDelay: 5,
                              ease: "easeInOut"
                            }}
                          />

                          {/* Content */}
                          <div className="relative z-10 space-y-4">
                            {/* Icon with Pulse Animation */}
                            <motion.div
                              className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${course.color} shadow-lg group-hover:shadow-xl transition-all`}
                              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <course.icon className={`h-8 w-8 ${course.iconColor}`} />
                            </motion.div>

                            {/* Title */}
                            <div>
                              <h3 className="text-xl font-black text-foreground dark:text-white mb-2 group-hover:text-primary transition-colors">
                                {course.title}
                              </h3>
                              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                            </div>

                            {/* Features Count Badge */}
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${course.color} border border-white/20`}>
                                <span className={`text-xs font-black ${course.iconColor}`}>
                                  {course.features.length} Features
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold">Explore</span>
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>

                            {/* Decorative Corner Element */}
                            <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${course.color} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* View All Courses Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="mt-6 text-center"
                >
                  <Link
                    href="#courses"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group"
                  >
                    <span>View All Courses</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Visual Column - Ultra Advanced Dashboard */}
            <motion.div
              style={{
                opacity: heroOpacity,
                scale: heroScale,
              }}
              className="lg:col-span-5 relative hidden lg:block"
            >
              {/* Main 3D Dashboard Card */}
              <motion.div
                animate={{
                  rotateX: mousePosition.y * 0.3,
                  rotateY: -mousePosition.x * 0.3,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="relative z-10 perspective-1000"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-[#0a0e27] dark:via-[#0f172a] dark:to-[#0a0e27] rounded-[48px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-3/5" />

                  {/* Dashboard Content */}
                  <div className="relative p-8 space-y-6 h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-3 w-24 bg-white/10 rounded-full animate-pulse" />
                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Performance Analytics</div>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-3/20 border border-primary/30 flex items-center justify-center"
                      >
                        <Activity className="h-6 w-6 text-primary" />
                      </motion.div>
                    </div>

                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Avg Score", value: "85", color: "from-primary/30 to-primary/10", icon: Target },
                        { label: "Response Time", value: "1.2s", color: "from-accent-3/30 to-accent-3/10", icon: Zap },
                        { label: "Success Rate", value: "95%", color: "from-accent-1/30 to-accent-1/10", icon: TrendingUp },
                        { label: "Students", value: "5K+", color: "from-accent-2/30 to-accent-2/10", icon: Users },
                      ].map((metric, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.5 + i * 0.1 }}
                          className={`relative p-5 bg-gradient-to-br ${metric.color} rounded-3xl border border-white/10 backdrop-blur-sm group hover:scale-105 transition-transform`}
                        >
                          <metric.icon className="h-5 w-5 text-white/40 mb-2" />
                          <div className="text-3xl font-black text-white mb-1">{metric.value}</div>
                          <div className="text-[9px] font-bold tracking-widest text-white/40 uppercase">{metric.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Animated Chart */}
                    <div className="relative h-48 bg-white/5 rounded-3xl border border-white/10 p-6 backdrop-blur-sm overflow-hidden">
                      <div className="absolute top-4 left-6 text-xs font-bold text-white/50 uppercase tracking-widest">Weekly Progress</div>
                      <div className="h-full flex items-end justify-between gap-3 pt-8">
                        {[65, 45, 85, 75, 55, 90, 80].map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: 2 + i * 0.1, ease: "easeOut" }}
                            className="relative flex-1 bg-gradient-to-t from-primary via-accent-3 to-accent-1 rounded-t-xl group"
                          >
                            <motion.div
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                              className="absolute inset-0 bg-white/20 rounded-t-xl"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Achievement Badges */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-8 p-5 bg-gradient-to-br from-primary/90 to-accent-3/90 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl z-20"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -left-6 p-5 bg-gradient-to-br from-accent-1/90 to-accent-2/90 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl z-20"
              >
                <Brain className="h-10 w-10 text-white" />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-1/2 -left-12 px-4 py-3 bg-gradient-to-r from-green-500/90 to-emerald-500/90 rounded-2xl shadow-xl backdrop-blur-xl z-20"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white whitespace-nowrap">AI-Powered</span>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 p-8 glass-card rounded-[40px] border-accent-3/30 z-20 shadow-2xl"
              >
                <Brain className="h-12 w-12 text-accent-3" />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

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
                  Our Founder and Director, Lahiruka Weeraratne, known in the industry as Laheer, is a distinguished expert trainer officially trained by Pearson UK. She specializes in PTE, IELTS, and CELPIP exams—the essential pathways for students and professionals seeking to study, migrate, or settle abroad. With over 6 years of professional experience, she has successfully trained more than 5,000 students, empowering them to achieve their global aspirations.
                </p>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-black tracking-tight">Areas of Expertise</h3>

                <div className="grid gap-6">
                  {[
                    {
                      icon: GraduationCap,
                      title: "Competency Test Training",
                      desc: "PTE, IELTS, CELPIP Mastery",
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

      {/* Success Roadmap - Enhanced Design */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4"
            >
              The Methodology
            </motion.div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">Your Path to <span className="text-primary italic">Excellence</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A proven four-step strategy that has helped over 5,000 students achieve their dreams.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative items-stretch">
            {roadmapSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="relative group p-8 sm:p-10 rounded-[40px] bg-background border border-border/50 hover:border-primary/50 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col"
              >
                <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 shadow-lg group-hover:shadow-primary/20", step.bg, step.color)}>
                  <step.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="text-[60px] font-black opacity-[0.03] absolute top-4 right-8 group-hover:opacity-[0.06] transition-opacity select-none italic">
                  {step.id}
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-4 tracking-tighter">{step.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed flex-grow">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar - Data Driven Excellence */}
      <section className="py-12 border-y bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                value: siteStats?.studentsCount || 5000,
                suffix: "+",
                label: "Students Trained",
                color: "text-accent-1"
              },
              {
                value: siteStats?.successRate || 95,
                suffix: "%",
                label: "Success Rate",
                color: "text-accent-2"
              },
              {
                valueString: siteStats?.targetWeeks || "6–8",
                suffix: " Weeks",
                label: "Target Achievement",
                color: "text-accent-3"
              },
              {
                value: 24,
                suffix: "/7",
                label: "AI Support",
                color: "text-accent-4"
              },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className={cn("text-3xl sm:text-4xl font-black mb-1 transition-transform group-hover:scale-110", stat.color)}>
                  {stat.value ? <AnimatedNumber value={stat.value} /> : stat.valueString}
                  {stat.suffix}
                </div>
                <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Smart Labs Advantage - Detailed Feature Grid */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent-3/5 blur-[120px] rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-4xl sm:text-6xl font-black mb-6 italic">Built for <span className="gradient-text not-italic">Results</span></h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Discover the proprietary technology and expert-led methodologies that make Smart Labs the industry leader.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {displayFeatures.map((feature, i) => (
              <SpotlightCard key={i} className="p-6 sm:p-12 rounded-[40px] border border-border/50 bg-white/5 flex flex-col sm:flex-row gap-8 group">
                <div className={cn("w-20 h-20 rounded-3xl shrink-0 flex items-center justify-center bg-gradient-to-br transition-all group-hover:scale-110 shadow-xl", feature.color)}>
                  <feature.icon className={cn("h-10 w-10", feature.iconColor)} />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section - Smart Labs vs Traditional */}
      <section className="py-16 sm:py-24 lg:py-32 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <h2 className="text-4xl sm:text-6xl font-black mb-8 leading-tight">Forget the <br /><span className="text-primary italic">Old Way</span> of Learning</h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl">Traditional coaching is often disconnected from the actual exam algorithms. Smart Labs bridges that gap with data-driven precision.</p>

              <div className="space-y-6">
                {displayComparisons.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-white/50 border border-white/20 backdrop-blur-sm shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-lg">{item.item}: <span className="text-primary">{item.smartlabs}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[40px] overflow-hidden border border-border/50 shadow-[0_40px_80px_rgba(0,0,0,0.1)]">
              <div className="p-6 sm:p-12 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="pb-8 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Standard Feature</th>
                      <th className="pb-8 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Local Center</th>
                      <th className="pb-8 font-black uppercase text-[10px] tracking-[0.2em] text-primary">Smart Labs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {displayComparisons.map((row, i) => (
                      <tr key={i} className="group hover:bg-white/40 transition-colors">
                        <td className="py-6 font-bold text-sm">{row.item}</td>
                        <td className="py-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <X className="h-3 w-3 text-red-400" />
                            {row.traditional}
                          </div>
                        </td>
                        <td className="py-6 font-black text-sm text-primary">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            {row.smartlabs}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8">
                <Microscope className="h-4 w-4 animate-pulse" />
                <span>Smart Labs AI Lab v2.0</span>
              </div>

              <h2 className="font-display text-4xl sm:text-6xl font-black text-white mb-8 leading-tight text-center lg:text-left">
                Advanced <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-3 to-accent-1 uppercase">Scoring Engine</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                  <Database className="h-6 w-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">Deep Learning</h4>
                  <p className="text-xs text-muted-foreground">Trained on 10M+ authentic exam samples for industry-leading accuracy.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                  <ShieldCheck className="h-6 w-6 text-accent-1 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">Instant Feedback</h4>
                  <p className="text-xs text-muted-foreground">Evaluating grammar, syntax, and cohesion with multi-layer linguistic analysis.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 sm:gap-12 border-t border-white/10 pt-8 mt-8">
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white">99.9%</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-primary">System Up-time</span>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white">0.4s</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-accent-1">Response Latency</span>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive AI Console */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full animate-pulse opacity-50" />

              <SpotlightCard className="glass-card rounded-[32px] sm:rounded-[40px] p-0.5 sm:p-2 border border-white/20 shadow-[0_0_50px_rgba(79,70,229,0.3)] bg-black/40 backdrop-blur-2xl">
                <div className="p-4 sm:p-10 rounded-[30px] sm:rounded-[38px] bg-[#0f172a]/80 border border-white/10">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Terminal className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'} animate-pulse`} />
                        <span className="font-black text-[10px] text-white uppercase tracking-widest whitespace-nowrap">{user ? 'Engine Ready' : 'Authentication Required'}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/5 text-[10px] h-10 px-4 font-black uppercase tracking-widest"
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
                      <RefreshCcw className="h-4 w-4 mr-2" /> REGEN TOPIC
                    </Button>
                  </div>

                  {/* Lab Topic Console */}
                  <div className="mb-6 bg-black/40 p-5 rounded-2xl border border-primary/20 relative group">
                    <div className="absolute top-2 right-4 flex gap-1 items-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <Code2 className="h-3 w-3 text-primary" />
                      <span className="text-[8px] font-mono text-primary uppercase">Topic_ID: {topicId || "----"}</span>
                    </div>
                    <div className="text-[9px] font-black text-primary mb-2 uppercase tracking-[0.2em]">Sample Question</div>
                    <p className="text-sm text-white/90 leading-relaxed font-medium italic">"{topic}"</p>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <Textarea
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        placeholder={user ? "Input your academic response for analysis..." : "Please authenticate to access the AI Lab"}
                        className="min-h-[180px] bg-black/40 border-white/10 focus:border-primary/50 transition-all resize-none text-white/90 placeholder:text-white/20 rounded-2xl p-5 font-mono text-sm leading-relaxed no-scrollbar"
                        disabled={isAnalyzing || !user}
                      />
                      {user && (
                        <div className="absolute bottom-4 right-4 text-[10px] font-black text-white/30 uppercase">
                          {aiText.length} Chars | {aiText.split(/\s+/).filter(Boolean).length} Words
                        </div>
                      )}
                    </div>

                    {isAnalyzing && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex gap-2 items-center">
                            <Activity className="h-4 w-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neutralizing Errors...</span>
                          </div>
                          <span className="text-xs font-black text-white">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-white/5" indicatorClassName="bg-gradient-to-r from-primary via-accent-3 to-accent-1 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                      </div>
                    )}

                    {!isAnalyzing && !analysisComplete && (
                      <Button
                        onClick={handleAnalyze}
                        className="w-full h-14 bg-gradient-to-r from-primary to-accent-3 hover:scale-[1.02] active:scale-95 transition-all text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(79,70,229,0.4)] border-none rounded-2xl"
                        size="lg"
                        disabled={!user || aiText.length < 50}
                      >
                        <Zap className="h-4 w-4 mr-2 fill-white" />
                        ANALYZE NOW
                      </Button>
                    )}

                    {analysisComplete && aiResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary/10 rounded-3xl p-6 border border-primary/20"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                          <div className="p-4 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                            <div className="text-2xl font-black text-primary">{aiResult.overallScore}</div>
                            <div className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Overall Score</div>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                            <div className="text-2xl font-black text-accent-1">{aiResult.grammarScore}</div>
                            <div className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Grammar</div>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                            <div className="text-2xl font-black text-accent-3">{aiResult.vocabularyScore}</div>
                            <div className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Vocabulary</div>
                          </div>
                        </div>
                        <div className="relative bg-black/40 p-5 rounded-2xl border border-white/5 group">
                          <div className="flex items-start gap-4 text-sm text-white/90">
                            <div className="p-2 bg-primary/20 rounded-xl">
                              <Lightbulb className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Tutor Recommendations</span>
                              <p className="text-xs leading-relaxed opacity-80">{aiResult.feedback}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section - Premium Design */}
      <section id="courses" className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-3/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <GraduationCap className="h-4 w-4" />
              <span>Our Premium Courses</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-foreground mb-6">
              Choose Your{" "}
              <span className="gradient-text">Success Path</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              World-class preparation for PTE, IELTS, and CELPIP with AI-powered practice and expert guidance from international trainers.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {displayCourses.map((course, index) => (
              <motion.div
                key={course.title}
                variants={itemVariants}
                className="group"
              >
                <Link
                  href={course.href}
                  className="block h-full"
                >
                  <div className="relative h-full glass-card rounded-3xl p-6 sm:p-8 overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${course.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${course.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <course.icon className={`h-8 w-8 ${course.iconColor}`} />
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6">
                        {course.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-sm">
                            <div className={`p-1 rounded-full ${course.color.replace('/20', '/30').replace('/5', '/20')}`}>
                              <CheckCircle2 className={`h-4 w-4 ${course.iconColor}`} />
                            </div>
                            <span className="text-foreground/80">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                        Explore Course
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Decorative Element */}
                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${course.color} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Methods Section */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-3/10 border border-accent-3/20 text-accent-3 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Flexible Learning Options</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-foreground mb-6">
              Learn Your{" "}
              <span className="gradient-text">Way</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              From recorded classes to individual 1-on-1 sessions, AI tests to specialized grammar clinics.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayMethods.map((method, index) => (
              <motion.div
                key={method.title}
                variants={itemVariants}
                className="group"
              >
                <Link
                  href={method.href || "#"}
                  target={method.href?.startsWith('http') ? "_blank" : "_self"}
                  className={cn(
                    "relative block h-full glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30",
                    !method.href && "pointer-events-none"
                  )}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl`} />

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <motion.div
                      className={`inline-flex p-4 sm:p-5 rounded-2xl ${method.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                    >
                      <method.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </motion.div>
                    <h3 className="font-bold text-lg sm:text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                    {method.href && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Book Now</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Journey Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-20 sm:my-32"
          >
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="font-display text-3xl sm:text-5xl font-black mb-6">Expert <span className="gradient-text">Lifecycle</span></h2>
              <p className="text-lg text-muted-foreground">The proven ecosystem we use to guarantee student success.</p>
            </div>

            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-accent-1/20 via-accent-3/20 to-accent-1/20 -translate-y-1/2 hidden md:block" />

              <div className="grid md:grid-cols-4 gap-8 relative z-10">
                {[
                  { title: 'Assessment', desc: 'AI Diagnostic Test', icon: Scan, color: 'text-accent-1', bg: 'bg-accent-1/10', step: '01' },
                  { title: 'Personal Plan', desc: 'Custom Curriculum', icon: Map, color: 'text-accent-2', bg: 'bg-accent-2/10', step: '02' },
                  { title: 'Mock Tests', desc: 'Exam Simulation', icon: Trophy, color: 'text-accent-3', bg: 'bg-accent-3/10', step: '03' },
                  { title: 'Achievement', desc: 'Target Score', icon: Flag, color: 'text-accent-4', bg: 'bg-accent-4/10', step: '04' },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -10 }}
                    className="h-full"
                  >
                    <SpotlightCard className="glass-card p-6 rounded-2xl border-border/50 text-center relative overflow-hidden group h-full bg-white/5">
                      <div className={`absolute top-0 right-0 p-4 text-4xl font-bold opacity-5 ${step.color}`}>{step.step}</div>
                      <div className={`w-16 h-16 mx-auto rounded-2xl ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`h-8 w-8 ${step.color}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Grammar Clinic Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 sm:mt-16"
          >
            <div className="glass-card rounded-3xl p-6 sm:p-10 lg:p-12 border-2 border-accent-4/30 bg-gradient-to-br from-accent-4/5 to-transparent">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-4/20 text-accent-4 text-sm font-medium mb-4">
                    <BookOpen className="h-4 w-4" />
                    <span>Special Feature</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    Grammar Clinic
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
                    Master English grammar with our specialized clinic sessions. Perfect your language foundation with expert guidance and comprehensive practice materials.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {['Comprehensive Grammar Modules', 'Interactive Exercises', 'Expert Feedback', 'Progress Tracking'].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-accent-4/20">
                          <CheckCircle2 className="h-5 w-5 text-accent-4" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="bg-accent-4 hover:bg-accent-4/90 text-white" asChild>
                    <Link href="/courses">
                      Join Grammar Clinic
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden group shadow-2xl">
                  <Image
                    src="/images/gc.png"
                    alt="Grammar Clinic"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-8 sm:pb-12">
                    <div className="text-center px-4">
                      <p className="text-xl sm:text-2xl font-bold text-white mb-2">Perfect Your Grammar</p>
                      <p className="text-sm text-white/80 max-w-xs mx-auto">Master English mechanics with expert interaction.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Skills Mastery Section */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Target className="h-4 w-4" />
              <span>Complete Skill Development</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-foreground mb-6">
              Master All{" "}
              <span className="gradient-text">Four Skills</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive training in Listening, Speaking, Reading, and Writing with immersive AI feedback loops.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillModules.map((skill, index) => (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border/50 hover:border-primary/30 h-full">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                  >
                    <skill.icon className={`h-12 w-12 sm:h-16 sm:w-16 ${skill.color} mx-auto mb-4`} />
                  </motion.div>
                  <h3 className="font-bold text-xl sm:text-2xl text-foreground mb-2">
                    {skill.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {skill.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-4/10 border border-accent-4/20 text-accent-4 text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              <span>Success Stories</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              What Our Students{" "}
              <span className="gradient-text">Achieve</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of successful students who transformed their futures with Smart Labs
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {(realTestimonials.length > 0 ? realTestimonials : testimonials).map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                className="group"
              >
                <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30">
                  {/* Stars */}
                  <div className="flex items-center gap-1 text-accent-4 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-sm sm:text-base text-foreground mb-6 leading-relaxed flex-grow italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 sm:gap-4 mt-auto">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                        {testimonial.name}
                      </div>
                      <div className="text-xs sm:text-sm text-primary font-medium leading-tight">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Desktop App Section - Premium Visual Update */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden bg-[#0a0f1a]">
        <div className="absolute inset-0 bg-grid-white/[0.03] -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-12 lg:p-16 border border-white/10 relative overflow-hidden group bg-black/40">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/30 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse opacity-40" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-3/20 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 opacity-30" />

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-black uppercase tracking-widest">
                  <Monitor className="h-4 w-4" />
                  <span>Desktop Native Experience</span>
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Smart Labs <br />
                  <span className="gradient-text">On Your PC</span>
                </h2>

                <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
                  Get the most optimized experience with our native Windows application. Built for performance, focus, and seamless learning.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: Zap, text: "Zero-latency AI" },
                    { icon: Bell, text: "Native Notifications" },
                    { icon: ShieldCheck, text: "Secure Platform" },
                    { icon: RefreshCw, text: "Auto Updates" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/90 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold tracking-tight">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
                  <Button
                    size="xl"
                    className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 shadow-[0_10px_40px_rgba(79,70,229,0.4)] rounded-2xl px-10 h-16 font-black uppercase tracking-widest text-sm sm:text-base"
                    asChild
                  >
                    <Link href="/download/windows" className="flex items-center gap-3">
                      <Download className="h-5 w-5" />
                      Download for Windows
                    </Link>
                  </Button>
                  <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center gap-3 sm:gap-0.5 px-4 text-white/40">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-tighter">
                      <Laptop className="h-3 w-3" />
                      <span>Build 2026.02.1</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px]">Windows 10 / 11 Supported</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Advanced UI Mockup - Real LMS/Portal Preview */}
                <div className="relative z-10 rounded-2xl border border-white/10 bg-[#0f172a] shadow-[0_30px_100px_rgba(0,0,0,0.6)] overflow-hidden aspect-video group-hover:border-primary/50 transition-all duration-500 hover:scale-[1.02]">
                  {/* Title Bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 z-20 relative">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="text-[10px] font-bold text-white/40 tracking-wider">LMS PORTAL - DASHBOARD</div>
                    <div className="w-12 h-2" />
                  </div>

                  {/* Real Website/LMS Preview Image */}
                  <div className="relative h-full w-full">
                    <Image
                      src="/images/lms-preview.png"
                      alt="Smart Labs LMS Preview"
                      fill
                      className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />
                  </div>
                </div>

                {/* Floating Elements - Hidden on mobile for clarity */}
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-10 -right-6 p-3 sm:p-5 bg-primary/20 backdrop-blur-2xl border border-primary/30 rounded-2xl sm:rounded-3xl shadow-2xl z-20 hidden sm:block"
                >
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-10 -left-8 p-3 sm:p-5 bg-accent-3/20 backdrop-blur-2xl border border-accent-3/30 rounded-2xl sm:rounded-3xl shadow-2xl z-20 hidden sm:block"
                >
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-accent-3" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-3/10 text-accent-3 text-xs font-black uppercase tracking-widest mb-6">
              <HelpCircle className="h-4 w-4" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Common <span className="gradient-text">Inquiries</span></h2>
            <p className="text-muted-foreground">Everything you need to know about our platform and process.</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {displayFAQs.map((faq, i) => {
              // Type-safe accessor for FAQ properties
              const question = 'question' in faq ? faq.question : (faq as any).q;
              const answer = 'answer' in faq ? faq.answer : (faq as any).a;

              return (
                <AccordionItem key={i} value={`item-${i}`} className="border rounded-[24px] bg-white/40 px-6 sm:px-8 hover:border-primary/50 transition-all data-[state=open]:border-primary/50 data-[state=open]:bg-white overflow-hidden">
                  <AccordionTrigger className="text-left font-bold text-lg hover:no-underline py-6">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.1)]"
          >
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 bg-[#0f172a]" />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.4),transparent_50%)]" />
              <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-accent-3/20 blur-[120px] rounded-full animate-float-slow" />
              <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-accent-1/20 blur-[100px] rounded-full animate-float-medium" />
            </div>

            <div className="relative z-10 p-12 sm:p-20 lg:p-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-[0.3em] mb-8">
                  Available Worldwide
                </div>
                <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.1] max-w-4xl mx-auto">
                  Ready to Transform Your <span className="text-primary italic">Future?</span>
                </h2>
                <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
                  Join the elite group of students who have mastered English proficiency with our AI-powered ecosystem.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    size="xl"
                    className="group bg-primary text-white hover:bg-primary/90 shadow-[0_20px_50px_rgba(79,70,229,0.4)] text-lg px-12 h-16 rounded-2xl w-full sm:w-auto font-bold"
                    asChild
                  >
                    <Link href="/signup">
                      Start Free Trial
                      <Rocket className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="bg-white/5 text-white border-2 border-white/20 hover:bg-white/10 backdrop-blur-xl text-lg px-12 h-16 rounded-2xl w-full sm:w-auto font-bold"
                    asChild
                  >
                    <a href="https://register.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                      Contact Sales
                    </a>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40 text-xs font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Expert Support</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
