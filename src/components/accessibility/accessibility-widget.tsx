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

type AccessibilityState = {
    // Batch 1-6
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

    // New Feature
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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const magnifierRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastSpokenText = useRef<string>("");

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

    // Dynamic Hover/Touch to Read
    useEffect(() => {
        if (!settings.hoverToRead) {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            return;
        }

        const handleInput = (e: MouseEvent | TouchEvent) => {
            let x, y;
            if ('clientX' in e) {
                x = e.clientX;
                y = e.clientY;
            } else {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            }

            const target = document.elementFromPoint(x, y) as HTMLElement;
            if (!target) return;

            // Find nearest text-containing parent if child is small span etc
            const textElement = target.closest('p, h1, h2, h3, h4, h5, h6, a, button, span, li');
            if (textElement) {
                const text = (textElement as HTMLElement).innerText.trim();
                if (text && text !== lastSpokenText.current) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 1.1;
                    window.speechSynthesis.speak(utterance);
                    lastSpokenText.current = text;
                }
            } else {
                // If moving away from text, stop but don't clear lastSpokenText immediately 
                // to prevent refiring on same element unless we move out then in
            }
        };

        // Debounced mousemove for performance
        let timeout: NodeJS.Timeout;
        const debouncedMove = (e: MouseEvent) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => handleInput(e), 50);
        };

        window.addEventListener('mousemove', debouncedMove);
        window.addEventListener('touchstart', handleInput);

        return () => {
            window.removeEventListener('mousemove', debouncedMove);
            window.removeEventListener('touchstart', handleInput);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, [settings.hoverToRead]);

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

    const update = (key: keyof AccessibilityState, value: any) => setSettings(p => ({ ...p, [key]: value }));
    const reset = () => {
        setSettings(defaultState);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 transition-all active:scale-95 border-2 border-white/40 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isOpen ? <X className="w-6 h-6 z-10" /> : <Accessibility className="w-8 h-8 z-10" />}
            </button>

            {/* Overlays */}
            <div className="fixed inset-0 pointer-events-none z-[9998]">
                {settings.readingGuide && <div id="ultra-guide" className="absolute left-0 w-full h-1 bg-red-600 shadow-[0_0_10px_red] z-[100]" style={{ top: '50%' }} />}
                {settings.readingMask && <div id="ultra-mask" className="absolute left-0 w-full h-[200px] shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-[99]" style={{ top: '50%' }} />}
                {settings.blueLightFilter && <div className="absolute inset-0 bg-amber-500/15 mix-blend-multiply" />}
                {settings.screenShader !== 'none' && (
                    <div className={cn("absolute inset-0 opacity-20 mix-blend-multiply",
                        settings.screenShader === 'green' && "bg-green-600",
                        settings.screenShader === 'rose' && "bg-rose-500",
                        settings.screenShader === 'yellow' && "bg-amber-400"
                    )} />
                )}
                {settings.magnifier && (
                    <div ref={magnifierRef} className="absolute w-[150px] h-[150px] rounded-full border-4 border-blue-500 bg-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center">
                        <div className="w-1 h-1 bg-red-600 rounded-full" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 200, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 200, scale: 0.9 }}
                        className="fixed bottom-24 right-4 z-[9999] w-[95vw] sm:w-[500px] bg-background/95 backdrop-blur-3xl border border-border/50 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col max-h-[82vh] overflow-hidden border-blue-100/20"
                    >
                        {/* Header */}
                        <div className="p-7 border-b shrink-0 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
                            <div>
                                <h2 className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Smart Labs Access</h2>
                                <p className="text-[10px] font-black uppercase text-blue-500/80 mt-1 tracking-widest">Ultimate Suite AI • Features by Esystemlk</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={reset} className="rounded-2xl text-[9px] font-black h-8 px-4 border-2 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <RotateCcw className="w-3 h-3 mr-2" /> FACTORY RESET
                            </Button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex px-5 gap-1.5 border-b overflow-x-auto no-scrollbar py-3 shrink-0 bg-secondary/20">
                            <IconTab active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={ListFilter} label="All" />
                            <IconTab active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={Type} label="Text" />
                            <IconTab active={activeTab === 'display'} onClick={() => setActiveTab('display')} icon={Eye} label="Look" />
                            <IconTab active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Settings2} label="Tools" />
                            <IconTab active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={Sparkles} label="Elite" />
                        </div>

                        {/* Main Scroll Content */}
                        <div className="flex-1 overflow-y-auto p-7 space-y-10 scroll-smooth no-scrollbar">

                            {/* --- MODULE: INTERACTIVE READER --- */}
                            {(activeTab === 'all' || activeTab === 'tools') && (
                                <Section title="Interactive Assist">
                                    <div className="space-y-4">
                                        <div className={cn("p-1 rounded-[28px] shadow-lg transition-all", settings.hoverToRead ? "bg-green-500 shadow-green-500/20" : "bg-blue-600 shadow-blue-500/20")}>
                                            <Button
                                                variant="ghost"
                                                className="w-full h-16 rounded-[24px] bg-white hover:bg-blue-50 transition-all flex items-center justify-between px-8"
                                                onClick={() => update('hoverToRead', !settings.hoverToRead)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MousePointer2 className={cn("w-6 h-6", settings.hoverToRead ? "text-green-600" : "text-blue-600")} />
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-extrabold text-blue-700 tracking-tight leading-none">POINT & READ</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Reads text under mouse/touch</span>
                                                    </div>
                                                </div>
                                                <div className={cn("w-3 h-3 rounded-full animate-pulse", settings.hoverToRead ? "bg-green-500" : "bg-zinc-300")} />
                                            </Button>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-2 flex items-center justify-between px-6 font-bold"
                                            onClick={() => {
                                                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
                                                else {
                                                    const u = new SpeechSynthesisUtterance(document.body.innerText);
                                                    window.speechSynthesis.speak(u);
                                                }
                                            }}
                                        >
                                            <span className="text-[11px] uppercase tracking-wide">Read Full Page Aloud</span>
                                            <Speaker className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Section>
                            )}

                            {/* --- MODULE: TEXT OPTIMIZATION --- */}
                            {(activeTab === 'all' || activeTab === 'content') && (
                                <Section title="Precision Typography">
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Global Font Size</label>
                                            <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-3xl border border-white">
                                                <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-white rounded-2xl" onClick={() => update('fontSize', settings.fontSize - 0.1)}><ZoomOut className="w-4 h-4" /></Button>
                                                <span className="text-xl font-black text-blue-600">{Math.round(settings.fontSize * 100)}%</span>
                                                <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-white rounded-2xl" onClick={() => update('fontSize', settings.fontSize + 0.1)}><ZoomIn className="w-4 h-4" /></Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <ChoiceBtn active={settings.fontFamily === 'simple-sans'} onClick={() => update('fontFamily', 'simple-sans')}>Safe Arial</ChoiceBtn>
                                            <ChoiceBtn active={settings.fontFamily === 'opendyslexic'} onClick={() => update('fontFamily', 'opendyslexic')}>Dyslexic</ChoiceBtn>
                                            <ChoiceBtn active={settings.bionicReading} onClick={() => update('bionicReading', !settings.bionicReading)} icon={Activity}>Bionic Read</ChoiceBtn>
                                            <ChoiceBtn active={settings.textShadow} onClick={() => update('textShadow', !settings.textShadow)} icon={Ghost}>Shadow Mask</ChoiceBtn>
                                        </div>

                                        <div className="space-y-4">
                                            <SliderBox label="Line Height" value={settings.lineHeight} min={1.0} max={3.0} step={0.1} onChange={(v: number) => update('lineHeight', v)} />
                                            <SliderBox label="Word Spacing" value={settings.wordSpacing} min={0} max={20} step={2} onChange={(v: number) => update('wordSpacing', v)} />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {['none', 'uppercase', 'lowercase', 'capitalize'].map(c => (
                                                <button key={c} onClick={() => update('textCase', c)} className={cn("flex-1 py-3 text-[9px] font-black rounded-2xl border transition uppercase",
                                                    settings.textCase === c ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-card hover:bg-secondary")}>
                                                    {c === 'none' ? 'Ab' : c === 'uppercase' ? 'AB' : c === 'lowercase' ? 'ab' : 'Aa'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* --- MODULE: THEME & COLOR --- */}
                            {(activeTab === 'all' || activeTab === 'display') && (
                                <Section title="Visual Profiles">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-3 gap-2">
                                            <ProfileBtn active={settings.contrast === 'dark'} onClick={() => update('contrast', 'dark')} icon={Moon} label="Dark" />
                                            <ProfileBtn active={settings.contrast === 'light'} onClick={() => update('contrast', 'light')} icon={Lightbulb} label="Bright" />
                                            <ProfileBtn active={settings.contrast === 'solarized'} onClick={() => update('contrast', 'solarized')} icon={Sun} label="Solar" />
                                            <ProfileBtn active={settings.contrast === 'matrix'} onClick={() => update('contrast', 'matrix')} icon={Torus} label="Neon" />
                                            <ProfileBtn active={settings.contrast === 'invert'} onClick={() => update('contrast', 'invert')} icon={Contrast} label="Invert" />
                                            <ProfileBtn active={settings.monochrome} onClick={() => update('monochrome', !settings.monochrome)} icon={Palette} label="Gray" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <AdvancedToggle active={settings.highContrastText} onClick={() => update('highContrastText', !settings.highContrastText)} icon={Contrast} label="High Contrast Text" desc="Optimizes text readability globally" />
                                            <AdvancedToggle active={settings.textGlow} onClick={() => update('textGlow', !settings.textGlow)} icon={Lightbulb} label="Text Outer Glow" desc="Adds neon clarity to character edges" />
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 text-center">Color Overlay Shaders</label>
                                            <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-3xl border-2 border-dashed border-blue-200/50">
                                                {['none', 'green', 'rose', 'yellow'].map(tint => (
                                                    <button key={tint} onClick={() => update('screenShader', tint)} className={cn("w-14 h-14 rounded-full transition-all flex items-center justify-center relative",
                                                        tint === 'none' ? "bg-white border-2 text-[10px] font-black" :
                                                            tint === 'green' ? "bg-green-400" :
                                                                tint === 'rose' ? "bg-rose-400" : "bg-yellow-300",
                                                        settings.screenShader === tint && "ring-4 ring-blue-600 ring-offset-4 scale-110 shadow-xl"
                                                    )}>
                                                        {tint === 'none' && 'OFF'}
                                                        {settings.screenShader === tint && tint !== 'none' && <Droplet className="w-5 h-5 text-white animate-bounce" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* --- MODULE: INTERACTION --- */}
                            {(activeTab === 'all' || activeTab === 'tools') && (
                                <Section title="Navigation & Guides">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ChoiceBtn active={settings.autoScroll} onClick={() => update('autoScroll', !settings.autoScroll)} icon={PlayCircle}>Auto-Scroll</ChoiceBtn>
                                        <ChoiceBtn active={settings.magnifier} onClick={() => update('magnifier', !settings.magnifier)} icon={Search}>Magnifier</ChoiceBtn>
                                        <ChoiceBtn active={settings.readingGuide} onClick={() => update('readingGuide', !settings.readingGuide)} icon={Ruler}>Reading Line</ChoiceBtn>
                                        <ChoiceBtn active={settings.cursorTracer} onClick={() => update('cursorTracer', !settings.cursorTracer)} icon={Droplet}>Mouse Trace</ChoiceBtn>
                                    </div>

                                    {settings.autoScroll && <SliderBox label="Scroll Speed" value={settings.autoScrollSpeed} min={1} max={10} step={1} onChange={(v: number) => update('autoScrollSpeed', v)} />}

                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">High-Visibility Pointers</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'default', label: 'STD', color: 'bg-zinc-800' },
                                                { id: 'big-white', label: 'BIG-W', color: 'bg-white border' },
                                                { id: 'neon-red', label: 'NEON-R', color: 'bg-red-500 shadow-[0_0_10px_red]' },
                                                { id: 'neon-cyan', label: 'NEON-C', color: 'bg-cyan-400 shadow-[0_0_10px_cyan]' }
                                            ].map(p => (
                                                <button key={p.id} onClick={() => update('cursor', p.id)} className={cn("aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2",
                                                    settings.cursor === p.id ? "border-blue-600 scale-105 shadow-md bg-blue-50" : "border-transparent bg-secondary/40")}>
                                                    <div className={cn("w-6 h-6 rounded-full", p.color)} />
                                                    <span className="text-[8px] font-black">{p.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* --- MODULE: ELITE ADVANCED --- */}
                            {(activeTab === 'all' || activeTab === 'advanced') && (
                                <Section title="Elite Expert Controls">
                                    <div className="grid grid-cols-1 gap-3">
                                        <EliteToggle active={settings.epilepsySafe} onClick={() => update('epilepsySafe', !settings.epilepsySafe)} icon={ShieldAlert} label="Epilepsy Safeguard" desc="Neutralizes all rapid motion and blinking" />
                                        <EliteToggle active={settings.interactionHeatmap} onClick={() => update('interactionHeatmap', !settings.interactionHeatmap)} icon={MousePointerClick} label="UI Touch Heatmap" desc="Visualizes target areas on page load" />
                                        <EliteToggle active={settings.noSticky} onClick={() => update('noSticky', !settings.noSticky)} icon={PinOff} label="Fixed Elements Hide" desc="Cleans page by unpinning headers/footers" />
                                        <EliteToggle active={settings.altTextShow} onClick={() => update('altTextShow', !settings.altTextShow)} icon={MessageSquare} label="Alt Description Render" desc="Reveals image metadata on hover" />

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <ChoiceBtn active={settings.keyboardFocus} onClick={() => update('keyboardFocus', !settings.keyboardFocus)} icon={Keyboard}>Focus Ring</ChoiceBtn>
                                            <ChoiceBtn active={settings.sharpEdges} onClick={() => update('sharpEdges', !settings.sharpEdges)} icon={BoxSelect}>Sharp UI</ChoiceBtn>
                                            <ChoiceBtn active={settings.readableWidth} onClick={() => update('readableWidth', !settings.readableWidth)} icon={WrapText}>Read Width</ChoiceBtn>
                                            <ChoiceBtn active={settings.focusMode} onClick={() => update('focusMode', !settings.focusMode)} icon={Maximize}>Focus Mode</ChoiceBtn>
                                        </div>
                                    </div>
                                </Section>
                            )}
                        </div>

                        {/* Footer Attribution */}
                        <div className="p-7 border-t shrink-0 flex flex-col items-center gap-2 bg-blue-600/5 backdrop-blur-3xl">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)] animate-pulse" />
                                <p className="text-[11px] font-black tracking-widest text-blue-700 uppercase">FEATURES BY ESYSTEMLK</p>
                            </div>
                            <p className="text-[8px] opacity-40 font-bold uppercase tracking-widest">Ultimate Inclusive Smart Technology</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ULTIMATE SUB-COMPONENTS
function IconTab({ active, onClick, icon: Icon, label }: any) {
    return (
        <button onClick={onClick} className={cn("flex flex-col items-center justify-center p-4 rounded-[28px] min-w-[85px] transition-all duration-300 border-2",
            active ? "bg-white text-blue-600 border-blue-100 shadow-xl scale-105 z-10" : "hover:bg-white/60 border-transparent text-muted-foreground scale-95 opacity-70")}>
            <Icon className={cn("w-5 h-5 mb-1.5 transition-transform", active && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
        </button>
    )
}
function Section({ title, children }: any) {
    return (<div className="space-y-5"><h3 className="text-[11px] font-black text-blue-600/40 uppercase tracking-[0.25em] ml-1 flex items-center gap-4">
        {title} <div className="h-px flex-1 bg-blue-600/5" />
    </h3>{children}</div>)
}
function ChoiceBtn({ active, onClick, icon: Icon, children }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-3 p-4 rounded-[24px] border-2 transition-all text-left group",
        active ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-card hover:bg-secondary/40 border-border/40")}>
        {Icon && <Icon className={cn("w-4 h-4 transition-transform", active ? "scale-110" : "opacity-40 group-hover:scale-110")} />}
        <span className="text-[10px] font-black uppercase tracking-tight leading-none">{children}</span>
    </button>)
}
function ProfileBtn({ active, onClick, icon: Icon, label }: any) {
    return (<button onClick={onClick} className={cn("flex flex-col items-center gap-2 p-4 rounded-[24px] border-2 transition-all",
        active ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105" : "bg-card hover:bg-secondary/40 border-border/40")}>
        <Icon className="w-5 h-5" />
        <span className="text-[9px] font-black uppercase">{label}</span>
    </button>)
}
function SliderBox({ label, value, min, max, step, onChange }: any) {
    return (<div className="flex flex-col gap-3 p-4 bg-secondary/30 rounded-[28px] border border-white">
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
            <span>{label}</span>
            <span className="text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 rounded-full cursor-pointer" />
    </div>)
}
function AdvancedToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-4 p-4 rounded-[32px] border-2 transition-all text-left", active ? "bg-blue-50 border-blue-200" : "bg-card border-border/40 hover:bg-secondary/20")}>
        <div className={cn("p-2.5 rounded-2xl shadow-sm", active ? "bg-blue-600 text-white" : "bg-secondary text-muted-foreground")}><Icon className="w-5 h-5" /></div>
        <div className="flex flex-col"><span className="text-[11px] font-black uppercase text-foreground">{label}</span><span className="text-[9px] opacity-50 font-medium leading-tight">{desc}</span></div>
        <div className={cn("ml-auto w-5 h-5 rounded-full border-2 transition-all", active ? "bg-blue-600 border-blue-400 scale-110" : "bg-zinc-200 border-transparent")} />
    </button>)
}
function EliteToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (<button onClick={onClick} className={cn("flex items-center gap-4 p-4 rounded-[36px] border-2 transition-all text-left overflow-hidden relative group", active ? "bg-indigo-600 text-white border-indigo-500 shadow-xl" : "bg-card hover:bg-secondary/20 border-border/40 shadow-sm")}>
        <div className={cn("p-3 rounded-2xl transition-transform", active ? "bg-white/20" : "bg-secondary group-hover:scale-110")}><Icon className="w-5 h-5" /></div>
        <div className="flex flex-col"><span className="text-xs font-black uppercase tracking-tight">{label}</span><span className="text-[9px] opacity-60 font-medium leading-tight">{desc}</span></div>
        <Sparkles className={cn("absolute -top-2 -right-2 w-10 h-10 opacity-10 rotate-12 transition-transform", active ? "scale-150 rotate-0" : "scale-0")} />
    </button>)
}

/**
 * CORE LOGIC ENGINE
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
    if (s.contrast === 'high-contrast') filters.push('contrast(200%) brightness(120%)');
    if (s.monochrome) filters.push('grayscale(100%)');
    if (s.colorBlindness === 'protanopia') filters.push('sepia(30%) hue-rotate(-50deg)');
    if (s.colorBlindness === 'deuteranopia') filters.push('sepia(30%) hue-rotate(-20deg)');
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
    t('access-cursor-neon-red', s.cursor === 'neon-red');
    t('access-cursor-neon-cyan', s.cursor === 'neon-cyan');
    t('access-highlight-links', s.highlightLinks);
    t('access-readable-width', s.readableWidth);
    t('access-epilepsy-safe', s.epilepsySafe);
    t('access-keyboard-focus', s.keyboardFocus);
    t('access-highlight-interactive', s.highlightInteractive);
    t('access-no-sticky', s.noSticky);
    t('access-text-glow', s.textGlow);
    t('access-para-spacing', s.paragraphSpacing);
    t('access-big-text-focus', s.bigTextFocus);
    t('access-high-contrast-text', s.highContrastText);
    t('access-sharp-edges', s.sharpEdges);
    t('access-alt-text-show', s.altTextShow);
}
