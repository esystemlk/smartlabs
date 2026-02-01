"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Accessibility, X, Eye, Type, MousePointer,
    ZoomIn, ZoomOut, MoveVertical,
    Sun, Moon, Contrast, Palette,
    WrapText, Image as ImageIcon, PauseCircle,
    RotateCcw, Ruler, Speaker, Droplet,
    Maximize, Search, Underline,
    LayoutTemplate, Mic, BoxSelect, ShieldAlert,
    PinOff, PlayCircle, MousePointerClick, Info, Lightbulb,
    BookOpen, ListFilter, EyeOff, Keyboard,
    Settings2, Activity, Sparkles, MessageSquare,
    Torus, MousePointer2, Languages, CaseSensitive,
    MoreHorizontal, Ghost
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type AccessibilityState = {
    // Core Settings
    zoom: number;
    contrast: 'normal' | 'invert' | 'high-contrast' | 'dark' | 'light' | 'solarized' | 'matrix';
    saturation: number;
    fontFamily: 'default' | 'serif' | 'opendyslexic' | 'simple-sans' | 'monospace';
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    wordSpacing: number;
    textAlign: 'initial' | 'left' | 'center' | 'right' | 'justify';
    cursor: 'default' | 'big-black' | 'big-white' | 'neon-red' | 'neon-cyan';

    // Content toggles
    highlightLinks: boolean;
    highlightHeadings: boolean;
    readingGuide: boolean;
    readingMask: boolean;
    hideImages: boolean;
    stopAnimations: boolean;
    colorBlindness: 'none' | 'protanopia' | 'deuteranopia';
    blueLightFilter: boolean;
    textToSpeech: boolean;
    clickSound: boolean;
    magnifier: boolean;
    focusMode: boolean;
    monochrome: boolean;
    epilepsySafe: boolean;
    keyboardFocus: boolean;
    readableWidth: boolean;
    linkUnderlines: boolean;
    screenShader: 'none' | 'green' | 'rose' | 'yellow';
    bigClickTargets: boolean;
    pageStructureMap: boolean;
    smartTooltips: boolean;
    voiceControlReady: boolean;
    highlightInteractive: boolean;
    noSticky: boolean;
    textGlow: boolean;
    paragraphSpacing: boolean;
    bigTextFocus: boolean;
    highContrastText: boolean;
    autoScroll: boolean;
    cursorTracer: boolean;
    vibrateOnClick: boolean;
    sharpEdges: boolean;
    altTextShow: boolean;
    bionicReading: boolean;
    textCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textShadow: boolean;
    bionicStrength: number;
    autoScrollSpeed: number;
    linkUnderlineStyle: 'solid' | 'dashed' | 'wavy';
    highAriaContrast: boolean;
    interactionHeatmap: boolean;
    hoverToRead: boolean;
};

const defaultState: AccessibilityState = {
    zoom: 1,
    contrast: 'normal',
    saturation: 1,
    fontFamily: 'default',
    fontSize: 1,
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    textAlign: 'initial',
    cursor: 'default',
    highlightLinks: false,
    highlightHeadings: false,
    readingGuide: false,
    readingMask: false,
    hideImages: false,
    stopAnimations: false,
    colorBlindness: 'none',
    blueLightFilter: false,
    textToSpeech: false,
    clickSound: false,
    magnifier: false,
    focusMode: false,
    monochrome: false,
    epilepsySafe: false,
    keyboardFocus: false,
    readableWidth: false,
    linkUnderlines: false,
    screenShader: 'none',
    bigClickTargets: false,
    pageStructureMap: false,
    smartTooltips: false,
    voiceControlReady: false,
    highlightInteractive: false,
    noSticky: false,
    textGlow: false,
    paragraphSpacing: false,
    bigTextFocus: false,
    highContrastText: false,
    autoScroll: false,
    cursorTracer: false,
    vibrateOnClick: false,
    sharpEdges: false,
    altTextShow: false,
    bionicReading: false,
    textCase: 'none',
    textShadow: false,
    bionicStrength: 3,
    autoScrollSpeed: 1,
    linkUnderlineStyle: 'solid',
    highAriaContrast: false,
    interactionHeatmap: false,
    hoverToRead: false,
};

