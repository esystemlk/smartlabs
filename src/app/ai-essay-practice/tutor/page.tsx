'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { getEssaySession } from '@/lib/services/essay-session.service';
import type { EssaySession } from '@/types/essay';
import { EssayResultDetails } from '@/components/essay/EssayResultDetails';
import { LottieTutorAvatar } from '@/components/essay-tutor/LottieTutorAvatar';
import { useLipSync } from '@/hooks/useLipSync';
import { useCursorTracking } from '@/hooks/useCursorTracking';
import { WalkingLoader } from '@/components/ui/walking-loader';
import { Markdown } from '@/components/ui/markdown';
import {
  Send, Mic, ArrowLeft, Volume2, VolumeX, Loader2, Sparkles, BookOpen,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  { label: 'Explain my weakest area', prompt: 'What is my single weakest area, and how do I fix it?' },
  { label: 'Content', prompt: 'Explain my Content score and how to improve it.' },
  { label: 'Structure (DSC)', prompt: 'Explain my Development, Structure & Coherence score and the most important fix.' },
  { label: 'Grammar', prompt: 'Walk me through my grammar mistakes and how to correct them.' },
  { label: 'Vocabulary', prompt: 'How can I improve my vocabulary range based on my essay?' },
  { label: 'Coherence', prompt: 'Where did my essay lose coherence, and how do I fix the flow?' },
  { label: 'Thesis', prompt: 'Was my thesis clear and well developed? How can I strengthen it?' },
  { label: 'Argument quality', prompt: 'How strong were my arguments and how do I make them more convincing?' },
  { label: 'Reach my target', prompt: 'What exactly do I need to do to reach my target band?' },
  { label: 'Rewrite my weakest sentence', prompt: 'Rewrite the weakest sentence in my essay and explain why.' },
];

// Google Cloud TTS voice names for each gender.
const TTS_VOICES: Record<'female' | 'male', string> = {
  female: 'en-US-Neural2-F',
  male: 'en-US-Neural2-D',
};

