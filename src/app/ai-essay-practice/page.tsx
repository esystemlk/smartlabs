'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PencilLine,
  Timer,
  Target,
  BookOpenText,
  Lightning,
  CheckCircle,
  XCircle,
  Warning,
  Info,
  ArrowUp,
  ListChecks,
  Sparkle,
  Notebook,
  ArrowsClockwise,
  CaretDown,
  Star,
  TrendUp,
  Lightbulb,
  TreeStructure,
  Books,
  ArrowRight,
  Exam,
  Brain,
  ChartBar,
} from '@phosphor-icons/react';

interface Topic {
  id: number;
  text: string;
  category: string;
}

interface Criterion {
  name: string;
  score: number;
  max: number;
  color: string;
  comment: string;
}

interface VocabUpgrade {
  basic: string;
  better: string;
}

interface AIResponse {
  overallBand: number;
  bandLabel: string;
  summaryTitle: string;
  summaryText: string;
  criteria: Criterion[];
  strengths: string[];
  improvements: string[];
  structureAnalysis: string;
  modelEssay: string;
  reviewedEssayHtml: string;
  actionableFeedback?: { issue: string; howToFix: string }[];
  vocabUpgrades: VocabUpgrade[];
  _metadata?: {
    modelUsed: string;
  };
}

