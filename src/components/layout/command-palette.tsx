"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    Target, Globe, Zap, Sparkles, Video, Search,
    Home, Book, LayoutDashboard, Settings, User, LogOut,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        const handleOpenSearch = () => setOpen(true);

        document.addEventListener("keydown", down);
        window.addEventListener("open-command-palette", handleOpenSearch);
        return () => {
            document.removeEventListener("keydown", down);
            window.removeEventListener("open-command-palette", handleOpenSearch);
        };
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/50 backdrop-blur-md"
                        onClick={() => setOpen(false)}
                    />

                    <Command
                        className="relative w-full max-w-xl bg-card/95 backdrop-blur-3xl border border-border/50 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: -20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: -20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="flex items-center gap-4 px-6 py-5 border-b border-border/20">
                                <Search className="h-5 w-5 text-primary animate-pulse" />
                                <Command.Input
                                    placeholder="Search courses, tools, or resources..."
                                    className="flex-1 bg-transparent border-none outline-none text-base font-bold placeholder:text-muted-foreground text-foreground"
                                />
                                <div className="flex items-center gap-1.5">
                                    <kbd className="hidden sm:inline-flex items-center justify-center rounded-lg bg-muted px-2 py-1 font-sans text-[10px] font-black text-muted-foreground border border-border">
                                        ESC
                                    </kbd>
                                </div>
                            </div>

                            <Command.List className="max-h-[400px] overflow-y-auto p-4 space-y-4 no-scrollbar">
                                <Command.Empty className="px-4 py-12 text-center">
                                    <div className="text-2xl mb-2">🤔</div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No results matched your query</p>
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 px-3 mb-2">
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <SearchItem icon={Home} label="Home Page" onSelect={() => runCommand(() => router.push("/"))} />
                                        <SearchItem icon={LayoutDashboard} label="Admin Portal" onSelect={() => runCommand(() => router.push("/admin"))} />
                                    </div>
                                </Command.Group>

                                <Command.Group heading="Core Training" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 px-3 mb-2">
                                    <div className="space-y-1 mt-2">
                                        <SearchItem icon={Target} color="text-accent-1" label="PTE Academic AI Suite" desc="Master the Pearson Test" onSelect={() => runCommand(() => router.push("/pte"))} />
                                        <SearchItem icon={Globe} color="text-accent-2" label="IELTS Mastery Program" desc="International testing excellence" onSelect={() => runCommand(() => router.push("/ielts"))} />
                                        <SearchItem icon={Zap} color="text-accent-4" label="CELPIP Training Hub" desc="Canadian PR path" onSelect={() => runCommand(() => router.push("/celpip"))} />
                                    </div>
                                </Command.Group>

                                <Command.Group heading="Tools & Discovery" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 px-3 mb-2">
                                    <div className="space-y-1 mt-2">
                                        <SearchItem icon={Sparkles} label="AI Mock Test Lab" desc="Simulate real exams" onSelect={() => runCommand(() => router.push("/mock-tests"))} />
                                        <SearchItem icon={Video} label="Video Masterclasses" desc="Expert-led strategies" onSelect={() => runCommand(() => router.push("/videos"))} />
                                        <SearchItem icon={Book} label="The Smart Blog" desc="Latest updates & tips" onSelect={() => runCommand(() => router.push("/blog"))} />
                                    </div>
                                </Command.Group>
                            </Command.List>

                            <div className="mt-auto px-6 py-4 bg-primary/5 border-t border-border/20 flex items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">↑↓</kbd> <span>Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">↵</kbd> <span>Select</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Powered by Smart Labs AI</span>
                                </div>
                            </div>
                        </motion.div>
                    </Command>
                </div>
            )}
        </AnimatePresence>
    );
}

function SearchItem({ icon: Icon, label, desc, color, onSelect }: any) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer aria-selected:bg-primary aria-selected:text-white transition-all duration-200 group"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2.5 rounded-xl bg-muted/50 transition-colors group-aria-selected:bg-white/20",
                    color || "text-foreground group-aria-selected:text-white"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">{label}</span>
                    {desc && <span className="text-[10px] font-medium opacity-60 leading-tight group-aria-selected:text-white/80">{desc}</span>}
                </div>
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-aria-selected:opacity-60 group-aria-selected:translate-x-0" />
        </Command.Item>
    );
}
