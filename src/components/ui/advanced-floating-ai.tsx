'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    Sparkles,
    User,
    Loader2,
    Zap,
    Brain,
    ChevronRight,
    Search,
    Mic,
    MicOff,
    BookOpen,
    FileText,
    Video,
    Calendar,
    DollarSign,
    GraduationCap,
    Settings,
    MoreVertical,
    Trash2,
    Download,
    Copy,
    Check,
    AlertCircle,
    TrendingUp,
    Clock,
    Star,
    Target,
    Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chatWithSmartLabs } from '@/ai/flows/smartlabs-chat';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'action' | 'resource';
    metadata?: any;
}

interface QuickAction {
    icon: any;
    label: string;
    prompt: string;
    color: string;
    category: string;
}

const quickActions: QuickAction[] = [
    { icon: GraduationCap, label: 'Courses', prompt: 'What courses do you offer?', color: 'from-blue-500 to-cyan-500', category: 'info' },
    { icon: DollarSign, label: 'Pricing', prompt: 'Tell me about pricing and payment plans', color: 'from-green-500 to-emerald-500', category: 'info' },
    { icon: Calendar, label: 'Schedule', prompt: 'How can I schedule a class?', color: 'from-purple-500 to-pink-500', category: 'action' },
    { icon: Brain, label: 'AI Scoring', prompt: 'How does AI scoring work?', color: 'from-orange-500 to-red-500', category: 'info' },
    { icon: Video, label: 'Resources', prompt: 'Show me available learning resources', color: 'from-indigo-500 to-blue-500', category: 'resource' },
    { icon: Target, label: 'Study Plan', prompt: 'Create a personalized study plan for me', color: 'from-teal-500 to-cyan-500', category: 'action' },
];