const TOPICS: Topic[] = [
  { id: 1, text: "Some people believe that students learn better by watching other students. To what extent do you agree or disagree?", category: "Education" },
  { id: 2, text: "Many people around the world want to study in foreign universities. Do you think the advantages of studying abroad outweigh the disadvantages?", category: "Education" },
  { id: 3, text: "Some people think that students should focus on achieving good grades. Others, however, believe that education should be aimed at developing students' individual potential. Discuss both views and give your opinion.", category: "Education" },
  { id: 4, text: "Students should be encouraged to evaluate their own teachers. To what extent do you agree or disagree?", category: "Education" },
  { id: 5, text: "There is an increasing number of people in many countries who do not have a job. What are the reasons for this? What are the solutions?", category: "Economy" },
  { id: 6, text: "Some people think that the government should pay for health care, while others believe that it is the individual's responsibility. Discuss both views and give your opinion.", category: "Society" },
  { id: 7, text: "Some people say that we should live in the present and not worry about the future. To what extent do you agree or disagree?", category: "Society" },
  { id: 8, text: "Some people think that the best way to stay healthy is to follow a balanced diet. Others believe that regular exercise is more important. Discuss both views and give your opinion.", category: "Health" },
  { id: 9, text: "Some people believe that children should be taught how to be good members of society. Others think that children should be taught academic subjects. Discuss both views and give your opinion.", category: "Education" },
  { id: 10, text: "Some people believe that schools should focus on academic skills, while others think schools should focus on life skills. Discuss both views and give your opinion.", category: "Education" },
  { id: 11, text: "Some people think that digital communication is destroying face-to-face communication. To what extent do you agree or disagree?", category: "Technology" },
  { id: 12, text: "Some people think that the government should spend money on improving public transportation, while others believe the government should spend money on improving roads. Discuss both views and give your opinion.", category: "Travel" },
  { id: 13, text: "Many people believe that the internet is a blessing. However, some people think that it has more negative impacts than positive impacts. Discuss both views and give your own opinion.", category: "Technology" },
  { id: 14, text: "Some people think that parents should teach their children how to be independent. Others think that parents should teach their children to depend on others. Discuss both views and give your opinion.", category: "Education" },
  { id: 15, text: "Some people believe that machines will soon take over the work done by human beings. To what extent do you agree or disagree?", category: "Technology" },
  { id: 16, text: "Some people believe that friends are more important than family. To what extent do you agree or disagree?", category: "Society" },
  { id: 17, text: "Some people think that universities should only offer subjects that help students get jobs, while others believe all subjects should be available. Discuss both views and give your opinion.", category: "Education" },
  { id: 18, text: "Some people think that a sense of competition in children should be encouraged. Others believe that children who are taught to cooperate rather than compete become more useful adults. Discuss both views.", category: "Education" },
  { id: 19, text: "In many countries, a small number of people earn extremely high salaries. Some people believe that this is good for the country, while others think the government should control salaries. Discuss.", category: "Economy" },
  { id: 20, text: "Some people believe that it is best to accept a bad situation such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both views.", category: "Society" },
  { id: 21, text: "City life is more exciting than life in the country. To what extent do you agree or disagree?", category: "Society" },
  { id: 22, text: "Some people think that new homes should be built in the countryside, while others think people should be encouraged to live in cities. Discuss both views and give your opinion.", category: "Society" },
  { id: 23, text: "Some people think that the most important thing in a job is having a high income. To what extent do you agree or disagree?", category: "Economy" },
  { id: 24, text: "Some people believe that the government should tax fast food. To what extent do you disagree or agree?", category: "Society" },
  { id: 25, text: "Some people believe that climate change is caused by human activities. To what extent do you agree or disagree?", category: "Environment" },
  { id: 26, text: "Medical technology is responsible for increasing the average life expectancy. Do you think it is a curse or a blessing?", category: "Health" },
  { id: 27, text: "What are the advantages and problems of cheaper public transportation? Give your opinion from your own experience.", category: "Travel" },
  { id: 28, text: "For a less developed country, the disadvantages of tourism are as great as the advantages. Please discuss this statement, and explain your opinion.", category: "Travel" },
  { id: 29, text: "Some universities deduct marks from students' work if it is given late. What is your opinion? What other actions do you recommend?", category: "Education" },
  { id: 30, text: "Television serves many useful functions. To what extent do you agree with this? Explain why with your own experience.", category: "Media" },
  { id: 31, text: "Do you think experiential learning (i.e. learning by doing) can work well in high schools or colleges?", category: "Education" },
  { id: 32, text: "Many education systems assess students' learning using formal written examinations. To what extent do you agree or disagree?", category: "Education" },
  { id: 33, text: "Some believe the value of travel is highly overrated. 'One brilliant scholar never leaves the home base.' To what extent do you agree?", category: "Travel" },
  { id: 34, text: "Many countries spend large amounts of money on the restoration of historic buildings rather than on modern housing. To what extent do you agree or disagree with this analysis?", category: "Society" },
  { id: 35, text: "While artificial intelligence becomes so advanced, people can use computers to translate foreign languages. That makes learning a foreign language unnecessary. To what extent do you agree?", category: "Technology" },
  { id: 36, text: "Age restrictions are placed on many activities. Give an example, state which minimum age you think it should be and share your own experience.", category: "Society" },
  { id: 37, text: "Many people say there should be a maximum wage for high-paying jobs as some people are paid too much. Do you support that?", category: "Economy" },
  { id: 38, text: "Some people prefer to live in cities, while some people prefer to live in the countryside. Which is better for you? Give your reasons.", category: "Society" },
  { id: 39, text: "People who are famous entertainers or sportspeople should give up the right to privacy as this is the price of fame. To what extent do you agree or disagree?", category: "Media" },
  { id: 40, text: "The world's governments and international organizations confront a multitude of global problems. Which do you think is the most pressing problem for the inhabitants of our planet and give the solution?", category: "Global" }
];

