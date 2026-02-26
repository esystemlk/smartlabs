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
    Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chatWithSmartLabs } from '@/ai/flows/smartlabs-chat';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function FloatingAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hi! 👋 I\'m your Smart Labs assistant. I can help you with information about our courses, pricing, enrollment, and more. What would you like to know?' },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<Array<{ label: string; url?: string; intent?: string }>>([
        { label: 'What courses do you offer?', url: '/courses', intent: 'courses' },
        { label: 'How does AI scoring work?' },
        { label: 'Tell me about pricing' }
    ]);
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (customText?: string) => {
        const textToSubmit = customText || input;
        if (!textToSubmit.trim()) return;

        const userMessage = { role: 'user', content: textToSubmit };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const conversationHistory = newMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await chatWithSmartLabs({
                message: textToSubmit,
                conversationHistory,
            });

            setMessages([...newMessages, { role: 'assistant', content: response.response || "I'm having trouble responding right now. Please try again!" }]);

            // Update suggested actions
            if (response.suggestedActions && response.suggestedActions.length > 0) {
                setSuggestedActions(response.suggestedActions as any);
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
                        <Card className="w-[calc(100vw-32px)] sm:w-[400px] h-[550px] lg:h-[600px] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-2 border-primary/20 bg-background/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] transition-all duration-500">
                            {/* Animated Header */}
                            <CardHeader className="bg-primary p-6 lg:p-8 text-primary-foreground relative overflow-hidden group">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-[200%] -left-full"
                                    animate={{ left: '100%' }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-[1.2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                                            <Bot className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black tracking-tight">Smart Labs Assistant</CardTitle>
                                            <div className="flex items-center gap-2 mt-0.5 opacity-80">
                                                <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Online & Ready to Help</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white rounded-2xl h-10 w-10 active:scale-95 transition-all" onClick={() => setIsOpen(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Conversation Stream */}
                            <CardContent ref={scrollRef} className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-6 no-scrollbar bg-gradient-to-b from-card/30 to-background">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 30 : -30, y: 10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                    >
                                        <div className={cn("max-w-[85%] p-4 lg:p-5 rounded-[1.8rem] text-[13px] font-medium leading-relaxed shadow-sm transition-all",
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none shadow-xl shadow-primary/20'
                                                : 'bg-muted/40 text-foreground rounded-tl-none border-2 border-border/50 hover:bg-muted/60'
                                        )}>
                                            <div className="flex items-center gap-2 mb-1.5 opacity-40 text-[9px] font-bold uppercase tracking-widest">
                                                {msg.role === 'assistant' ? <Sparkles className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5" />}
                                                {msg.role === 'assistant' ? 'Smart Labs' : 'You'}
                                            </div>
                                            <div className="whitespace-pre-wrap select-none">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 animate-spin">
                                                <Zap className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-[1.2rem] rounded-tl-none border-2 border-border/30 flex items-center gap-3 italic text-[11px] font-bold text-muted-foreground">
                                                Typing...
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Input Matrix Interface */}
                            <CardFooter className="p-6 bg-muted/20 border-t-2 border-border/50 flex flex-col gap-4">
                                {/* Suggestion Pills */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full pb-1">
                                    {suggestedActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (action.url) {
                                                    window.location.href = action.url;
                                                } else {
                                                    handleSend(action.label);
                                                }
                                            }}
                                            className="px-4 py-2 rounded-xl bg-background/50 border-2 border-border/50 text-[9px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-95"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                                <form
                                    className="flex w-full items-center gap-3"
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                >
                                    <div className="relative flex-grow group">
                                        <Input
                                            placeholder="Ask me anything..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            disabled={isTyping}
                                            className="h-14 bg-background border-2 border-border/40 focus-visible:ring-primary rounded-[1.2rem] font-bold px-5 pr-10 shadow-inner group-focus-within:border-primary/50 transition-all"
                                        />
                                        <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer active:scale-90 transition-all" />
                                    </div>
                                    <Button type="submit" size="icon" disabled={isTyping || !input.trim()} className="h-14 w-14 lg:h-16 lg:w-16 rounded-[1.2rem] lg:rounded-3xl bg-primary shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all shrink-0">
                                        <Send className="h-6 w-6" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Launch Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 lg:h-20 lg:w-20 rounded-[2rem] lg:rounded-[2.5rem] bg-primary text-primary-foreground shadow-[0_20px_60px_rgba(79,70,229,0.5)] flex items-center justify-center relative group transition-all duration-500",
                    isOpen ? "rotate-90 bg-slate-900" : ""
                )}
            >
                {isOpen ? <X className="h-8 w-8" /> : (
                    <>
                        <div className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 rounded-full flex items-center justify-center text-[11px] font-black border-4 border-background animate-bounce shadow-lg">
                            !
                        </div>
                        <MessageSquare className="h-8 w-8 group-hover:scale-110 transition-transform" />
                    </>
                )}

                {/* Glow Ring Effect */}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-[2.5rem] border-4 border-primary animate-ping opacity-20 pointer-events-none" />
                )}
            </motion.button>
        </div>
    );
}

const HelpCircle = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
    </svg>
)
