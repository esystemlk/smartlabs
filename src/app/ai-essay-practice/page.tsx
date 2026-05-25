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
  Trophy,
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

interface StructureDetail {
  paragraphCount: number;
  paragraphCountCorrect: boolean;
  introduction: string;
  bodyParagraph1: string;
  bodyParagraph2: string;
  conclusion: string;
  overallBalance: string;
  followsIdealStrategy: boolean;
}

interface CoherenceAnalysis {
  oneIdeaPerParagraph: boolean;
  logicalFlow: string;
  paragraphUnity: string;
  sentenceConnection: string;
  transitionQuality: string;
  breakPoints: string[];
}

interface ThesisDevelopment {
  clarityOfThesis: string;
  consistencyOfArguments: string;
  bodySupportsThesis: boolean;
  conclusionProvesThesis: boolean;
  overallAnalysis: string;
}

interface ArgumentativeQuality {
  explanationDepth: string;
  logicQuality: string;
  exampleSupport: string;
  relevanceOfIdeas: string;
  criticalThinking: string;
  weakArguments: string[];
  howToImprove: string[];
}

interface VocabCollocations {
  strongVocabulary: string[];
  collocationsUsed: { collocation: string; evaluation: string }[];
  repetitiveVocabulary: string[];
  awkwardPhrases: string[];
  memorizedLanguage: string[];
}

interface GrammarDetail {
  mistakes: { original: string; corrected: string; explanation: string }[];
  punctuationMistakes: string[];
  awkwardSentences: string[];
  sentenceVariety: string;
}

interface ImprovementPlan {
  top5Weaknesses: string[];
  sentenceCorrections: { original: string; improved: string }[];
  strategicTips: string[];
}

interface TargetScoreAnalysis {
  achieved: boolean;
  gap: number;
  primaryReasons: string[];
  criteriaGaps: { criterion: string; currentScore: number; targetApprox: number; whatToDo: string }[];
  studyPriority: string;
  realisticTimeline: string;
}

interface AIResponse {
  overallBand: number;
  bandLabel: string;
  summaryTitle: string;
  summaryText: string;
  criteria: Criterion[];
  strengths: string[];
  improvements: string[];
  structureAnalysis?: string;
  modelEssay: string;
  reviewedEssayHtml: string;
  actionableFeedback?: { issue: string; howToFix: string }[];
  vocabUpgrades: VocabUpgrade[];
  _metadata?: { modelUsed: string };
  contentAnalysis?: { score: number; reason: string };
  structureDetail?: StructureDetail;
  coherenceAnalysis?: CoherenceAnalysis;
  thesisDevelopment?: ThesisDevelopment;
  argumentativeQuality?: ArgumentativeQuality;
  vocabularyCollocations?: VocabCollocations;
  grammarAnalysis?: GrammarDetail;
  improvementPlan?: ImprovementPlan;
  wouldScore79Plus?: { answer: boolean; explanation: string };
  targetScoreAnalysis?: TargetScoreAnalysis | null;
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
  
  const [targetScore, setTargetScore] = useState<number | null>(null);
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