export function AccessibilityWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<AccessibilityState>(defaultState);
    const [activeTab, setActiveTab] = useState<'all' | 'content' | 'display' | 'tools' | 'advanced'>('all');
    const magnifierRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastSpokenText = useRef<string>("");
    const { toast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem('ultra-accessibility-settings-v2');
        if (saved) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ultra-accessibility-settings-v2', JSON.stringify(settings));
        applySettingsToDom(settings);
    }, [settings]);

    useEffect(() => {
        if (settings.magnifier) {
            document.body.style.transition = 'transform 0.1s ease-out';
            toast({
                title: "🔍 Magnifier Active!",
                description: "PC: Press 'ESC' or Click the lens to exit. Mobile: Tap the Lens or the Red Button to exit.",
                duration: 6000,
            });
        } else {
            document.body.style.transform = '';
            document.body.style.transition = '';
        }
    }, [settings.magnifier]);

    // Auto Scroll logic
    useEffect(() => {
        if (settings.autoScroll) {
            scrollInterval.current = setInterval(() => {
                window.scrollBy(0, settings.autoScrollSpeed);
            }, 30);
        } else {
            if (scrollInterval.current) clearInterval(scrollInterval.current);
        }
        return () => { if (scrollInterval.current) clearInterval(scrollInterval.current); };
    }, [settings.autoScroll, settings.autoScrollSpeed]);

    // Combined Visual Tracking
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            let x, y;
            if ('clientX' in e) {
                x = e.clientX;
                y = e.clientY;
            } else {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            }

            const guide = document.getElementById('ultra-guide');
            if (guide) guide.style.top = `${y}px`;
            const mask = document.getElementById('ultra-mask');
            if (mask) mask.style.top = `${y - 100}px`;

            if (magnifierRef.current && settings.magnifier) {
                magnifierRef.current.style.left = `${x - 75}px`;
                magnifierRef.current.style.top = `${y - 75}px`;
            }

            if (settings.magnifier) {
                const zoom = 1.6;
                const originX = (x / window.innerWidth) * 100;
                const originY = (y / window.innerHeight) * 100;
                document.body.style.transformOrigin = `${originX}% ${originY}%`;
                document.body.style.transform = `scale(${zoom})`;
            }

            if (settings.hoverToRead) {
                const target = document.elementFromPoint(x, y) as HTMLElement;
                if (target) {
                    const textEl = target.closest('p, h1, h2, h3, h4, a, li, button, span');
                    if (textEl) {
                        const text = (textEl as HTMLElement).innerText.trim();
                        if (text && text !== lastSpokenText.current) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(text);
                            u.rate = 1.1;
                            window.speechSynthesis.speak(u);
                            lastSpokenText.current = text;
                        }
                    }
                }
            }
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (settings.magnifier || settings.autoScroll)) {
                reset();
            }
        };

        const handleClick = () => {
            if (settings.vibrateOnClick && navigator.vibrate) {
                navigator.vibrate(20);
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchstart', handleMove, { passive: true });
        window.addEventListener('keydown', handleKey);
        window.addEventListener('mousedown', handleClick);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchstart', handleMove);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('mousedown', handleClick);
        };
    }, [settings.magnifier, settings.hoverToRead, settings.readingGuide, settings.readingMask, settings.autoScroll, settings.vibrateOnClick]);

    const update = (key: keyof AccessibilityState, value: any) => setSettings(p => ({ ...p, [key]: value }));
    const reset = () => {
        setSettings(defaultState);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        document.body.style.transform = '';
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed z-[10001] transition-all active:scale-95 group overflow-hidden",
                    settings.magnifier ? "top-4 right-4 w-20 h-20 bg-red-600 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-white" : "bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] border-2 border-white/40"
                )}
                style={settings.magnifier ? { transform: 'scale(0.8)' } : {}}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isOpen ? <X className="w-6 h-6 z-10 mx-auto" /> :
                    settings.magnifier ? <Search className="w-10 h-10 z-10 mx-auto animate-pulse" /> :
                        <Accessibility className="w-8 h-8 z-10 mx-auto" />
                }
                {settings.magnifier && <span className="absolute bottom-1 left-0 w-full text-[8px] font-black uppercase tracking-tighter text-center">EXIT ZOOM</span>}
            </button>

            {/* Overlays */}
            <div className="fixed inset-0 pointer-events-none z-[9999]">
                {settings.readingGuide && <div id="ultra-guide" className="absolute left-0 w-full h-1 bg-red-600 shadow-[0_0_10px_red] z-[100]" />}
                {settings.readingMask && <div id="ultra-mask" className="absolute left-0 w-full h-[200px] shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-[99]" />}
                {settings.blueLightFilter && <div className="absolute inset-0 bg-amber-500/15 mix-blend-multiply" />}
                {settings.screenShader !== 'none' && (
                    <div className={cn("absolute inset-0 opacity-20 mix-blend-multiply",
                        settings.screenShader === 'green' && "bg-green-600",
                        settings.screenShader === 'rose' && "bg-rose-500",
                        settings.screenShader === 'yellow' && "bg-amber-400"
                    )} />
                )}
                {settings.magnifier && (
                    <div
                        ref={magnifierRef}
                        className="absolute w-[150px] h-[150px] rounded-full border-4 border-red-600 bg-red-500/10 backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.3)] flex items-center justify-center pointer-events-auto cursor-pointer group"
                        onClick={reset}
                    >
                        <div className="w-4 h-4 border-2 border-red-600 rounded-full animate-ping" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 200, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 200, scale: 0.9 }}
                        className="fixed bottom-24 right-4 z-[10002] w-[95vw] sm:w-[500px] bg-background/95 backdrop-blur-3xl border border-border/50 rounded-[44px] shadow-[0_30px_90px_rgba(0,0,0,0.3)] flex flex-col max-h-[82vh] overflow-hidden border-blue-100/20"
                    >
                        {/* ... Modal Content Exactly As Before ... */}
                        <div className="p-8 border-b shrink-0 flex items-center justify-between bg-gradient-to-br from-blue-50/80 to-transparent">
                            <div>
                                <h2 className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Access Suite V6.5</h2>
                                <p className="text-[10px] font-black uppercase text-blue-600 mt-1 tracking-[0.2em] opacity-80">
                                    PRO EDITION • BY <a href="https://www.esystemlk.xyz" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-800 transition-colors">ESYSTEMLK</a>
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={reset} className="rounded-2xl text-[9px] font-black h-9 px-5 border-2 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95">
                                <RotateCcw className="w-3.5 h-3.5 mr-2" /> FULL RESET
                            </Button>
                        </div>

                        <div className="flex px-6 gap-2 border-b overflow-x-auto no-scrollbar py-4 shrink-0 bg-secondary/30">
                            <IconTab active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={ListFilter} label="All" />
                            <IconTab active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={Type} label="Text" />
                            <IconTab active={activeTab === 'display'} onClick={() => setActiveTab('display')} icon={Eye} label="Look" />
                            <IconTab active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Settings2} label="Tools" />
                            <IconTab active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={Sparkles} label="Elite" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12 scroll-smooth no-scrollbar">
                            {(activeTab === 'all' || activeTab === 'tools') && (
                                <Section title="Interactive Assistance">
                                    <div className="space-y-4">
                                        <ToolToggle active={settings.hoverToRead} onClick={() => update('hoverToRead', !settings.hoverToRead)} icon={MousePointer2} label="Point & Read AI" desc="Narration follows your mouse or touch" />
                                        <ToolToggle active={settings.magnifier} onClick={() => update('magnifier', !settings.magnifier)} icon={Search} label="Dynamic magnifier" desc="Real-time screen magnification follow" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <ChoiceBtn active={settings.autoScroll} onClick={() => update('autoScroll', !settings.autoScroll)} icon={PlayCircle}>Auto-Scroll</ChoiceBtn>
                                            <ChoiceBtn active={settings.readingGuide} onClick={() => update('readingGuide', !settings.readingGuide)} icon={Ruler}>Reading Line</ChoiceBtn>
                                        </div>
                                        {settings.autoScroll && <SliderBox label="Scroll Velocity" value={settings.autoScrollSpeed} min={1} max={10} step={1} onChange={(v: number) => update('autoScrollSpeed', v)} />}
                                    </div>
                                </Section>
                            )}

                            {(activeTab === 'all' || activeTab === 'content') && (
                                <Section title="Reading & Typography">
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Universal Font Scale</label>
                                            <div className="flex items-center justify-between p-5 bg-secondary/50 rounded-[28px] border border-white/60 shadow-inner">
                                                <Button size="icon" variant="ghost" className="h-11 w-11 hover:bg-white rounded-2xl" onClick={() => update('fontSize', settings.fontSize - 0.1)}><ZoomOut className="w-5 h-5" /></Button>
                                                <span className="text-2xl font-black text-blue-700">{Math.round(settings.fontSize * 100)}%</span>
                                                <Button size="icon" variant="ghost" className="h-11 w-11 hover:bg-white rounded-2xl" onClick={() => update('fontSize', settings.fontSize + 0.1)}><ZoomIn className="w-5 h-5" /></Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <ChoiceBtn active={settings.fontFamily === 'opendyslexic'} onClick={() => update('fontFamily', 'opendyslexic')} icon={BookOpen}>Dyslexic Font</ChoiceBtn>
                                            <ChoiceBtn active={settings.bionicReading} onClick={() => update('bionicReading', !settings.bionicReading)} icon={Activity}>Bionic Logic</ChoiceBtn>
                                            <ChoiceBtn active={settings.textShadow} onClick={() => update('textShadow', !settings.textShadow)} icon={Ghost}>Contrast Mask</ChoiceBtn>
                                            <ChoiceBtn active={settings.fontFamily === 'monospace'} onClick={() => update('fontFamily', 'monospace')} icon={Type}>Monospace</ChoiceBtn>
                                        </div>
                                        <div className="space-y-4">
                                            <SliderBox label="Line Height" value={settings.lineHeight} min={1.0} max={3.0} step={0.1} onChange={(v: number) => update('lineHeight', v)} />
                                            <SliderBox label="Word Spacing" value={settings.wordSpacing} min={0} max={20} step={2} onChange={(v: number) => update('wordSpacing', v)} />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {(activeTab === 'all' || activeTab === 'display') && (
                                <Section title="Display Profiles">
                                    <div className="space-y-7">
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <ProfileBtn active={settings.contrast === 'dark'} onClick={() => update('contrast', 'dark')} icon={Moon} label="Dark" />
                                            <ProfileBtn active={settings.contrast === 'light'} onClick={() => update('contrast', 'light')} icon={Lightbulb} label="Bright" />
                                            <ProfileBtn active={settings.contrast === 'solarized'} onClick={() => update('contrast', 'solarized')} icon={Sun} label="Amber" />
                                            <ProfileBtn active={settings.contrast === 'matrix'} onClick={() => update('contrast', 'matrix')} icon={Torus} label="Neon" />
                                            <ProfileBtn active={settings.contrast === 'invert'} onClick={() => update('contrast', 'invert')} icon={Contrast} label="Invert" />
                                            <ProfileBtn active={settings.monochrome} onClick={() => update('monochrome', !settings.monochrome)} icon={Palette} label="Gray" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            <AdvancedToggle active={settings.highContrastText} onClick={() => update('highContrastText', !settings.highContrastText)} icon={Contrast} label="Smart High Contrast" desc="Automated text enhancement for clarity" />
                                            <AdvancedToggle active={settings.textGlow} onClick={() => update('textGlow', !settings.textGlow)} icon={Lightbulb} label="Text Edge Glow" desc="Adds luminous clarity to font outlines" />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 text-center">Irlen Color Overlays</label>
                                            <div className="flex justify-between items-center bg-secondary/30 p-5 rounded-[32px] border-2 border-dashed border-blue-200/40">
                                                {['none', 'green', 'rose', 'yellow'].map(tint => (
                                                    <button key={tint} onClick={() => update('screenShader', tint)} className={cn("w-16 h-16 rounded-full transition-all flex items-center justify-center relative",
                                                        tint === 'none' ? "bg-white border-2 text-[10px] font-black" :
                                                            tint === 'green' ? "bg-green-400" :
                                                                tint === 'rose' ? "bg-rose-400" : "bg-yellow-300",
                                                        settings.screenShader === tint && "ring-4 ring-blue-600 ring-offset-4 scale-110 shadow-2xl"
                                                    )}>
                                                        {tint === 'none' && 'OFF'}
                                                        {settings.screenShader === tint && tint !== 'none' && <Droplet className="w-6 h-6 text-white animate-bounce" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {(activeTab === 'all' || activeTab === 'tools') && (
                                <Section title="Pointers & Navigation">
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { id: 'default', label: 'STD', color: 'bg-zinc-800' },
                                            { id: 'big-white', label: 'WHITE', color: 'bg-white border shadow-sm' },
                                            { id: 'neon-red', label: 'RED', color: 'bg-red-500 shadow-[0_0_12px_red]' },
                                            { id: 'neon-cyan', label: 'CYAN', color: 'bg-cyan-400 shadow-[0_0_12px_cyan]' }
                                        ].map(p => (
                                            <button key={p.id} onClick={() => update('cursor', p.id)} className={cn("aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all border-2",
                                                settings.cursor === p.id ? "border-blue-600 scale-105 shadow-xl bg-blue-50" : "border-transparent bg-secondary/40 hover:bg-white")}>
                                                <div className={cn("w-7 h-7 rounded-full", p.color)} />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <ChoiceBtn active={settings.cursorTracer} onClick={() => update('cursorTracer', !settings.cursorTracer)} icon={Droplet}>Pointer Trail</ChoiceBtn>
                                        <ChoiceBtn active={settings.keyboardFocus} onClick={() => update('keyboardFocus', !settings.keyboardFocus)} icon={Keyboard}>Focus Ring</ChoiceBtn>
                                    </div>
                                </Section>
                            )}

                            {(activeTab === 'all' || activeTab === 'advanced') && (
                                <Section title="Expert Level Controls">
                                    <div className="grid grid-cols-1 gap-3.5">
                                        <EliteToggle active={settings.epilepsySafe} onClick={() => update('epilepsySafe', !settings.epilepsySafe)} icon={ShieldAlert} label="Epilepsy Shield" desc="Stops all blinking, flash & motion" />
                                        <EliteToggle active={settings.interactionHeatmap} onClick={() => update('interactionHeatmap', !settings.interactionHeatmap)} icon={MousePointerClick} label="UI Target Heatmap" desc="Highlights all tap points on demand" />
                                        <EliteToggle active={settings.noSticky} onClick={() => update('noSticky', !settings.noSticky)} icon={PinOff} label="Clean Navigation" desc="Forces absolute layout (Hides Sticky)" />
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <ChoiceBtn active={settings.readableWidth} onClick={() => update('readableWidth', !settings.readableWidth)} icon={WrapText}>Fixed Width</ChoiceBtn>
                                            <ChoiceBtn active={settings.focusMode} onClick={() => update('focusMode', !settings.focusMode)} icon={Maximize}>Focus Mode</ChoiceBtn>
                                        </div>
                                    </div>
                                </Section>
                            )}
                        </div>

                        <div className="p-8 border-t shrink-0 flex flex-col items-center gap-3 bg-blue-600/5 backdrop-blur-3xl">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] animate-pulse" />
                                <p className="text-[12px] font-black tracking-[0.3em] text-blue-700 uppercase ml-2">SYSTEM OPERATIONAL</p>
                            </div>
                            <p className="text-[9px] opacity-40 font-black uppercase tracking-widest">SMART LABS INCLUSIVE ENGINE 6.5</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Visual Elements Components
function IconTab({ active, onClick, icon: Icon, label }: any) {
    return (
        <button onClick={onClick} className={cn("flex flex-col items-center justify-center p-4 rounded-[28px] min-w-[85px] transition-all duration-300 border-2",
            active ? "bg-white text-blue-700 border-blue-100 shadow-xl scale-105 z-10" : "hover:bg-white/60 border-transparent text-muted-foreground scale-95 opacity-70")}>
            <Icon className={cn("w-5 h-5 mb-1.5 transition-transform", active && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
        </button>
    )
}
function Section({ title, children }: any) {
    return (<div className="space-y-5"><h3 className="text-[11px] font-black text-blue-600/50 uppercase tracking-[0.25em] ml-1 flex items-center gap-4">
        {title} <div className="h-px flex-1 bg-blue-600/5" />
    </h3>{children}</div>)
}
function ToolToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (
        <button onClick={onClick} className={cn("w-full p-5 rounded-[32px] border-2 transition-all flex items-center justify-between text-left",
            active ? "bg-green-600 border-green-500 text-white shadow-lg scale-[1.02]" : "bg-card border-border/40 hover:bg-secondary/40 shadow-sm")}>
            <div className="flex items-center gap-5">
                <div className={cn("p-3 rounded-2xl", active ? "bg-white/20" : "bg-blue-600 text-white")}><Icon className="w-6 h-6" /></div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight">{label}</span>
                    <span className={cn("text-[9px] font-bold uppercase opacity-60", active && "text-white/80")}>{desc}</span>
                </div>
            </div>
            <div className={cn("w-4 h-4 rounded-full border-2", active ? "bg-white border-green-400" : "bg-zinc-200 border-transparent")} />
        </button>
    )
}
function ChoiceBtn({ active, onClick, icon: Icon, children }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-3 p-4 rounded-[24px] border-2 transition-all text-left",
        active ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-card hover:bg-secondary/40 border-border/40")}>
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-[10px] font-black uppercase tracking-tight">{children}</span>
    </button>)
}
function ProfileBtn({ active, onClick, icon: Icon, label }: any) {
    return (<button onClick={onClick} className={cn("flex flex-col items-center gap-2.5 p-4 rounded-[26px] border-2 transition-all",
        active ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105" : "bg-card hover:bg-secondary/40 border-border/40 hover:bg-white")}>
        <Icon className="w-5 h-5" />
        <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>)
}
function SliderBox({ label, value, min, max, step, onChange }: any) {
    return (<div className="flex flex-col gap-3 p-5 bg-secondary/30 rounded-[32px] border border-white shadow-sm">
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
            <span>{label}</span>
            <span className="text-blue-700 bg-white px-2.5 py-1 rounded-xl shadow-xs">{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 rounded-full cursor-pointer" />
    </div>)
}
function AdvancedToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-5 p-5 rounded-[32px] border-2 transition-all text-left", active ? "bg-blue-50 border-blue-200" : "bg-card border-border/40 hover:bg-secondary/20")}>
        <div className={cn("p-3 rounded-2xl shadow-sm", active ? "bg-blue-600 text-white" : "bg-secondary text-muted-foreground")}><Icon className="w-5 h-5" /></div>
        <div className="flex flex-col"><span className="text-[11px] font-black uppercase text-foreground tracking-tight">{label}</span><span className="text-[9px] opacity-50 font-bold uppercase leading-tight mt-0.5">{desc}</span></div>
        <div className={cn("ml-auto w-5 h-5 rounded-full border-2 transition-all", active ? "bg-blue-600 border-blue-400 scale-110 shadow-sm" : "bg-zinc-200 border-transparent")} />
    </button>)
}
function EliteToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-5 p-5 rounded-[40px] border-2 transition-all text-left overflow-hidden relative group", active ? "bg-indigo-600 text-white border-indigo-500 shadow-2xl scale-[1.02]" : "bg-card hover:bg-secondary/20 border-border/40 shadow-sm")}>
        <div className={cn("p-4 rounded-2xl transition-transform", active ? "bg-white/20" : "bg-secondary group-hover:scale-110")}><Icon className="w-6 h-6" /></div>
        <div className="flex flex-col"><span className="text-sm font-black uppercase tracking-tight">{label}</span><span className="text-[9px] opacity-70 font-bold uppercase leading-tight mt-1">{desc}</span></div>
        <Sparkles className={cn("absolute -top-3 -right-3 w-12 h-12 opacity-15 rotate-12 transition-transform", active ? "scale-150 rotate-0" : "scale-0")} />
    </button>)
}

/**
 * LOGIC ENGINE: Applies all settings to the DOM
 */
function applySettingsToDom(s: AccessibilityState) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    root.style.fontSize = `${s.fontSize * 16}px`;
    root.style.setProperty('--line-height', `${s.lineHeight}`);
    body.style.letterSpacing = `${s.letterSpacing}px`;
    body.style.wordSpacing = `${s.wordSpacing}px`;

    let filters = [`saturate(${s.saturation})`];
    if (s.contrast === 'invert') filters.push('invert(1)');
    if (s.contrast === 'high-contrast') filters.push('contrast(180%) brightness(110%)');
    if (s.monochrome) filters.push('grayscale(100%)');
    if (s.colorBlindness === 'protanopia') filters.push('sepia(20%) hue-rotate(-50deg)');
    if (s.colorBlindness === 'deuteranopia') filters.push('sepia(20%) hue-rotate(-20deg)');
    root.style.filter = filters.join(' ');

    root.classList.remove('dark', 'light', 'theme-solarized', 'theme-matrix');
    if (s.contrast === 'dark') root.classList.add('dark');
    else if (s.contrast === 'light') root.classList.add('light');
    else if (s.contrast === 'solarized') root.classList.add('theme-solarized');
    else if (s.contrast === 'matrix') root.classList.add('theme-matrix');

    if (s.fontFamily === 'opendyslexic') body.style.fontFamily = 'Comic Sans MS, cursive';
    else if (s.fontFamily === 'simple-sans') body.style.fontFamily = 'Arial, sans-serif';
    else if (s.fontFamily === 'monospace') body.style.fontFamily = 'monospace';
    else body.style.fontFamily = '';

    body.style.textTransform = s.textCase === 'none' ? '' : s.textCase;

    const t = (c: string, b: boolean) => b ? body.classList.add(c) : body.classList.remove(c);
    t('access-cursor-big-black', s.cursor === 'big-black');
    t('access-cursor-big-white', s.cursor === 'big-white');
    t('access-cursor-neon-red', s.cursor === 'neon-red');
    t('access-cursor-neon-cyan', s.cursor === 'neon-cyan');
    t('access-readable-width', s.readableWidth);
    t('access-epilepsy-safe', s.epilepsySafe);
    t('access-keyboard-focus', s.keyboardFocus);
    t('access-no-sticky', s.noSticky);
    t('access-text-glow', s.textGlow);
    t('access-big-text-focus', s.bigTextFocus);
    t('access-high-contrast-text', s.highContrastText);
    t('access-sharp-edges', s.sharpEdges);
    t('access-alt-text-show', s.altTextShow);
    t('access-highlight-links', s.highlightLinks);
    t('access-highlight-headings', s.highlightHeadings);
    t('access-hide-images', s.hideImages);
    t('access-stop-animations', s.stopAnimations);
    t('access-focus-mode', s.focusMode);
    t('access-para-spacing', s.paragraphSpacing);
    t('access-link-underlines', s.linkUnderlines);
    t('access-big-targets', s.bigClickTargets);
    t('access-smart-tooltips', s.smartTooltips);
    t('access-highlight-interactive', s.highlightInteractive);
}
