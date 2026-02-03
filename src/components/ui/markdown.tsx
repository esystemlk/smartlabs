'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Zap, Sparkles, Brain, Info, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface MarkdownProps {
    content: string;
    className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div className={cn(
            "prose prose-sm max-w-none dark:prose-invert",
            "prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter",
            "prose-p:leading-relaxed prose-p:font-medium",
            "prose-strong:text-primary prose-strong:font-black",
            "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    blockquote: ({ children }) => {
                        const childrenArray = React.Children.toArray(children);
                        const firstChild = childrenArray[0] as any;

                        // Attempt to extract text from the first paragraph if it exists
                        let text = "";
                        if (firstChild?.props?.children) {
                            text = React.Children.toArray(firstChild.props.children).join("");
                        }

                        if (text.includes('[!STRATEGY_HACK]')) {
                            return (
                                <div className="my-6 p-6 rounded-[2rem] bg-primary/5 border-2 border-primary/20 shadow-xl shadow-primary/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                        <Zap className="h-16 w-16 fill-primary" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3 text-primary relative z-10">
                                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Zap className="h-4 w-4 fill-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-display">Exam Strategy</span>
                                    </div>
                                    <div className="text-sm font-bold italic leading-relaxed text-foreground/80 relative z-10">
                                        {childrenArray.map((child: any) => {
                                            if (child?.props?.children) {
                                                const newChildren = React.Children.map(child.props.children, c =>
                                                    typeof c === 'string' ? c.replace('[!STRATEGY_HACK]', '') : c
                                                );
                                                return React.cloneElement(child, { ...child.props, children: newChildren });
                                            }
                                            return child;
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        if (text.includes('[!MODEL_ANSWER]')) {
                            return (
                                <div className="my-6 p-6 rounded-[2rem] bg-emerald-500/5 border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                        <Sparkles className="h-16 w-16 fill-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3 text-emerald-500 relative z-10">
                                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 fill-emerald-500" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-display">Model Answer</span>
                                    </div>
                                    <div className="text-sm font-bold italic leading-relaxed text-foreground/80 relative z-10">
                                        {childrenArray.map((child: any) => {
                                            if (child?.props?.children) {
                                                const newChildren = React.Children.map(child.props.children, c =>
                                                    typeof c === 'string' ? c.replace('[!MODEL_ANSWER]', '') : c
                                                );
                                                return React.cloneElement(child, { ...child.props, children: newChildren });
                                            }
                                            return child;
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        if (text.includes('[!EXPERT_ANALYSIS]') || text.includes('[!NEURAL_ANALYSIS]')) {
                            return (
                                <div className="my-6 p-6 rounded-[2rem] bg-amber-500/5 border-2 border-amber-500/20 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                        <Brain className="h-16 w-16 fill-amber-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3 text-amber-500 relative z-10">
                                        <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <Brain className="h-4 w-4 fill-amber-500" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-display">Expert Analysis</span>
                                    </div>
                                    <div className="text-sm font-bold italic leading-relaxed text-foreground/80 relative z-10">
                                        {childrenArray.map((child: any) => {
                                            if (child?.props?.children) {
                                                const newChildren = React.Children.map(child.props.children, c =>
                                                    typeof c === 'string' ? c.replace('[!EXPERT_ANALYSIS]', '').replace('[!NEURAL_ANALYSIS]', '') : c
                                                );
                                                return React.cloneElement(child, { ...child.props, children: newChildren });
                                            }
                                            return child;
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        if (text.includes('[!SCORE_RESULT]')) {
                            return (
                                <div className="my-6 p-6 rounded-[2rem] bg-indigo-500/5 border-2 border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                        <Target className="h-16 w-16 fill-indigo-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3 text-indigo-500 relative z-10">
                                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Target className="h-4 w-4 fill-indigo-500" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-display">Practice Result</span>
                                    </div>
                                    <div className="text-sm font-bold italic leading-relaxed text-foreground/80 relative z-10">
                                        {childrenArray.map((child: any) => {
                                            if (child?.props?.children) {
                                                const newChildren = React.Children.map(child.props.children, c =>
                                                    typeof c === 'string' ? c.replace('[!SCORE_RESULT]', '') : c
                                                );
                                                return React.cloneElement(child, { ...child.props, children: newChildren });
                                            }
                                            return child;
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        return <blockquote className="border-l-4 border-primary/20 pl-6 my-6 italic text-muted-foreground">{children}</blockquote>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