export function AdvancedFloatingAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! 👋 I\'m your **Smart Labs AI Assistant**. I\'m here to help you with:\n\n• Course information & enrollment\n• AI-powered scoring & feedback\n• Study plans & schedules\n• Resources & materials\n• Pricing & payment options\n\nWhat would you like to explore today?',
            timestamp: new Date(),
            type: 'text'
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
    const [conversationContext, setConversationContext] = useState<string>('general');
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
                toast({
                    variant: 'destructive',
                    title: 'Voice Input Error',
                    description: 'Could not capture voice input. Please try again.'
                });
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [toast]);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            toast({
                variant: 'destructive',
                title: 'Not Supported',
                description: 'Voice input is not supported in your browser.'
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSend = async (customText?: string) => {
        const textToSubmit = customText || input;
        if (!textToSubmit.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content: textToSubmit,
            timestamp: new Date(),
            type: 'text'
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        setShowQuickActions(false);

        try {
            const conversationHistory = newMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await chatWithSmartLabs({
                message: textToSubmit,
                conversationHistory,
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.response || "I'm having trouble responding right now. Please try again!",
                timestamp: new Date(),
                type: 'text',
                metadata: response
            };

            setMessages([...newMessages, assistantMessage]);

            // Update context based on response
            if (response.suggestedActions && response.suggestedActions.length > 0) {
                setConversationContext(response.context || 'general');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: 'Failed to connect with the assistant. Please try again.'
            });
        } finally {
            setIsTyping(false);
        }
    };

    const copyMessage = (content: string, index: number) => {
        navigator.clipboard.writeText(content);
        setCopiedMessageIndex(index);
        setTimeout(() => setCopiedMessageIndex(null), 2000);
        toast({
            title: 'Copied!',
            description: 'Message copied to clipboard.'
        });
    };

    const clearConversation = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Conversation cleared! How can I help you today?',
                timestamp: new Date(),
                type: 'text'
            },
        ]);
        setShowQuickActions(true);
        toast({
            title: 'Conversation Cleared',
            description: 'Starting fresh!'
        });
    };

    const handleQuickAction = (action: QuickAction) => {
        handleSend(action.prompt);
    };

    return (
        <div className="fixed top-24 left-4 lg:top-auto lg:bottom-8 lg:left-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="mb-4"
                    >
                        <Card className="w-[calc(100vw-32px)] sm:w-[450px] h-[600px] lg:h-[700px] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-2 border-primary/20 bg-background/95 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] transition-all duration-500">
                            {/* Advanced Header */}
                            <CardHeader className="bg-gradient-to-r from-primary via-accent-3 to-primary bg-[length:200%_100%] p-6 lg:p-8 text-primary-foreground relative overflow-hidden group animate-gradient">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-[200%] -left-full"
                                    animate={{ left: '100%' }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            animate={{
                                                rotate: [0, 10, -10, 0],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="h-14 w-14 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-2xl"
                                        >
                                            <Brain className="h-7 w-7" />
                                        </motion.div>
                                        <div>
                                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                                Smart Labs AI
                                                <Badge className="bg-white/20 text-white border-white/30 text-[9px] font-black">
                                                    ADVANCED
                                                </Badge>
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-1 opacity-90">
                                                <motion.span
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"
                                                />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    AI-Powered • Real-time
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-white/20 text-white rounded-2xl h-10 w-10 active:scale-95 transition-all"
                                            onClick={clearConversation}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-white/20 text-white rounded-2xl h-10 w-10 active:scale-95 transition-all"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Context Indicator */}
                                {conversationContext !== 'general' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 flex items-center gap-2 text-xs bg-white/10 px-3 py-2 rounded-xl border border-white/20"
                                    >
                                        <Lightbulb className="h-3 w-3" />
                                        <span className="font-bold">Context: {conversationContext}</span>
                                    </motion.div>
                                )}
                            </CardHeader>

                            {/* Conversation Stream */}
                            <ScrollArea ref={scrollRef} className="flex-grow p-6 lg:p-8 bg-gradient-to-b from-card/30 to-background">
                                <div className="space-y-6">
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 30 : -30, y: 10 }}
                                            animate={{ opacity: 1, x: 0, y: 0 }}
                                            className={cn("flex group", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                        >
                                            <div className="flex flex-col gap-2 max-w-[85%]">
                                                <div className={cn("p-4 lg:p-5 rounded-[1.8rem] text-[13px] font-medium leading-relaxed shadow-lg transition-all relative",
                                                    msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-primary to-accent-3 text-primary-foreground rounded-tr-none shadow-xl shadow-primary/20'
                                                        : 'bg-muted/60 text-foreground rounded-tl-none border-2 border-border/50 hover:bg-muted/80'
                                                )}>
                                                    <div className="flex items-center gap-2 mb-2 opacity-50 text-[9px] font-black uppercase tracking-widest">
                                                        {msg.role === 'assistant' ? (
                                                            <>
                                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                                Smart Labs AI
                                                            </>
                                                        ) : (
                                                            <>
                                                                <User className="h-3.5 w-3.5" />
                                                                You
                                                            </>
                                                        )}
                                                        <span className="ml-auto text-[8px]">
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="whitespace-pre-wrap">
                                                        {msg.content}
                                                    </div>

                                                    {/* Message Actions */}
                                                    <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background"
                                                            onClick={() => copyMessage(msg.content, i)}
                                                        >
                                                            {copiedMessageIndex === i ? (
                                                                <Check className="h-3 w-3 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Advanced Typing Indicator */}
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-3/20 flex items-center justify-center border-2 border-primary/30"
                                                >
                                                    <Brain className="h-5 w-5 text-primary" />
                                                </motion.div>
                                                <div className="bg-muted/40 p-4 rounded-[1.5rem] rounded-tl-none border-2 border-border/30 flex items-center gap-3">
                                                    <div className="flex gap-1">
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ y: [0, -8, 0] }}
                                                                transition={{
                                                                    duration: 0.6,
                                                                    repeat: Infinity,
                                                                    delay: i * 0.2
                                                                }}
                                                                className="h-2 w-2 rounded-full bg-primary"
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-muted-foreground">
                                                        AI is thinking...
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Advanced Input Interface */}
                            <CardFooter className="p-6 bg-muted/20 border-t-2 border-border/50 flex flex-col gap-4">
                                {/* Quick Actions Grid */}
                                <AnimatePresence>
                                    {showQuickActions && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            {quickActions.slice(0, 6).map((action, idx) => (
                                                <motion.button
                                                    key={idx}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleQuickAction(action)}
                                                    className={cn(
                                                        "p-3 rounded-2xl border-2 border-border/50 bg-background/50 hover:bg-background transition-all group flex flex-col items-center gap-2"
                                                    )}
                                                >
                                                    <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", action.color)}>
                                                        <action.icon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-center leading-tight">
                                                        {action.label}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input Form */}
                                <form
                                    className="flex w-full items-center gap-3"
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                >
                                    <div className="relative flex-grow group">
                                        <Input
                                            placeholder={isListening ? "Listening..." : "Ask me anything..."}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            disabled={isTyping || isListening}
                                            className={cn(
                                                "h-14 bg-background border-2 border-border/40 focus-visible:ring-primary rounded-[1.2rem] font-bold px-5 pr-12 shadow-inner group-focus-within:border-primary/50 transition-all",
                                                isListening && "border-red-500 animate-pulse"
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={toggleVoiceInput}
                                            className={cn(
                                                "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-primary/10 transition-all",
                                                isListening && "bg-red-500/20 text-red-500"
                                            )}
                                        >
                                            {isListening ? (
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    <MicOff className="h-5 w-5" />
                                                </motion.div>
                                            ) : (
                                                <Mic className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isTyping || !input.trim() || isListening}
                                        className="h-14 w-14 lg:h-16 lg:w-16 rounded-[1.2rem] lg:rounded-3xl bg-gradient-to-br from-primary to-accent-3 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                                    >
                                        <Send className="h-6 w-6" />
                                    </Button>
                                </form>

                                {/* Status Bar */}
                                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-primary" />
                                        <span>Powered by AI</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{messages.length} messages</span>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Advanced Launch Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 lg:h-20 lg:w-20 rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-primary via-accent-3 to-primary bg-[length:200%_100%] text-primary-foreground shadow-[0_20px_60px_rgba(79,70,229,0.5)] flex items-center justify-center relative group transition-all duration-500 animate-gradient",
                    isOpen && "rotate-90 from-slate-900 to-slate-800"
                )}
            >
                {isOpen ? (
                    <X className="h-8 w-8" />
                ) : (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2 h-7 w-7 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-[11px] font-black border-4 border-background shadow-lg"
                        >
                            <Sparkles className="h-4 w-4" />
                        </motion.div>
                        <MessageSquare className="h-8 w-8 group-hover:scale-110 transition-transform" />
                    </>
                )}

                {/* Animated Glow Ring */}
                {!isOpen && (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-[2.5rem] border-4 border-primary pointer-events-none"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="absolute inset-0 rounded-[2.5rem] border-4 border-accent-3 pointer-events-none"
                        />
                    </>
                )}
            </motion.button>
        </div>
    );
}
