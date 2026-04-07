'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bot,
    Send,
    Sparkles,
    ArrowLeft,
    MessageSquare,
    Zap,
    BookOpen,
    HelpCircle,
    Lightbulb,
    RotateCcw,
    ChevronRight,
    Mic,
    PenTool,
    Loader2,
    Menu,
    LayoutDashboard,
    Library,
    Target,
    Activity,
    Save,
    Share2,
    Trash2,
    History,
    Clock,
    Globe,
    Shield,
    Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { chatWithAiTutor } from '@/ai/flows/ai-tutor-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';
import { useAiTutorGuides } from '@/hooks/use-ai-tutor-guides';
import { useAiTutorPerformance } from '@/hooks/use-ai-tutor-performance';


const tutorPersona = {
    pte: { name: 'AI Alpha', color: 'text-accent-1', bg: 'bg-accent-1/10', border: 'border-accent-1/20', accent: 'accent-1' },
    ielts: { name: 'IELTS Sage', color: 'text-accent-2', bg: 'bg-accent-2/10', border: 'border-accent-2/20', accent: 'accent-2' },
    celpip: { name: 'CELPIP Pro', color: 'text-accent-3', bg: 'bg-accent-3/10', border: 'border-accent-3/20', accent: 'accent-3' }
};

export default function AITutorClassroom() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const courseId = params.course as string;
    const persona = (tutorPersona as any)[courseId] || tutorPersona.pte;

    const { guides: guideSteps, loading: guidesLoading, error: guidesError } = useAiTutorGuides(courseId);
    const { performanceData, setPerformanceData, loading: performanceLoading, error: performanceError, savePerformance } = useAiTutorPerformance(courseId);

    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: `Hello! I am ${persona.name}, your expert ${courseId.toUpperCase()} examiner. I'm here to help you achieve a perfect score (Band 9 / PTE 90). How shall we begin your practice session?` }
    ]);
    const [savedInsights, setSavedInsights] = useState<any[]>([]);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [sessionProgress, setSessionProgress] = useState(15);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setInput(prev => prev + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
            };
        }
    }, []);

    useEffect(() => {
        const savedMessages = localStorage.getItem(`chat_messages_${courseId}`);
        const savedVault = localStorage.getItem(`vault_${courseId}`);

        if (savedMessages) setMessages(JSON.parse(savedMessages));
        if (savedVault) setSavedInsights(JSON.parse(savedVault));
    }, [courseId]);

    useEffect(() => {
        localStorage.setItem(`chat_messages_${courseId}`, JSON.stringify(messages));
    }, [messages, courseId]);

    useEffect(() => {
        localStorage.setItem(`vault_${courseId}`, JSON.stringify(savedInsights));
    }, [savedInsights, courseId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, activeTab]);

    const updatePerformanceFromResponse = useCallback((response: string) => {
        const scoreMatch = response.match(/\[!SCORE_RESULT\][\s\S]*?\*\*Total Score\*\*:\s*(\d+)/i);
        if (scoreMatch) {
            const total = parseInt(scoreMatch[1]);
            const updatedPerformance = {
                ...performanceData,
                speaking: Math.min(performanceData.speaking + 2, 98),
                volatility: [...performanceData.volatility.slice(1), total]
            };
            setPerformanceData(updatedPerformance);
            savePerformance(updatedPerformance);
            toast({
                title: "Progress Updated",
                description: `New score recorded: ${total}%`,
            });
        }
    }, [performanceData, setPerformanceData, savePerformance, toast]);

    const handleSend = async (customText?: string) => {
        const text = customText || input;
        if (!text.trim()) return;

        const userMessage = { role: 'user', content: text, timestamp: new Date() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        setSessionProgress(prev => Math.min(prev + 5, 100));

        try {
            const response = await chatWithAiTutor({
                courseId,
                messages: newMessages as any
            });

            if (response) {
                updatePerformanceFromResponse(response);
                setMessages([...newMessages, { role: 'assistant', content: response, timestamp: new Date() }]);
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Connection Error",
                description: "The AI Tutor is currently unreachable."
            });
        } finally {
            setIsTyping(false);
        }
    };

    const toggleRecording = () => {
        if (!isRecording) {
            if (!recognitionRef.current) {
                toast({ variant: "destructive", title: "Not Supported", description: "Voice recognition is not supported in this browser." });
                return;
            }
            setIsRecording(true);
            setRecordingTime(0);
            recognitionRef.current.start();
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            toast({ title: "Voice Active", description: "Listening to your response..." });
        } else {
            setIsRecording(false);
            recognitionRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            toast({ title: "Voice Captured", description: "Processing your speaking practice." });
        }
    };

    const saveToVault = (msg: any) => {
        if (savedInsights.find(m => m.content === msg.content)) {
            toast({ title: "Already Saved", description: "This insight is already in your vault." });
            return;
        }
        setSavedInsights(prev => [msg, ...prev]);
        toast({ title: "Saved to Vault", description: "You can review this in the Library tab." });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const LearningGuideContent = () => {
        if (guidesLoading) {
            return <div className="text-center text-muted-foreground">Loading study guide...</div>;
        }
        if (guidesError) {
            return <div className="text-center text-red-500">Error loading guide.</div>;
        }
        return (
            <div className="flex flex-col h-full bg-background mt-4">
                <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {guideSteps.map((step: any, i: number) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="p-5 rounded-[1.5rem] bg-card border-2 border-border/50 hover:border-primary/50 transition-all group cursor-default"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    {i + 1}
                                </div>
                                <h4 className="font-black text-xs uppercase tracking-widest">{step.title}</h4>
                            </div>
                            <p className="text-[11px] leading-relaxed font-medium text-muted-foreground italic">
                                "{step.content}"
                            </p>
                        </motion.div>
                    ))}

                    <div className="mt-8 p-6 rounded-[2rem] bg-primary text-white space-y-4 shadow-xl shadow-primary/20 overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Zap className="h-24 w-24 fill-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4" />
                                <h4 className="font-black italic text-sm">Exam Focus</h4>
                            </div>
                            <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-widest mb-4">
                                Smart analysis suggests a potential 12% score increase by improving your pronunciation today.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full rounded-xl font-black text-[10px] h-10 tracking-widest hover:scale-105 active:scale-95 transition-all mb-3 bg-white text-primary" onClick={() => handleSend("START MOCK TEST")}>
                                START FULL MOCK TEST
                            </Button>
                            <Button variant="outline" size="sm" className="w-full rounded-xl font-black text-[10px] h-10 tracking-widest hover:scale-105 active:scale-95 transition-all bg-transparent text-white border-white/20 hover:bg-white/10" onClick={() => handleSend("Give me a quick practice question")}>
                                QUICK PRACTICE
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (guidesLoading || performanceLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg text-muted-foreground">Loading AI Tutor session...</p>
            </div>
        );
    }

    if (guidesError || performanceError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-red-500">Error: {guidesError || performanceError}</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Desktop Left Sidebar */}
            <div className="hidden lg:flex w-80 flex-col border-r bg-muted/10 backdrop-blur-sm">
                <div className="p-6 border-b">
                    <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em] text-primary">
                        <BookOpen className="h-4 w-4" /> Study Guide
                    </h2>
                </div>
                <div className="flex-grow overflow-hidden p-6">
                    <LearningGuideContent />
                </div>
                <div className="p-6 border-t bg-muted/20">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                            <span>Session Integrity</span>
                            <span>{sessionProgress}%</span>
                        </div>
                        <Progress value={sessionProgress} className="h-1.5 bg-primary/10" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col relative bg-card/5">
                {/* Header Navigation */}
                <div className="px-4 py-3 lg:p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 hover:bg-primary/5">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        {/* Course Info */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className={cn("hidden sm:flex h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm", persona.bg, persona.border)}>
                                <Bot className={cn("h-5 w-5", persona.color)} />
                            </div>
                            <div>
                                <h1 className="font-black text-sm lg:text-base flex items-center gap-2 leading-none">
                                    {persona.name} <span className="hidden xs:inline-block"><Badge variant="outline" className="h-4 text-[8px] font-black px-1.5">{courseId.toUpperCase()}</Badge></span>
                                </h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Matrix Sync: 100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher Controls */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                        <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50">
                            <TabsTrigger value="chat" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-primary data-[state=active]:text-white">
                                <MessageSquare className="h-3 w-3 mr-2" /> Chat
                            </TabsTrigger>
                            <TabsTrigger value="insights" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-primary data-[state=active]:text-white">
                                <Activity className="h-3 w-3 mr-2" /> Stats
                            </TabsTrigger>
                            <TabsTrigger value="library" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-primary data-[state=active]:text-white">
                                <Library className="h-3 w-3 mr-2" /> Library
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-1 lg:gap-2">
                        {/* Mobile Menu Trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="lg:hidden rounded-xl h-10 w-10 border-2">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] border-r-2 p-0 bg-background">
                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle className="text-left font-black tracking-widest text-primary flex items-center gap-2 uppercase italic text-sm">
                                        <BookOpen className="h-4 w-4" /> Learning Guide
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="p-6 h-[calc(100vh-100px)]">
                                    <LearningGuideContent />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-2 hidden sm:flex" onClick={() => setMessages([messages[0]])}>
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button className="rounded-xl h-10 px-4 gap-2 bg-primary font-black tracking-[0.1em] text-[10px] shadow-lg shadow-primary/10">
                            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden xs:inline">UPGRADE</span>
                        </Button>
                    </div>
                </div>

                {/* Content Area Based on Tabs */}
                <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="h-full flex flex-col"
                            >
                                {/* Chat Messages Space */}
                                <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 no-scrollbar scroll-smooth">
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                        >
                                            <div className={cn("max-w-[92%] sm:max-w-[85%] flex items-start gap-3 lg:gap-4", msg.role === 'user' ? 'flex-row-reverse' : '')}>
                                                <div className={cn("h-8 w-8 lg:h-10 lg:w-10 shrink-0 rounded-xl lg:rounded-2xl flex items-center justify-center border shadow-sm",
                                                    msg.role === 'assistant' ? cn(persona.bg, persona.border) : 'bg-muted border-border/50'
                                                )}>
                                                    {msg.role === 'assistant' ? <Bot className={cn("h-4 w-4 lg:h-5 lg:w-5", persona.color)} /> : <History className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />}
                                                </div>
                                                <div className={cn("p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] text-[13px] lg:text-sm font-medium leading-relaxed shadow-sm transition-all relative overflow-hidden",
                                                    msg.role === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-xl shadow-primary/10'
                                                        : 'bg-background border-2 border-border/50 rounded-tl-none text-foreground'
                                                )}>
                                                    {msg.role === 'assistant' && (
                                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                                    )}
                                                    <div className="flex items-center justify-between mb-2 opacity-50 relative z-10">
                                                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                            {msg.role === 'assistant' ? persona.name : 'Student Voice'}
                                                            {msg.role === 'assistant' && <Sparkles className="h-3 w-3" />}
                                                        </div>
                                                        {msg.role === 'assistant' && (
                                                            <button
                                                                onClick={() => saveToVault(msg)}
                                                                className="hover:text-primary transition-colors p-1"
                                                            >
                                                                <Save className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative z-10">
                                                        <Markdown content={msg.content} />
                                                    </div>
                                                    {msg.role === 'assistant' && i > 0 && (
                                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/10">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted p-0">
                                                                <Save className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted p-0">
                                                                <Share2 className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={cn("h-8 w-8 lg:h-10 lg:w-10 rounded-xl lg:rounded-2xl flex items-center justify-center border animate-pulse", persona.bg, persona.border)}>
                                                    <Loader2 className={cn("h-4 w-4 lg:h-5 lg:w-5 animate-spin", persona.color)} />
                                                </div>
                                                <div className="bg-background border-2 border-border/50 p-4 rounded-xl rounded-tl-none italic text-[11px] text-muted-foreground font-bold flex items-center gap-2 shadow-sm">
                                                    Neural processing... <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Suggestion Chips */}
                                <div className="hidden lg:block px-8 pt-4">
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {[
                                            { icon: Zap, text: 'START MOCK TEST' },
                                            { icon: MessageSquare, text: 'Fill in the blanks' },
                                            { icon: Mic, text: 'Speaking Task' },
                                            { icon: PenTool, text: 'Writing Practice' }
                                        ].map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(suggestion.text)}
                                                className="shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-muted/40 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-[9.5px] font-black uppercase tracking-widest whitespace-nowrap active:scale-95 shadow-sm"
                                            >
                                                <suggestion.icon className="h-3.5 w-3.5 text-primary" />
                                                {suggestion.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Input Dock */}
                                <div className="p-4 lg:p-8 bg-background/80 backdrop-blur-md border-t pb-24 md:pb-8">
                                    <div className="max-w-4xl mx-auto">
                                        <div className="relative group">
                                            {isRecording && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute -top-16 left-0 right-0 bg-background/80 backdrop-blur-3xl border-2 border-primary/20 p-4 rounded-[2rem] flex items-center justify-between px-6 shadow-2xl z-50"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1 h-6">
                                                            {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 2, 1].map((h, i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{ height: [8, h * 4, 8] }}
                                                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                                                                    className="w-1 bg-primary rounded-full"
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Voice Practice Active</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-mono font-black text-foreground">{formatTime(recordingTime)}</span>
                                                        <Button onClick={toggleRecording} size="sm" variant="destructive" className="h-8 rounded-full px-4 font-black text-[9px] uppercase tracking-widest">
                                                            Stop & Send
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center gap-2">
                                                <div className="relative flex-grow">
                                                    <Input
                                                        placeholder={isRecording ? "Listening to your voice..." : "Type your answer or question..."}
                                                        className="h-14 lg:h-16 bg-muted/30 border-2 border-border/50 focus-visible:ring-primary rounded-[1.5rem] lg:rounded-[2rem] font-bold px-6 pr-14 text-sm shadow-inner group-focus-within:border-primary/50 transition-all"
                                                        value={input}
                                                        onChange={(e) => setInput(e.target.value)}
                                                        disabled={isTyping || isRecording}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={toggleRecording}
                                                        className={cn(
                                                            "absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-90",
                                                            isRecording ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        )}
                                                    >
                                                        <Mic className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    size="icon"
                                                    disabled={isTyping || (!input.trim() && !isRecording)}
                                                    className="h-14 w-14 lg:h-16 lg:w-16 rounded-[1.5rem] lg:rounded-[2rem] bg-primary shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                                                >
                                                    {isTyping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                                                </Button>
                                            </form>
                                            <div className="absolute left-3.5 lg:left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
                                            </div>
                                        </div>
                                        <p className="hidden md:block text-center text-[9px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest mt-3">
                                            AI feedback is simulated and should be verified with your study materials.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'insights' && (
                            <motion.div
                                key="stats"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full overflow-y-auto p-4 lg:p-10"
                            >
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Exam Sync', val: `${performanceData.speaking}%`, icon: Target, color: 'text-accent-1' },
                                            { label: 'Grammar Range', val: `${performanceData.grammar}%`, icon: Brain, color: 'text-accent-2' },
                                            { label: 'Logic & Flow', val: 'Active', icon: Zap, color: 'text-accent-3' },
                                            { label: 'Study Time', val: formatTime(recordingTime), icon: Clock, color: 'text-primary' }
                                        ].map((stat, i) => (
                                            <SpotlightCard key={i} className="p-6 rounded-[2rem] bg-card border-2 border-border/50">
                                                <div className="flex flex-col items-center text-center gap-3">
                                                    <div className={cn("h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center", stat.color)}>
                                                        <stat.icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</div>
                                                        <div className="text-xl font-black">{stat.val}</div>
                                                    </div>
                                                </div>
                                            </SpotlightCard>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <Card className="rounded-[2.5rem] border-2 bg-background/50 backdrop-blur-md p-8">
                                            <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" /> Session Performance
                                            </h3>
                                            <div className="h-64 flex items-end justify-between gap-2 px-2">
                                                {performanceData.volatility.map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(20, h)}%` }}
                                                        transition={{ delay: i * 0.05, duration: 0.5 }}
                                                        className="w-full bg-primary/20 rounded-t-lg border-x border-t border-primary/30 relative group"
                                                    >
                                                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <p className="mt-6 text-[11px] font-bold text-muted-foreground text-center italic">
                                                Session focus shows real-time engagement levels during your practice.
                                            </p>
                                        </Card>

                                        <Card className="rounded-[2.5rem] border-2 bg-gradient-to-br from-primary/5 via-background to-accent-1/5 p-8 flex flex-col justify-center text-center gap-6">
                                            <div className="h-24 w-24 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center mx-auto relative">
                                                <span className="text-3xl font-black text-primary">A+</span>
                                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin duration-[3s]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase tracking-widest text-sm mb-2">Predicted Grade</h4>
                                                <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                                                    Based on your current session data, your predicted Band/Score is currently tracking at <span className="text-primary italic font-black">EXPERT LEVEL</span>.
                                                </p>
                                            </div>
                                            <Button className="w-full rounded-2xl h-12 font-black tracking-[0.2em] text-[10px] bg-primary">DOWNLOAD COMPOSITE REPORT</Button>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'library' && (
                            <motion.div
                                key="library"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full overflow-y-auto p-4 lg:p-10"
                            >
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="flex justify-between items-center bg-muted/20 p-6 rounded-[2rem] border border-border/50">
                                        <div>
                                            <h2 className="font-black text-xl italic leading-none">Your Study Vault</h2>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Saved feedback and templates</p>
                                        </div>
                                        <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 border-2">
                                            <Trash2 className="h-5 w-5 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Oral Fluency Blueprint', date: '2 min ago', size: '2.4kb' },
                                            { title: 'Academic Synthesis Template', date: '1 hour ago', size: '1.8kb' },
                                            { title: 'Cohesion Masterclass Log', date: 'Yesterday', size: '5.2kb' },
                                            { title: 'Personalized Vocabulary List', date: 'Oct 24', size: '0.9kb' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 rounded-[2rem] bg-background border-2 border-border/50 hover:border-primary/50 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50 group-hover:bg-primary group-hover:border-primary/50 transition-all">
                                                        <Save className="h-5 w-5 text-muted-foreground group-hover:text-white transition-all" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-sm">{item.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{item.date}</span>
                                                            <span className="h-1 w-1 rounded-full bg-muted-foreground opacity-30" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{item.size}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/5 group-hover:translate-x-1 transition-transform">
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {savedInsights.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {savedInsights.map((msg, i) => (
                                                <Card key={i} className="p-6 rounded-[2rem] border-2 border-border/50 bg-card hover:border-primary/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-3 opacity-50 text-[8px] font-black uppercase tracking-widest">
                                                        <Sparkles className="h-3 w-3" /> Expert Insight
                                                    </div>
                                                    <div className="line-clamp-4 text-xs font-medium leading-relaxed italic">
                                                        <Markdown content={msg.content} />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-4 w-full rounded-xl text-[9px] font-black h-8 text-red-500 hover:bg-red-500/10"
                                                        onClick={() => setSavedInsights(prev => prev.filter(m => m !== msg))}
                                                    >
                                                        REMOVE FROM VAULT
                                                    </Button>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 border-4 border-dashed border-border/50 rounded-[3rem] text-center space-y-4">
                                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                                                <Library className="h-8 w-8 text-muted-foreground opacity-30" />
                                            </div>
                                            <div>
                                                <h5 className="font-black opacity-50 text-sm uppercase tracking-widest">Vault is Empty</h5>
                                                <p className="text-xs font-bold text-muted-foreground tracking-tight italic opacity-40">Save important feedback from your sessions to see them here.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* View Switcher Bar for Mobile - Fixed at bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-2xl border-t">
                <div className="bg-muted/50 p-1.5 rounded-[2rem] flex justify-around items-center">
                    {[
                        { id: 'chat', label: 'Chat', icon: MessageSquare },
                        { id: 'insights', label: 'Stats', icon: Activity },
                        { id: 'library', label: 'Vault', icon: Library }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all",
                                activeTab === tab.id ? "bg-primary text-white scale-105 shadow-lg" : "text-muted-foreground opacity-60"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