// Strip markdown so the spoken voice sounds natural.
function toSpeech(md: string): string {
  return md
    .replace(/\[![^\]]*\]/g, '')
    .replace(/[*_`#>]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function weakestCriterion(session: EssaySession): string | null {
  const c = session.result?.criteria;
  if (!c || c.length === 0) return null;
  let worst = c[0];
  let worstRatio = c[0].score / (c[0].max || 1);
  for (const cr of c) {
    const r = cr.score / (cr.max || 1);
    if (r < worstRatio) { worst = cr; worstRatio = r; }
  }
  return worst.name;
}

function TutorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { user, isUserLoading } = useUser();

  const [session, setSession] = useState<EssaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [voiceEngine, setVoiceEngine] = useState<'browser' | 'cloud'>('browser');

  const { mouthOpen, state, setState, play, speakBrowser, stop, ensureContext } = useLipSync();
  // Avatar's eyes follow the cursor (pupils only — no body rotation).
  const faceRef = useCursorTracking({ lean: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Redirect if signed out ──
  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
  }, [isUserLoading, user, router]);

  // ── Load the session ──
  useEffect(() => {
    if (isUserLoading || !user) return;
    if (!sessionId) { setLoadError('No session specified.'); setLoading(false); return; }
    let active = true;
    (async () => {
      try {
        const s = await getEssaySession(user.uid, sessionId);
        if (!active) return;
        if (!s) { setLoadError('We could not find that scoring session.'); }
        else {
          setSession(s);
          const weak = weakestCriterion(s);
          setMessages([{
            role: 'assistant',
            content: `Hi! I'm **Alora**, your AI writing tutor. I've read your full result — you scored **Band ${s.result.overallBand}**.${weak ? ` Your biggest opportunity right now is **${weak}**.` : ''} Ask me anything, or tap a topic below to begin.`,
          }]);
        }
      } catch (e) {
        if (active) setLoadError('Failed to load your session. Please try again.');
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isUserLoading, user, sessionId]);

  // ── Web Speech recognition (mic input) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) setInput(prev => prev + event.results[i][0].transcript);
      }
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  const toggleRecording = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isRecording) { rec.stop(); setIsRecording(false); }
    else { try { rec.start(); setIsRecording(true); } catch { /* already started */ } }
  };

  // ── Auto-scroll ──
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // ── Speak a reply — free browser voice (default) or premium Cloud TTS ──
  const speak = async (text: string) => {
    const spoken = toSpeech(text);
    if (!spoken) return;

    // Free, on-device browser voice — no API key, no cost.
    if (voiceEngine === 'browser') {
      await speakBrowser(spoken, voiceGender);
      return;
    }

    // Premium Google Cloud TTS (real audio amplitude lip-sync).
    if (!user) return;
    try {
      setState('thinking');
      const token = await user.getIdToken();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: spoken, voice: TTS_VOICES[voiceGender] }),
      });
      if (!res.ok) {
        // Cloud failed (e.g. key not set) — fall back to the free browser voice.
        await speakBrowser(spoken, voiceGender);
        return;
      }
      const { audio } = await res.json();
      if (audio) await play(audio);
      else await speakBrowser(spoken, voiceGender);
    } catch {
      await speakBrowser(spoken, voiceGender);
    }
  };

  // ── Send a message + consume the streaming reply ──
  const handleSend = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || isTyping || !session || !user || !sessionId) return;

    // Cloud TTS plays through an AudioContext — create/resume it inside this user
    // gesture so playback isn't blocked by the autoplay policy.
    if (!muted && voiceEngine === 'cloud') ensureContext();

    const base: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages([...base, { role: 'assistant', content: '' }]);
    setInput('');
    setIsTyping(true);
    stop(); // stop any current speech

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/essay-tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, messages: base }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'The tutor is unavailable right now.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      let first = true;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (first) { first = false; setIsTyping(false); }
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      setIsTyping(false);
      if (!muted && acc.trim()) await speak(acc);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: `_${msg}_` };
        return copy;
      });
      setIsTyping(false);
    }
  };

  const avatarState = isRecording ? 'listening' : isTyping ? 'thinking' : state;

  // ── Loading / error states ──
  if (isUserLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <WalkingLoader message="Getting your AI Tutor ready…" size={180} />
      </div>
    );
  }
  if (loadError || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-slate-700 font-semibold">{loadError ?? 'Session not available.'}</p>
        <Link href="/ai-essay-practice" className="px-5 py-2.5 rounded-xl bg-[#f97316] text-white font-bold text-sm">
          Back to Essay Practice
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/ai-essay-practice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Essay Practice
          </Link>
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <Sparkles size={16} className="text-[#f97316]" /> AI Tutor
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_minmax(380px,460px)] gap-6">
        {/* LEFT — full scoring details */}
        <div className="order-2 lg:order-1">
          {/* Question + essay */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#f97316] mb-1 flex items-center gap-1.5">
              <BookOpen size={13} /> Essay Question
            </p>
            <p className="text-slate-800 font-semibold mb-4">{session.topic || '—'}</p>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Your Answer</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{session.essayText}</p>
          </div>

          <EssayResultDetails
            result={session.result}
            essayText={session.essayText}
            topic={session.topic}
            targetScore={session.targetScore}
          />
        </div>

        {/* RIGHT — tutor chat */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col h-[calc(100vh-7rem)]">
            {/* Avatar header */}
            <div className="pt-6 pb-4 px-4 border-b border-slate-100 flex flex-col items-center relative">
              <button
                onClick={() => { setMuted(m => !m); if (!muted) stop(); }}
                className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                title={muted ? 'Unmute voice' : 'Mute voice'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <div ref={faceRef} style={{ transition: 'transform 0.18s ease-out', willChange: 'transform' }}>
                <LottieTutorAvatar mouthOpen={mouthOpen} state={avatarState} />
              </div>

              {/* Voice controls */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {/* Gender */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-black">
                  <button
                    onClick={() => { setVoiceGender('female'); stop(); }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${voiceGender === 'female' ? 'bg-white text-[#f97316] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Female
                  </button>
                  <button
                    onClick={() => { setVoiceGender('male'); stop(); }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${voiceGender === 'male' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Male
                  </button>
                </div>

                {/* Engine */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-black">
                  <button
                    onClick={() => { setVoiceEngine('browser'); stop(); }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${voiceEngine === 'browser' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Free on-device browser voice"
                  >
                    Browser · Free
                  </button>
                  <button
                    onClick={() => { setVoiceEngine('cloud'); stop(); }}
                    className={`px-2.5 py-1 rounded-md transition-colors ${voiceEngine === 'cloud' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Premium Google Cloud voice (more natural)"
                  >
                    Premium
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-md bg-[#f97316] text-white px-4 py-2.5 text-sm font-medium'
                        : 'max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 text-slate-800 px-4 py-2.5'
                    }
                  >
                    {m.role === 'assistant'
                      ? (m.content ? <Markdown content={m.content} /> : <span className="inline-flex gap-1 text-slate-400"><Dot /><Dot /><Dot /></span>)
                      : m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => handleSend(qa.prompt)}
                  disabled={isTyping}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-orange-50 text-[#f97316] border border-orange-200 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input dock */}
            <div className="p-3 border-t border-slate-100 flex items-end gap-2">
              <button
                onClick={toggleRecording}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Speak"
              >
                <Mic size={18} />
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask your tutor anything about your result…"
                rows={1}
                className="flex-1 resize-none max-h-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30"
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                className="w-10 h-10 shrink-0 rounded-xl bg-[#f97316] hover:bg-[#fb923c] text-white flex items-center justify-center disabled:opacity-50"
                title="Send"
              >
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce inline-block" style={{ animationDuration: '0.8s' }} />;
}

export default function EssayTutorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><WalkingLoader message="Loading…" size={180} /></div>}>
      <TutorInner />
    </Suspense>
  );
}