const FILTERS = ["All", "Education", "Technology", "Society", "Health", "Environment", "Economy", "Travel", "Media", "Global"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Education: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  Technology: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Health: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Society: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Environment: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  Economy: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Travel: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Media: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  Global: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" }
};

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function AIEssayPractice() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const [showWritingArea, setShowWritingArea] = useState(false);
  const [essayText, setEssayText] = useState("");
  const [requestModelEssay, setRequestModelEssay] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const writingAreaRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            showToast("Time is up! You have reached the 20-minute limit.", "warning");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Cubic-bezier progress bar animation trigger
  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => {
        setAnimateProgress(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAnimateProgress(false);
    }
  }, [showResults]);

  const selectTopicHandler = (topic: Topic) => {
    setSelectedTopic(topic);
    showToast(`Topic #${topic.id} Selected!`, 'success');
  };

  const startWritingHandler = () => {
    if (!selectedTopic) return;
    setShowWritingArea(true);
    setEssayText("");
    setTimeLeft(1200);
    setIsTimerRunning(true);
    
    // Clear old results
    setShowResults(false);
    setAiResult(null);

    // Scroll to writing area
    setTimeout(() => {
      writingAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const wordCount = essayText.trim() === "" ? 0 : essayText.trim().split(/\s+/).length;
  
  const getWordCountColor = () => {
    if (wordCount >= 180 && wordCount <= 260) return "text-emerald-600";
    if (wordCount > 260) return "text-red-600 bg-red-50 px-2 py-0.5 rounded";
    return "text-orange-600";
  };

  const submitEssayHandler = async () => {
    if (wordCount < 50) {
      showToast("Your essay is too short. A minimum of 50 words is required to mark.", "error");
      return;
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const response = await fetch('/api/score-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: selectedTopic?.text,
          essay: essayText,
          wordCount,
          requestModelEssay
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process essay.");
      }

      const result: AIResponse = await response.json();
      setAiResult(result);
      setShowResults(true);
      showToast("Evaluation complete! View your Band Score below.", "success");

      // Scroll to results section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error: any) {
      console.error(error);
      setIsTimerRunning(true); // resume timer if error occurs
      showToast(error.message || "An error occurred with Gemini marking. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tryAgainHandler = () => {
    setEssayText("");
    setTimeLeft(1200);
    setIsTimerRunning(true);
    setShowResults(false);
    setAiResult(null);
    showToast("Environment Reset. Timer restarted!", "info");
    
    setTimeout(() => {
      writingAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const chooseDifferentTopicHandler = () => {
    setSelectedTopic(null);
    setShowWritingArea(false);
    setShowResults(false);
    setAiResult(null);
    setEssayText("");
    setIsTimerRunning(false);
    setTimeLeft(1200);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Please choose another essay topic.", "info");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filteredTopics = selectedFilter === "All"
    ? TOPICS
    : TOPICS.filter(t => t.category === selectedFilter);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sora selection:bg-[#f97316]/20 selection:text-slate-900 custom-scrollbar pb-24">
      {/* CSS Injections for custom styling */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;700&family=Sora:wght@300;400;500;600;700;800&display=swap');
        
        .font-sora {
          font-family: 'Sora', sans-serif;
        }
        .font-display-serif {
          font-family: 'DM Serif Display', serif;
        }
        .font-jetbrains {
          font-family: 'JetBrains Mono', monospace;
        }

        .dot-grid-light {
          background-size: 32px 32px;
          background-image: radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px);
        }

        /* Custom Scrollbars for light theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>

      {/* Sticky Selected Topic Banner at Top */}
      {selectedTopic && (
        <div className="fixed top-20 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-lg px-4 py-3 transform transition-all duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-3/4">
              <span className="shrink-0 bg-[#f97316] text-white font-black text-xs px-2.5 py-1 rounded">
                TOPIC #{selectedTopic.id}
              </span>
              <p className="text-sm font-semibold text-slate-700 truncate italic">
                &ldquo;{selectedTopic.text}&rdquo;
              </p>
            </div>
            <button
              onClick={startWritingHandler}
              className="shrink-0 w-full md:w-auto justify-center bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
            >
              <PencilLine size={18} weight="bold" />
              <span>Start Writing</span>
              <CaretDown size={14} weight="bold" className="animate-bounce" />
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-28 pb-16 dot-grid-light border-b border-slate-200">
        {/* Decorative Radial Gradients - soft for white theme */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-100/40 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Logo row */}
          <div className="flex justify-center items-center gap-3 mb-8">
            <Link href="/" className="font-extrabold text-2xl tracking-tight text-slate-900 flex items-center gap-1 group">
              <span className="hover:text-slate-600 transition-colors">SMART</span>
              <span className="text-[#f97316] transition-transform duration-300 group-hover:scale-105">LABS</span>
            </Link>
            <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase shadow">
              PTE 2026
            </span>
          </div>

          {/* Tagline */}
          <div className="inline-flex items-center gap-2 text-[#f97316] font-bold text-xs uppercase tracking-[0.2em] mb-4 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200">
            <Brain size={14} weight="duotone" />
            AI-Powered Essay Practice
          </div>

          {/* H1 Title */}
          <h1 className="font-display-serif text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mb-6">
            PTE Essay Practice & <span className="text-[#f97316] italic">Marking</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed mb-12">
            Select any predicted essay topic, write your answer, and receive instant AI feedback with a Band score, detailed analysis, and a model essay — all based on real PTE marking criteria.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-8">
            {[
              { value: "40", label: "Predicted Topics", icon: <ListChecks size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "85+", label: "Target Band", icon: <Target size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "6", label: "Marking Criteria", icon: <ChartBar size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "20 Min", label: "Practice Timer", icon: <Timer size={22} weight="duotone" className="text-[#2563eb]" /> }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-3xl font-black text-[#f97316] mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="text-center mb-16">
          <h2 className="font-display-serif text-3xl md:text-4xl font-black text-slate-900">How It Works</h2>
          <p className="text-slate-500 mt-2 text-sm font-semibold tracking-wider uppercase">Master PTE Writing in three simple steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "Step 1",
              title: "Pick a Topic",
              desc: "Choose from 40 high-probability predicted PTE 2026 questions across various categories.",
              icon: <BookOpenText size={28} weight="duotone" className="text-[#2563eb]" />
            },
            {
              step: "Step 2",
              title: "Write Your Essay",
              desc: "Use the 20-minute timer. Aim for 220–260 words with a clear 4-paragraph structure.",
              icon: <PencilLine size={28} weight="duotone" className="text-[#f97316]" />
            },
            {
              step: "Step 3",
              title: "Get AI Feedback",
              desc: "Receive a Band score, criterion-by-criterion marks, strengths, weaknesses & a model essay.",
              icon: <Lightning size={28} weight="duotone" className="text-[#f59e0b]" />
            }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white border border-slate-200 hover:border-[#f97316]/40 transition-all group duration-300 shadow-sm hover:shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-[#f97316] font-black text-xs uppercase tracking-widest block mb-4">
                {item.step}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#f97316] transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MARKING SCHEME BAR */}
      <section className="py-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="shrink-0 text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#f97316] flex items-center gap-2">
              <Exam size={18} weight="duotone" />
              Official Scoring Rubric
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1">Our AI evaluates essays against 6 core parameters:</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[
              { name: "Content", color: "bg-violet-50 text-violet-700 border-violet-200" },
              { name: "Form", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { name: "Development & Coherence", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { name: "Grammar", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { name: "General Linguistic Range", color: "bg-red-50 text-red-700 border-red-200" },
              { name: "Vocabulary Range", color: "bg-pink-50 text-pink-700 border-pink-200" },
              { name: "Spelling", color: "bg-indigo-50 text-indigo-700 border-indigo-200" }
            ].map((pill, i) => (
              <span key={i} className={`px-4 py-2 rounded-full border text-xs font-black tracking-wide ${pill.color} shadow-sm`}>
                {pill.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TOPIC SELECTION GRID */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="font-display-serif text-3xl md:text-4xl font-black text-slate-900">Select Practice Topic</h2>
            <p className="text-slate-500 text-sm mt-1">Select a high-probability exam topic to start your practice session</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto no-scrollbar pb-2">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  selectedFilter === filter
                    ? "bg-[#f97316] text-white border-[#f97316] shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map(topic => {
            const isSelected = selectedTopic?.id === topic.id;
            const catColors = CATEGORY_COLORS[topic.category] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
            
            return (
              <div
                key={topic.id}
                onClick={() => selectTopicHandler(topic)}
                className={`relative p-6 rounded-3xl bg-white border-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg ${
                  isSelected
                    ? "border-[#f97316] shadow-orange-100"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-jetbrains text-xs font-bold text-slate-400">
                    Topic #{topic.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                    {topic.category}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-slate-700">
                  &ldquo;{topic.text}&rdquo;
                </p>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f97316]"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WRITING AREA */}
      {showWritingArea && selectedTopic && (
        <section ref={writingAreaRef} className="py-20 bg-slate-50 border-t border-b border-slate-200 animate-slide-up scroll-mt-28">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header with Timer */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 pb-6 border-b border-slate-200">
              <div className="flex-1">
                <span className="text-[#f97316] font-black text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <PencilLine size={14} weight="bold" />
                  Active Practice Session
                </span>
                <h3 className="text-xl font-bold text-slate-900 leading-relaxed">
                  &ldquo;{selectedTopic.text}&rdquo;
                </h3>
              </div>
              <div className="shrink-0 flex items-center gap-3 bg-white border border-red-200 px-5 py-3 rounded-2xl shadow-sm">
                <Timer size={18} weight="duotone" className="text-red-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Time Left</span>
                <span className="font-jetbrains text-2xl font-black text-red-500 tabular-nums">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Tips Bar */}
            <div className="p-4 bg-blue-50 border-l-4 border-[#2563eb] rounded-r-2xl text-xs text-slate-600 leading-relaxed mb-8 flex flex-wrap gap-x-6 gap-y-2">
              <span className="flex items-center gap-1"><Notebook size={14} weight="duotone" className="text-[#2563eb]" /> <strong>220–260 words ideal</strong></span>
              <span className="flex items-center gap-1"><TreeStructure size={14} weight="duotone" className="text-[#2563eb]" /> Intro → Body 1 → Body 2 → Conclusion</span>
              <span className="flex items-center gap-1"><ArrowRight size={14} weight="duotone" className="text-[#2563eb]" /> Use linking words</span>
              <span className="flex items-center gap-1"><Target size={14} weight="duotone" className="text-[#2563eb]" /> Include counter-argument</span>
            </div>

            {/* Textarea Input */}
            <div className="relative mb-6">
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Type your essay response here... Plan your structure, address all viewpoints, and write at least 50 words to receive marks."
                className="w-full min-h-[380px] bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-8 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 transition-all font-sans text-base leading-relaxed resize-none custom-scrollbar"
                disabled={isSubmitting}
              />
              <div className="absolute bottom-6 right-8 flex items-center gap-4 text-xs font-semibold">
                <span className="text-slate-400 font-jetbrains">
                  {essayText.length} Chars
                </span>
                <span className={`font-jetbrains font-bold ${getWordCountColor()}`}>
                  {wordCount} Words
                </span>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 font-medium">
                  PTE essays are scored based on coherence, lexical resource, and grammatical accuracy.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={requestModelEssay}
                      onChange={(e) => setRequestModelEssay(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <div className={`w-10 h-5 bg-slate-200 rounded-full shadow-inner transition-colors ${requestModelEssay ? 'bg-[#2563eb]' : ''}`}></div>
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${requestModelEssay ? 'translate-x-5' : ''}`}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#2563eb] transition-colors flex items-center gap-1.5">
                    <Books size={14} weight="duotone" />
                    Include Band 85+ Model Essay
                  </span>
                </label>
              </div>
              <button
                onClick={submitEssayHandler}
                disabled={isSubmitting || essayText.trim().length === 0}
                className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1a4fd6] text-white font-extrabold px-10 py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Evaluating Essay...</span>
                  </>
                ) : (
                  <>
                    <Target size={20} weight="bold" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 6. RESULTS SECTION */}
      {showResults && aiResult && (
        <section ref={resultsRef} className="py-20 border-t border-slate-200 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-4">
            
            <div className="text-center mb-16">
              <span className="text-[#f97316] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-2">
                <ChartBar size={14} weight="bold" />
                Evaluation Summary
              </span>
              <h2 className="font-display-serif text-4xl font-black text-slate-900">Your Essay Result</h2>
            </div>

            {/* Score Ring & Overall Summary */}
            <div className="grid md:grid-cols-3 gap-8 items-center mb-12 bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[32px] border border-slate-200 shadow-sm">
              
              {/* Score circle */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative w-40 h-40 rounded-full border-4 border-[#f59e0b] flex flex-col items-center justify-center bg-white shadow-[0_0_30px_rgba(245,158,11,0.12)] transition-transform hover:scale-105 duration-300">
                  <span className="text-slate-400 font-jetbrains text-xs font-bold uppercase tracking-widest">PTE Band</span>
                  <span className="text-5xl font-black text-[#f59e0b] font-jetbrains my-1">{aiResult.overallBand}</span>
                  <span className="text-slate-400 text-[10px] font-bold">Max 90</span>
                </div>
                <div className="mt-4 text-center">
                  <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-black tracking-wider uppercase border border-amber-200">
                    {aiResult.bandLabel}
                  </span>
                </div>
              </div>

              {/* Overall Feedback Card */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkle size={24} weight="duotone" className="text-[#f59e0b]" />
                  {aiResult.summaryTitle}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base font-medium">
                  {aiResult.summaryText}
                </p>
                <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Notebook size={14} weight="duotone" /> Essay Length: <strong className="text-slate-700">{essayText.trim().split(/\s+/).filter(Boolean).length} words</strong></span>
                  <span className="flex items-center gap-1"><Timer size={14} weight="duotone" /> Practice Time: <strong className="text-slate-700">{Math.floor((1200 - timeLeft) / 60)} mins { (1200 - timeLeft) % 60 } secs</strong></span>
                </div>
              </div>

            </div>

            {/* Criterion Scoring Bars */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ChartBar size={22} weight="duotone" className="text-[#2563eb]" />
                Section Breakdown
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {aiResult.criteria.map((criterion, i) => {
                  const percent = (criterion.score / criterion.max) * 100;
                  
                  return (
                    <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
                      {/* Circular Progress */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={criterion.color}
                            strokeWidth="3.5"
                            strokeDasharray="100, 100"
                            strokeDashoffset={animateProgress ? 100 - percent : 100}
                            strokeLinecap="round"
                            className="transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-jetbrains text-xl font-black leading-none" style={{ color: criterion.color }}>
                            {criterion.score}
                          </span>
                          <span className="font-jetbrains text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            / {criterion.max}
                          </span>
                          <span className="font-jetbrains text-[8px] font-bold mt-0.5 opacity-70" style={{ color: criterion.color }}>
                            {Math.round(percent)}%
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm mb-1.5">
                          {criterion.name}
                        </h4>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          {criterion.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              
              {/* Strengths card */}
              <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
                <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2 mb-6">
                  <CheckCircle size={22} weight="duotone" /> Core Strengths
                </h3>
                <ul className="space-y-4">
                  {aiResult.strengths.map((str, idx) => (
                    <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start gap-3">
                      <span className="text-emerald-600 text-base leading-none shrink-0">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements card */}
              <div className="p-8 rounded-3xl bg-orange-50/60 border border-orange-200 shadow-sm">
                <h3 className="text-lg font-bold text-orange-700 flex items-center gap-2 mb-6">
                  <Lightbulb size={22} weight="duotone" /> Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {aiResult.improvements.map((imp, idx) => (
                    <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start gap-3">
                      <span className="text-orange-600 text-base leading-none shrink-0">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Structure Analysis */}
            <div className="p-8 rounded-3xl bg-amber-50/40 border border-amber-200 mb-12 shadow-sm">
              <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 mb-4">
                <TreeStructure size={22} weight="duotone" /> Essay Structure & Flow
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed italic">
                {aiResult.structureAnalysis}
              </p>
            </div>

            {/* Model Essay */}
            {aiResult.modelEssay && aiResult.modelEssay.trim() !== "" && (
              <div className="p-8 rounded-3xl bg-emerald-50/30 border border-emerald-200 shadow-sm mb-12">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                    <Books size={22} weight="duotone" /> Band 85+ Model Essay
                  </h3>
                  <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    Ideal Response
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-slate-200 custom-scrollbar max-h-[350px] overflow-y-auto">
                  {aiResult.modelEssay}
                </p>
              </div>
            )}

            {/* Reviewed Essay (Grammar/Spelling corrections) */}
            {aiResult.reviewedEssayHtml && aiResult.reviewedEssayHtml.trim() !== "" && (
              <div className="p-8 rounded-3xl bg-red-50/30 border border-red-200 shadow-sm mb-12">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                    <PencilLine size={22} weight="duotone" /> Spelling & Grammar Review
                  </h3>
                  <span className="text-[10px] font-black text-red-700 uppercase bg-red-100 px-3 py-1 rounded-full border border-red-200">
                    Hover red lines to view corrections
                  </span>
                </div>
                <div 
                  className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-slate-200 custom-scrollbar max-h-[350px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: aiResult.reviewedEssayHtml }}
                />
              </div>
            )}

            {/* Actionable Feedback Details */}
            {aiResult.actionableFeedback && aiResult.actionableFeedback.length > 0 && (
              <div className="p-8 rounded-3xl bg-blue-50/40 border border-blue-200 shadow-sm mb-12">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-6">
                  <Warning size={22} weight="duotone" /> Detailed Issues & Fixes
                </h3>
                <div className="space-y-6">
                  {aiResult.actionableFeedback.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/2">
                        <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1 block">What went wrong</span>
                        <p className="text-sm text-slate-700 font-medium">{item.issue}</p>
                      </div>
                      <div className="hidden md:block w-px bg-slate-100"></div>
                      <div className="md:w-1/2">
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1 block">How to improve</span>
                        <p className="text-sm text-slate-600">{item.howToFix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary Upgrades */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 mb-16 overflow-hidden shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendUp size={22} weight="duotone" className="text-[#2563eb]" /> Vocabulary Upgrade Recommendations
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                      <th className="py-3 px-4">Basic Word (Used)</th>
                      <th className="py-3 px-4">Premium Alternative</th>
                      <th className="py-3 px-4">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiResult.vocabUpgrades.map((upgrade, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-500">{upgrade.basic}</td>
                        <td className="py-4 px-4 font-extrabold text-emerald-600">{upgrade.better}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-400">Boosts Lexical Resource score</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={tryAgainHandler}
                className="w-full sm:w-auto bg-[#f97316] hover:bg-[#fb923c] text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <ArrowsClockwise size={18} weight="bold" /> Try Again
              </button>
              <button
                onClick={chooseDifferentTopicHandler}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-extrabold px-8 py-3.5 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <ListChecks size={18} weight="bold" /> Choose Different Topic
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 font-extrabold px-8 py-3.5 rounded-xl transition-all hover:scale-[1.02] text-sm flex items-center justify-center gap-2"
              >
                <ArrowUp size={18} weight="bold" /> Back to Top
              </button>
            </div>

          </div>
        </section>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-semibold shadow-xl animate-slide-up bg-white text-slate-800 min-w-[280px] max-w-sm ${
              toast.type === 'success' ? 'border-emerald-300 text-emerald-700' :
              toast.type === 'error' ? 'border-red-300 text-red-700' :
              toast.type === 'warning' ? 'border-amber-300 text-amber-700' :
              'border-blue-300 text-slate-700'
            }`}
          >
            <span className="text-base shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} weight="duotone" className="text-emerald-600" />}
              {toast.type === 'error' && <XCircle size={20} weight="duotone" className="text-red-600" />}
              {toast.type === 'warning' && <Warning size={20} weight="duotone" className="text-amber-600" />}
              {toast.type === 'info' && <Info size={20} weight="duotone" className="text-blue-600" />}
            </span>
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
