'use client';
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import Image from 'next/image';
import {
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
  Scan,
  Activity,
  BarChart3,
  Map,
  Navigation,
  Trophy,
  Flag,
  Lightbulb,
  Cpu,
  RefreshCw
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedCheckmark } from "@/components/ui/animated-checkmark";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { scorePteWriteEssay } from '@/ai/flows/score-pte-writing-write-essay';
import type { PteWriteEssayOutput } from '@/ai/flows/pte-writing.types';
import { useToast } from "@/hooks/use-toast";

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
    features: ["Speaking Practice", "Writing Feedback", "Mock Tests", "Band 9 Strategies"],
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
    gradient: "from-accent-2/20 to-accent-2/5"
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

const skillModules = [
  {
    icon: Headphones,
    title: "Listening",
    description: "Advanced listening comprehension techniques",
    color: "text-accent-1"
  },
  {
    icon: MessageSquare,
    title: "Speaking",
    description: "Fluency and pronunciation mastery",
    color: "text-accent-2"
  },
  {
    icon: BookOpen,
    title: "Reading",
    description: "Speed reading and comprehension strategies",
    color: "text-accent-3"
  },
  {
    icon: PenTool,
    title: "Writing",
    description: "Essay writing and grammar perfection",
    color: "text-accent-4"
  },
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

import { SpotlightCard } from "@/components/ui/spotlight-card";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export default function Home() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [aiText, setAiText] = useState("");
  const [progress, setProgress] = useState(0);
  const [aiResult, setAiResult] = useState<PteWriteEssayOutput | null>(null);
  const [topic, setTopic] = useState(sampleTopics[0]);
  const [usageCount, setUsageCount] = useState<number | null>(null);

  // Set random topic on mount
  useEffect(() => {
    setTopic(sampleTopics[Math.floor(Math.random() * sampleTopics.length)]);
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
      {/* Hero Section - The Intelligent Future */}
      <section className="relative overflow-hidden min-h-[95vh] flex items-center justify-center bg-background">
        {/* Futuristic Grid Background */}
        <div className="absolute inset-0 -z-20 bg-grid-black/[0.05] dark:bg-grid-white/[0.05]" />
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background via-transparent to-background" />

        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-accent-3/10 blur-[100px] rounded-full opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent-1/10 blur-[100px] rounded-full opacity-40 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-16 sm:mb-24">
            {/* New Generation Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 mb-8 hover:scale-105 transition-transform cursor-default"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent-3 bg-clip-text text-transparent">
                Introducing Smart Labs 2.0
              </span>
            </motion.div>

            {/* Massive Headline */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
            >
              The New Standard in <br />
              <div className="mt-2">
                <TypewriterEffect
                  words={[
                    { text: "English", className: "text-blue-400 dark:text-blue-400" },
                    { text: "Mastery", className: "text-purple-400 dark:text-purple-400" },
                  ]}
                  className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight"
                  cursorClassName="bg-purple-400 h-10 lg:h-24 w-1 lg:w-2"
                />
              </div>
              {/* Fallback/SEO hidden text could go here if needed */}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Experience the convergence of expert pedagogy and advanced AI. <br className="hidden sm:block" />
              Real-time scoring. Infinite practice. Guaranteed results.
            </motion.p>

            {/* Futuristic CTA Group */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="xl"
                className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 text-lg w-full sm:w-auto transition-all hover:scale-105"
                asChild
              >
                <Link href="/signup">
                  Start Learning Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="h-14 px-8 rounded-2xl border-2 hover:bg-secondary/50 backdrop-blur-sm text-lg w-full sm:w-auto transition-all hover:scale-105"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Watch Interactive Demo
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* 3D Floating Interface Visual */}
          <div className="relative perspective-1000 h-[400px] sm:h-[500px] lg:h-[600px] w-full max-w-6xl mx-auto mt-10 sm:mt-0">
            {/* Main Dashboard Card */}
            <motion.div
              initial={{ opacity: 0, rotateX: 20, y: 100 }}
              animate={{ opacity: 1, rotateX: 10, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="absolute inset-x-4 top-0 bottom-20 bg-background/80 backdrop-blur-xl rounded-t-3xl border border-white/20 shadow-2xl overflow-hidden transform-style-3d group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              {/* Fake UI Header */}
              <div className="h-12 border-b border-border/50 flex items-center px-6 gap-4 bg-white/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="h-2 w-32 bg-border rounded-full opacity-50" />
              </div>

              {/* Dashboard Content */}
              <div className="p-8 grid grid-cols-3 gap-8 h-full">
                {/* Sidebar */}
                <div className="hidden md:block col-span-1 border-r border-border/50 pr-8 space-y-6 opacity-60">
                  <div className="h-8 w-3/4 bg-primary/20 rounded-lg animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-border/50 rounded" />
                    <div className="h-4 w-5/6 bg-border/50 rounded" />
                    <div className="h-4 w-4/6 bg-border/50 rounded" />
                  </div>
                </div>

                {/* Main Area */}
                <div className="col-span-3 md:col-span-2 space-y-6">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="h-4 w-24 bg-primary/20 rounded mb-2" />
                      <div className="text-3xl font-bold font-display">Target Score Analysis</div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold animate-pulse">Live</div>
                  </div>

                  {/* Graph Concept */}
                  <div className="h-48 w-full bg-gradient-to-r from-primary/5 via-accent-3/5 to-accent-1/5 rounded-2xl border border-border/50 relative overflow-hidden flex items-end justify-between px-6 pb-0 pt-10">
                    {[40, 65, 50, 80, 75, 90, 85].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                        className="w-8 bg-gradient-to-t from-primary to-accent-3 rounded-t-lg opacity-80"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 1: Success Rate */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-20 w-64 glass-card p-5 rounded-2xl border-l-4 border-accent-2 shadow-xl hidden lg:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-2/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-accent-2" />
                </div>
                <div className="font-bold text-lg">95% Success</div>
              </div>
              <p className="text-sm text-muted-foreground">Students reaching target score within 6 weeks</p>
            </motion.div>

            {/* Floating Card 2: AI Feedback */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-4 top-40 w-72 glass-card p-5 rounded-2xl border-l-4 border-accent-1 shadow-xl hidden lg:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-1/20 rounded-lg">
                  <Brain className="h-6 w-6 text-accent-1" />
                </div>
                <div className="font-bold text-lg">AI Analysis</div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Pronunciation</span>
                  <span className="font-bold text-accent-1">92/90</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full w-[92%] bg-accent-1 rounded-full" />
                </div>
              </div>
            </motion.div>

            {/* Floating Card 3: Live Classes */}
            <motion.div
              animate={{ y: [-15, 5, -15] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute left-20 bottom-32 w-56 glass-card p-4 rounded-2xl border-l-4 border-accent-3 shadow-xl hidden lg:block z-20"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                    {/* Avatar placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-accent-3 to-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <div className="font-bold text-sm">Live Class</div>
                  <div className="text-xs text-muted-foreground">Join 400+ students</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Scorer Interactive Demo */}
      <section className="relative py-16 sm:py-24 bg-background overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-1/10 text-accent-1 text-sm font-medium mb-6">
                <Scan className="h-4 w-4 animate-pulse" />
                <span>Live Tech Demo</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Experience Our <br />
                <span className="gradient-text">AI Scoring Engine</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Test our advanced NLP algorithms right now.
                Get instant feedback on grammar, vocabulary, and cohesion—just like in the real exam.
                <br /><br />
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {user ? `Tests Used: ${usageCount ?? '...'} / 5` : "* Requires Login (Limit: 5 free tests/user)"}
                </span>
              </p>

              <div className="space-y-4 mb-8">
                {['Instant Grammar Check', 'Vocabulary Analysis', 'Cohesion Scoring', 'Real-time Feedback'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent-1/10 flex items-center justify-center flex-shrink-0">
                      <Cpu className="h-4 w-4 text-accent-1" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">1.2M+</span> Essays Scored
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">99.8%</span> Accuracy
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Widget */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-1 to-accent-3 blur-3xl opacity-20 rounded-full" />
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/20 relative shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="font-semibold text-sm">{user ? 'Engine Ready' : 'Login Required'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setAiText("");
                    setAiResult(null);
                    setAnalysisComplete(false);
                    setIsAnalyzing(false);
                    setProgress(0);
                    setTopic(sampleTopics[Math.floor(Math.random() * sampleTopics.length)]);
                  }} disabled={isAnalyzing}>
                    <RefreshCw className="h-4 w-4 mr-2" /> New Topic
                  </Button>
                </div>

                {/* Topic Display */}
                <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-white/5">
                  <div className="text-xs font-bold text-accent-1 mb-1 uppercase tracking-wider">Current Topic</div>
                  <p className="text-sm text-foreground/90 leading-snug italic">"{topic}"</p>
                </div>

                <div className="space-y-4">
                  <Textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder={user ? "Write your response here..." : "Please login to start writing..."}
                    className="min-h-[150px] bg-white/5 border-white/10 resize-none text-base focus:ring-accent-1"
                    disabled={isAnalyzing || !user}
                  />

                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-accent-1 animate-pulse">Analyzing structure...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-accent-1 to-accent-3" />
                    </div>
                  )}

                  {!isAnalyzing && !analysisComplete && (
                    <Button onClick={handleAnalyze} className="w-full bg-accent-1 hover:bg-accent-1/90 text-white shadow-lg shadow-accent-1/25" size="lg" disabled={!user}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {user ? 'Analyze Text' : 'Login to Analyze'}
                    </Button>
                  )}

                  {analysisComplete && aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent-1/10 rounded-xl p-4 border border-accent-1/20"
                    >
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="p-2 bg-background/40 rounded-lg">
                          <div className="text-xl font-bold text-accent-1">{aiResult.overallScore}/13</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Overall</div>
                        </div>
                        <div className="p-2 bg-background/40 rounded-lg">
                          <div className="text-xl font-bold text-accent-2">{aiResult.grammarScore}/2</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Vocab</div>
                        </div>
                        <div className="p-2 bg-background/40 rounded-lg">
                          <div className="text-xl font-bold text-accent-3">{aiResult.vocabularyScore}/2</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Cohesion</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-foreground/90 bg-background/50 p-3 rounded-lg max-h-32 overflow-y-auto scrollbar-thin">
                        <Lightbulb className="h-4 w-4 text-accent-2 flex-shrink-0 mt-0.5" />
                        <p className="whitespace-pre-line text-xs sm:text-sm">{aiResult.feedback}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section - Premium Design */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
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
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Choose Your{" "}
              <span className="gradient-text">Success Path</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              World-class preparation for PTE, IELTS, and CELPIP with AI-powered practice and expert guidance
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {courses.map((course, index) => (
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
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Learn Your{" "}
              <span className="gradient-text">Way</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              From recorded classes to individual sessions, AI tests to grammar clinics - everything you need in one place
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {learningMethods.map((method, index) => (
              <motion.div
                key={method.title}
                variants={itemVariants}
                className="group"
              >
                <div className="relative h-full glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30">
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
                  </div>
                </div>
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
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Your Path to <span className="gradient-text">Success</span></h2>
              <p className="text-muted-foreground">The proven 4-step framework we use to guarantee results</p>
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
                <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-4/20 to-primary/20 flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="h-20 w-20 sm:h-24 sm:w-24 text-accent-4 mx-auto mb-4 animate-float" />
                      <p className="text-lg sm:text-xl font-semibold text-foreground">Perfect Your Grammar</p>
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
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Master All Four{" "}
              <span className="gradient-text">Skills</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive training in Listening, Speaking, Reading, and Writing with AI-powered feedback
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
            {testimonials.map((testimonial, index) => (
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

      {/* CTA Section - Futuristic Design */}
      <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent-3 to-accent-1" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse-glow" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  Ready to Transform Your Future?
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed">
                  Join thousands of successful students. Start your free trial today with AI-powered tests, expert instruction, and personalized learning paths.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="xl"
                    className="group bg-white text-primary hover:bg-white/90 shadow-2xl text-base sm:text-lg px-8 py-6 w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/signup">
                      <Rocket className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-bounce" />
                      Start Free Trial Now
                      <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 backdrop-blur-xl shadow-xl text-base sm:text-lg px-8 py-6 w-full sm:w-auto"
                    asChild
                  >
                    <a href="https://register.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                      Book Individual Session
                    </a>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-white/80 text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span>Cancel Anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span>24/7 Support</span>
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