  const wordCount = essayText && essayText.trim() !== "" ? essayText.trim().split(/\s+/).length : 0;
  
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
          requestModelEssay,
          targetScore: targetScore ?? null
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
    setTargetScore(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Please choose another essay topic.", "info");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filteredTopics = selectedFilter === "All"
    ? (TOPICS || [])
    : (TOPICS || []).filter(t => t.category === selectedFilter);

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
        <div className="fixed top-20 left-0 right-0 z-30 bg-white shadow-md border-b border-slate-200 px-4 py-3 transform transition-all duration-300">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-8">
            {([
              { value: "40", label: "Predicted Topics", icon: <ListChecks size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "85+", label: "Target Band", icon: <Target size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "6", label: "Marking Criteria", icon: <ChartBar size={22} weight="duotone" className="text-[#2563eb]" /> },
              { value: "20 Min", label: "Practice Timer", icon: <Timer size={22} weight="duotone" className="text-[#2563eb]" /> }
            ] || []).map((stat, i) => (
              <div key={i} className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
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
          {([
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
          ] || []).map((item, i) => (
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
            <p className="text-[11px] text-slate-500 font-bold mt-1">Pearson August 2025 scheme — 7 criteria, max 26 points:</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {([
              { name: "Content", scale: "0–6", color: "bg-violet-50 text-violet-700 border-violet-200" },
              { name: "Form", scale: "0–2", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { name: "Development, Structure & Coherence", scale: "0–6", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { name: "General Linguistic Range", scale: "0–6", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { name: "Vocabulary", scale: "0–2", color: "bg-pink-50 text-pink-700 border-pink-200" },
              { name: "Grammar", scale: "0–2", color: "bg-red-50 text-red-700 border-red-200" },
              { name: "Spelling", scale: "0–2", color: "bg-indigo-50 text-indigo-700 border-indigo-200" }
            ] || []).map((pill, i) => (
              <span key={i} className={`px-4 py-2 rounded-full border text-xs font-black tracking-wide ${pill.color} shadow-sm flex items-center gap-1.5`}>
                {pill.name}
                <span className="opacity-60 font-bold text-[10px]">{pill.scale}</span>
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
          <div className="flex flex-nowrap md:flex-wrap gap-2 max-w-full overflow-x-auto no-scrollbar pb-2">
            {(FILTERS || []).map(filter => (
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
          {(filteredTopics || []).map(topic => {
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

            {/* Target Score Selector */}
            {!showResults && (
              <div className="p-5 bg-white border-2 border-slate-200 rounded-2xl mb-6 hover:border-[#f97316]/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} weight="duotone" className="text-[#f59e0b]" />
                    <span className="text-sm font-black text-slate-800">What is Your Target Band Score?</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Optional</span>
                  </div>
                  {targetScore !== null && (
                    <button
                      onClick={() => setTargetScore(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                      disabled={isSubmitting}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Set your goal and the AI will tell you if you reached it — or exactly what is holding you back.
                </p>
                <div className="flex flex-wrap gap-2">
                  {([50, 58, 65, 70, 79, 85, 90] as const).map(score => (
                    <button
                      key={score}
                      onClick={() => setTargetScore(targetScore === score ? null : score)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all border ${
                        targetScore === score
                          ? 'bg-[#f97316] text-white border-[#f97316] shadow-md shadow-orange-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#f97316]/40 hover:bg-orange-50 hover:text-slate-800'
                      }`}
                    >
                      {score}
                      {score === 79 && (
                        <span className={`ml-1 text-[9px] font-black uppercase ${targetScore === score ? 'opacity-80' : 'text-slate-400'}`}>PR</span>
                      )}
                    </button>
                  ))}
                </div>
                {targetScore !== null && (
                  <p className="mt-3 text-xs font-bold text-[#f97316] flex items-center gap-1.5">
                    <Target size={12} weight="bold" />
                    Target: Band {targetScore} — AI will analyse if you reached this goal after marking.
                  </p>
                )}
              </div>
            )}

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

            {/* ── Target Score Analysis ── */}
            {targetScore !== null && aiResult.targetScoreAnalysis && (
              <div className={`p-8 rounded-3xl shadow-sm mb-12 border-2 ${
                aiResult.targetScoreAnalysis.achieved
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                {/* Header row */}
                <div className="flex flex-wrap items-start gap-5 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    aiResult.targetScoreAnalysis.achieved ? 'bg-emerald-100' : 'bg-orange-100'
                  }`}>
                    {aiResult.targetScoreAnalysis.achieved
                      ? <Trophy size={28} weight="duotone" className="text-emerald-600" />
                      : <Target size={28} weight="duotone" className="text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-black mb-2 ${
                      aiResult.targetScoreAnalysis.achieved ? 'text-emerald-700' : 'text-orange-700'
                    }`}>
                      {aiResult.targetScoreAnalysis.achieved
                        ? `Band ${targetScore} Target Achieved!`
                        : `Band ${targetScore} Target Not Yet Reached`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                      <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        Target: <span className="text-slate-900">{targetScore}</span>
                      </span>
                      <span className="text-slate-400 text-base">→</span>
                      <span className={`px-3 py-1.5 rounded-full border ${
                        aiResult.targetScoreAnalysis.achieved
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                          : 'bg-red-100 border-red-200 text-red-700'
                      }`}>
                        Your Score: <span>{aiResult.overallBand}</span>
                      </span>
                      {!aiResult.targetScoreAnalysis.achieved && (
                        <span className="px-3 py-1.5 rounded-full bg-red-100 border border-red-200 text-red-700">
                          Gap: –{aiResult.targetScoreAnalysis.gap} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Achieved — congratulations */}
                {aiResult.targetScoreAnalysis.achieved && (
                  <p className="text-sm text-emerald-800 leading-relaxed bg-emerald-100/60 p-4 rounded-2xl border border-emerald-200">
                    Congratulations! Your essay meets the quality standard for Band {targetScore}. Keep practising to push your score even higher and maintain consistency across different topics.
                  </p>
                )}

                {/* Not achieved — detailed breakdown */}
                {!aiResult.targetScoreAnalysis.achieved && (
                  <>
                    {/* Primary reasons */}
                    {(aiResult.targetScoreAnalysis.primaryReasons || []).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-700 mb-3">
                          Why you have not reached Band {targetScore} yet
                        </h4>
                        <div className="space-y-2">
                          {aiResult.targetScoreAnalysis.primaryReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-white p-3.5 rounded-xl border border-orange-200">
                              <XCircle size={16} weight="duotone" className="text-orange-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-700 leading-relaxed">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Criteria gaps */}
                    {(aiResult.targetScoreAnalysis.criteriaGaps || []).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                          Criteria You Need to Improve
                        </h4>
                        <div className="space-y-3">
                          {aiResult.targetScoreAnalysis.criteriaGaps.map((gap, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <span className="font-black text-sm text-slate-800">{gap.criterion}</span>
                                <div className="flex items-center gap-2 text-xs font-extrabold">
                                  <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700">Now: {gap.currentScore}</span>
                                  <span className="text-slate-300 text-base">→</span>
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">Need: {gap.targetApprox}+</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{gap.whatToDo}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Study priority + timeline */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiResult.targetScoreAnalysis.studyPriority && (
                        <div className="bg-orange-100/80 p-4 rounded-2xl border border-orange-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block mb-2">Top Priority to Reach Band {targetScore}</span>
                          <p className="text-sm font-semibold text-slate-800 flex items-start gap-2 leading-relaxed">
                            <Lightning size={16} weight="duotone" className="text-orange-500 shrink-0 mt-0.5" />
                            {aiResult.targetScoreAnalysis.studyPriority}
                          </p>
                        </div>
                      )}
                      {aiResult.targetScoreAnalysis.realisticTimeline && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Realistic Timeline</span>
                          <p className="text-sm text-slate-700 leading-relaxed">{aiResult.targetScoreAnalysis.realisticTimeline}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Criterion Scoring Bars */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ChartBar size={22} weight="duotone" className="text-[#2563eb]" />
                Section Breakdown
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {(aiResult.criteria || []).map((criterion, i) => {
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

            {/* ── Content Score Analysis ── */}
            {aiResult.contentAnalysis && (
              <div className="p-8 rounded-3xl bg-violet-50/40 border border-violet-200 shadow-sm mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-violet-700 flex items-center gap-2">
                    <Target size={22} weight="duotone" /> Content Analysis
                  </h3>
                  <span className="font-jetbrains text-2xl font-black text-violet-700">
                    {aiResult.contentAnalysis.score}<span className="text-sm font-bold text-violet-400">/6</span>
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{aiResult.contentAnalysis.reason}</p>
              </div>
            )}

            {/* ── Structure Per-Paragraph Analysis ── */}
            {aiResult.structureDetail && (
              <div className="p-8 rounded-3xl bg-amber-50/40 border border-amber-200 mb-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                    <TreeStructure size={22} weight="duotone" /> Essay Structure Analysis
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                      aiResult.structureDetail.paragraphCountCorrect
                        ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                        : 'text-red-700 bg-red-100 border-red-200'
                    }`}>
                      {aiResult.structureDetail.paragraphCount} Paragraphs
                    </span>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                      aiResult.structureDetail.followsIdealStrategy
                        ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                        : 'text-orange-700 bg-orange-100 border-orange-200'
                    }`}>
                      {aiResult.structureDetail.followsIdealStrategy ? 'Ideal Strategy ✓' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {([
                    { label: "Introduction (2 sentences)", content: aiResult.structureDetail.introduction, accent: "border-l-violet-400" },
                    { label: "Body Paragraph 1 (~5 sentences)", content: aiResult.structureDetail.bodyParagraph1, accent: "border-l-blue-400" },
                    { label: "Body Paragraph 2 (~5 sentences)", content: aiResult.structureDetail.bodyParagraph2, accent: "border-l-emerald-400" },
                    { label: "Conclusion (1 sentence)", content: aiResult.structureDetail.conclusion, accent: "border-l-orange-400" },
                  ] as const).map((para, idx) => (
                    <div key={idx} className={`bg-white p-5 rounded-2xl border border-slate-200 border-l-4 ${para.accent}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">{para.label}</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{para.content}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Overall Balance</span>
                  <p className="text-sm text-slate-700">{aiResult.structureDetail.overallBalance}</p>
                </div>
              </div>
            )}

            {/* ── Coherence & Cohesion Analysis ── */}
            {aiResult.coherenceAnalysis && (
              <div className="p-8 rounded-3xl bg-pink-50/40 border border-pink-200 shadow-sm mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-pink-700 flex items-center gap-2">
                    <ArrowRight size={22} weight="duotone" /> Coherence & Cohesion Analysis
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    aiResult.coherenceAnalysis.oneIdeaPerParagraph
                      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                      : 'text-red-700 bg-red-100 border-red-200'
                  }`}>
                    {aiResult.coherenceAnalysis.oneIdeaPerParagraph ? 'One Idea Per Paragraph ✓' : 'Mixed Ideas Detected ✗'}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {([
                    { label: "Logical Flow", content: aiResult.coherenceAnalysis.logicalFlow },
                    { label: "Paragraph Unity", content: aiResult.coherenceAnalysis.paragraphUnity },
                    { label: "Sentence Connection", content: aiResult.coherenceAnalysis.sentenceConnection },
                    { label: "Transition Quality", content: aiResult.coherenceAnalysis.transitionQuality },
                  ] as const).map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 block mb-1">{item.label}</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
                {(aiResult.coherenceAnalysis.breakPoints || []).length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-2">Coherence Break Points</span>
                    <ul className="space-y-1">
                      {aiResult.coherenceAnalysis.breakPoints.map((bp, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5 shrink-0">•</span> {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Thesis Development Analysis ── */}
            {aiResult.thesisDevelopment && (
              <div className="p-8 rounded-3xl bg-blue-50/40 border border-blue-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-5">
                  <Brain size={22} weight="duotone" /> Thesis Development Analysis
                </h3>
                <div className="flex flex-wrap gap-3 mb-5">
                  {([
                    { label: "Body Supports Thesis", value: aiResult.thesisDevelopment.bodySupportsThesis },
                    { label: "Conclusion Proves Thesis", value: aiResult.thesisDevelopment.conclusionProvesThesis },
                  ] as const).map((check, idx) => (
                    <span key={idx} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                      check.value
                        ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                        : 'text-red-700 bg-red-100 border-red-200'
                    }`}>
                      {check.value
                        ? <CheckCircle size={14} weight="duotone" />
                        : <XCircle size={14} weight="duotone" />}
                      {check.label}
                    </span>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {([
                    { label: "Clarity of Thesis", content: aiResult.thesisDevelopment.clarityOfThesis },
                    { label: "Consistency of Arguments", content: aiResult.thesisDevelopment.consistencyOfArguments },
                    { label: "Overall Analysis", content: aiResult.thesisDevelopment.overallAnalysis },
                  ] as const).map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-1">{item.label}</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Argumentative Quality ── */}
            {aiResult.argumentativeQuality && (
              <div className="p-8 rounded-3xl bg-emerald-50/40 border border-emerald-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2 mb-6">
                  <Lightbulb size={22} weight="duotone" /> Argumentative Quality
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {([
                    { label: "Explanation Depth", content: aiResult.argumentativeQuality.explanationDepth },
                    { label: "Logic Quality", content: aiResult.argumentativeQuality.logicQuality },
                    { label: "Example Support", content: aiResult.argumentativeQuality.exampleSupport },
                    { label: "Relevance of Ideas", content: aiResult.argumentativeQuality.relevanceOfIdeas },
                    { label: "Critical Thinking", content: aiResult.argumentativeQuality.criticalThinking },
                  ] as const).map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">{item.label}</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
                {(aiResult.argumentativeQuality.weakArguments || []).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Weak Arguments & How to Improve</h4>
                    {aiResult.argumentativeQuality.weakArguments.map((weak, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                          <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1 block">Weak Argument</span>
                          <p className="text-sm text-slate-700 font-medium italic">&ldquo;{weak}&rdquo;</p>
                        </div>
                        <div className="hidden md:block w-px bg-slate-100 shrink-0" />
                        <div className="md:w-1/2">
                          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1 block">How to Improve</span>
                          <p className="text-sm text-slate-600">{(aiResult.argumentativeQuality?.howToImprove || [])[idx] || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Vocabulary & Collocations ── */}
            {aiResult.vocabularyCollocations && (
              <div className="p-8 rounded-3xl bg-amber-50/40 border border-amber-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 mb-6">
                  <Star size={22} weight="duotone" /> Vocabulary & Collocations
                </h3>
                {(aiResult.vocabularyCollocations.collocationsUsed || []).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Collocations Found in Essay</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-amber-200 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                            <th className="py-2 px-4">Collocation</th>
                            <th className="py-2 px-4">Evaluation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {aiResult.vocabularyCollocations.collocationsUsed.map((col, idx) => (
                            <tr key={idx} className="bg-white/60 hover:bg-white transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-700">{col.collocation}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                  col.evaluation.toLowerCase().includes('natural')
                                    ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                                    : col.evaluation.toLowerCase().includes('forced') || col.evaluation.toLowerCase().includes('incorrect')
                                    ? 'text-red-700 bg-red-100 border-red-200'
                                    : 'text-amber-700 bg-amber-100 border-amber-200'
                                }`}>
                                  {col.evaluation}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {(aiResult.vocabularyCollocations.strongVocabulary || []).length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-2">Strong Vocabulary</span>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.vocabularyCollocations.strongVocabulary.map((word, idx) => (
                          <span key={idx} className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">{word}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(aiResult.vocabularyCollocations.repetitiveVocabulary || []).length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-2">Repetitive Vocabulary</span>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.vocabularyCollocations.repetitiveVocabulary.map((word, idx) => (
                          <span key={idx} className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">{word}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(aiResult.vocabularyCollocations.awkwardPhrases || []).length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-2">Awkward Phrases</span>
                      <ul className="space-y-1">
                        {aiResult.vocabularyCollocations.awkwardPhrases.map((phrase, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-orange-500 shrink-0">•</span>{phrase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(aiResult.vocabularyCollocations.memorizedLanguage || []).length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-2">Memorized / Robotic Language</span>
                      <ul className="space-y-1">
                        {aiResult.vocabularyCollocations.memorizedLanguage.map((phrase, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-purple-500 shrink-0">•</span>{phrase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Grammar Analysis ── */}
            {aiResult.grammarAnalysis && (
              <div className="p-8 rounded-3xl bg-red-50/30 border border-red-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-6">
                  <PencilLine size={22} weight="duotone" /> Grammar Analysis
                </h3>
                {aiResult.grammarAnalysis.sentenceVariety && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Sentence Variety</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{aiResult.grammarAnalysis.sentenceVariety}</p>
                  </div>
                )}
                {(aiResult.grammarAnalysis.mistakes || []).length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Grammar Corrections</h4>
                    <div className="space-y-3">
                      {aiResult.grammarAnalysis.mistakes.map((mistake, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                          <div className="flex flex-col md:flex-row gap-3 mb-3">
                            <div className="md:w-1/2">
                              <span className="text-[9px] font-black uppercase text-red-500 tracking-widest block mb-1">Original</span>
                              <p className="text-sm text-slate-700 italic">&ldquo;{mistake.original}&rdquo;</p>
                            </div>
                            <div className="hidden md:flex items-center text-slate-300 text-lg shrink-0">→</div>
                            <div className="md:w-1/2">
                              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Corrected</span>
                              <p className="text-sm text-emerald-700 font-semibold">&ldquo;{mistake.corrected}&rdquo;</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{mistake.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(aiResult.grammarAnalysis.punctuationMistakes || []).length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Punctuation Issues</span>
                    <ul className="space-y-1">
                      {aiResult.grammarAnalysis.punctuationMistakes.map((issue, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-red-500 shrink-0">•</span>{issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(aiResult.grammarAnalysis.awkwardSentences || []).length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Awkward Sentences</span>
                    <ul className="space-y-2">
                      {aiResult.grammarAnalysis.awkwardSentences.map((sentence, idx) => (
                        <li key={idx} className="text-sm text-slate-600 italic flex items-start gap-2">
                          <span className="text-orange-500 not-italic shrink-0">•</span>{sentence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Final Improvement Plan ── */}
            {aiResult.improvementPlan && (
              <div className="p-8 rounded-3xl bg-indigo-50/40 border border-indigo-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2 mb-6">
                  <TrendUp size={22} weight="duotone" /> Final Improvement Plan
                </h3>
                <div className="mb-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Top 5 Weaknesses</h4>
                  <div className="space-y-2">
                    {(aiResult.improvementPlan.top5Weaknesses || []).map((weakness, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {(aiResult.improvementPlan.sentenceCorrections || []).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Sentence-Level Corrections</h4>
                    <div className="space-y-3">
                      {aiResult.improvementPlan.sentenceCorrections.map((correction, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                          <div className="mb-2">
                            <span className="text-[9px] font-black uppercase text-red-500 tracking-widest block mb-1">Original</span>
                            <p className="text-sm text-slate-600 italic">&ldquo;{correction.original}&rdquo;</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Improved Version</span>
                            <p className="text-sm text-emerald-700 font-semibold">&ldquo;{correction.improved}&rdquo;</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(aiResult.improvementPlan.strategicTips || []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Strategic Tips to Increase Score Quickly</h4>
                    <div className="space-y-2">
                      {aiResult.improvementPlan.strategicTips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
                          <Lightning size={16} weight="duotone" className="text-indigo-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Would Score 79+? Verdict ── */}
            {aiResult.wouldScore79Plus && (
              <div className={`p-8 rounded-3xl shadow-sm mb-8 border-2 ${
                aiResult.wouldScore79Plus.answer
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black ${
                    aiResult.wouldScore79Plus.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {aiResult.wouldScore79Plus.answer ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-black mb-2 ${
                      aiResult.wouldScore79Plus.answer ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {aiResult.wouldScore79Plus.answer
                        ? 'Yes — this essay would realistically score 79+ in PTE Writing.'
                        : 'No — this essay would not realistically score 79+ in PTE Writing.'}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      aiResult.wouldScore79Plus.answer ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {aiResult.wouldScore79Plus.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              
              {/* Strengths card */}
              <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
                <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2 mb-6">
                  <CheckCircle size={22} weight="duotone" /> Core Strengths
                </h3>
                <ul className="space-y-4">
                  {(aiResult.strengths || []).map((str, idx) => (
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
                  {(aiResult.improvements || []).map((imp, idx) => (
                    <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start gap-3">
                      <span className="text-orange-600 text-base leading-none shrink-0">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Structure Analysis (legacy string fallback) */}
            {typeof aiResult.structureAnalysis === 'string' && aiResult.structureAnalysis.trim() !== "" && (
              <div className="p-8 rounded-3xl bg-amber-50/40 border border-amber-200 mb-12 shadow-sm">
                <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 mb-4">
                  <TreeStructure size={22} weight="duotone" /> Essay Structure & Flow
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed italic">
                  {aiResult.structureAnalysis}
                </p>
              </div>
            )}

            {/* Actionable Feedback Details */}
            {aiResult.actionableFeedback && aiResult.actionableFeedback.length > 0 && (
              <div className="p-8 rounded-3xl bg-blue-50/40 border border-blue-200 shadow-sm mb-12">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-6">
                  <Warning size={22} weight="duotone" /> Detailed Issues & Fixes
                </h3>
                <div className="space-y-6">
                  {(aiResult.actionableFeedback || []).map((item, idx) => (
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
                    {(aiResult.vocabUpgrades || []).map((upgrade, idx) => (
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
        {(toasts || []).map(toast => (
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
