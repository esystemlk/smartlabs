'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AvatarState = 'idle' | 'thinking' | 'listening' | 'speaking';

/**
 * Plays base64 MP3 audio and exposes a real-time `mouthOpen` amplitude (0..1)
 * derived from the playing audio via a Web Audio AnalyserNode — drives the
 * tutor avatar's mouth in sync with the spoken voice.
 */
export function useLipSync() {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [state, setState] = useState<AvatarState>('idle');

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
      const analyser = ctxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.fftSize);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stopLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setMouthOpen(0);
    setState('idle');
  }, [stopLoop]);

  /** Play base64-encoded MP3; resolves when playback ends. Must be called from a user gesture chain. */
  const play = useCallback(
    (base64: string) =>
      new Promise<void>((resolve) => {
        try {
          const ctx = ensureContext();
          const analyser = analyserRef.current!;
          const data = dataRef.current!;

          // Fresh element + source per utterance (a source node can't be reused).
          const audio = new Audio(`data:audio/mp3;base64,${base64}`);
          audio.crossOrigin = 'anonymous';
          audioRef.current = audio;
          const source = ctx.createMediaElementSource(audio);
          sourceRef.current = source;
          source.connect(analyser);
          analyser.connect(ctx.destination); // must connect to destination or it's silent

          const tick = () => {
            analyser.getByteTimeDomainData(data);
            // RMS around the 128 midpoint → 0..1 amplitude
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);
            const open = Math.max(0, Math.min(1, rms * 3.2));
            setMouthOpen(open);
            rafRef.current = requestAnimationFrame(tick);
          };

          const finish = () => {
            stopLoop();
            setMouthOpen(0);
            setState('idle');
            try { source.disconnect(); } catch { /* noop */ }
            resolve();
          };

          audio.onended = finish;
          audio.onerror = finish;

          setState('speaking');
          audio
            .play()
            .then(() => {
              rafRef.current = requestAnimationFrame(tick);
            })
            .catch(() => finish());
        } catch {
          setState('idle');
          resolve();
        }
      }),
    [ensureContext, stopLoop]
  );

  /** Pick a male/female system voice from the browser's available voices. */
  const pickBrowserVoice = useCallback((gender: 'female' | 'male'): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const en = voices.filter(v => /^en/i.test(v.lang));
    const list = en.length ? en : voices;
    const femaleRe = /(female|zira|samantha|aria|jenny|susan|fiona|tessa|karen|moira|serena|google us english)/i;
    const maleRe = /(\bmale\b|david|mark|alex|daniel|fred|george|james|guy|google uk english male)/i;
    const re = gender === 'male' ? maleRe : femaleRe;
    return list.find(v => re.test(v.name)) || list[0] || null;
  }, []);

  /**
   * Speak with the browser's free Web Speech API. There's no audio stream to
   * analyse, so the mouth is driven by a synthetic "talking" oscillation while
   * the utterance is active. Resolves when speech ends.
   */
  const speakBrowser = useCallback(
    (text: string, gender: 'female' | 'male') =>
      new Promise<void>((resolve) => {
        try {
          if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          const voice = pickBrowserVoice(gender);
          if (voice) u.voice = voice;
          u.rate = 1;
          u.pitch = gender === 'male' ? 0.9 : 1.05;

          const startT = performance.now();
          const animate = () => {
            const t = (performance.now() - startT) / 1000;
            // Open/close flap that dips to ~0 between syllables so a 0/1 mouth flaps.
            const wave = Math.abs(Math.sin(t * 11));
            setMouthOpen(Math.min(1, wave * (0.6 + 0.4 * Math.random())));
            rafRef.current = requestAnimationFrame(animate);
          };
          const finish = () => {
            stopLoop();
            setMouthOpen(0);
            setState('idle');
            resolve();
          };

          u.onstart = () => { setState('speaking'); rafRef.current = requestAnimationFrame(animate); };
          u.onend = finish;
          u.onerror = finish;

          setState('speaking');
          window.speechSynthesis.speak(u);
        } catch {
          setState('idle');
          resolve();
        }
      }),
    [pickBrowserVoice, stopLoop]
  );

  // Warm up the browser voice list (populated asynchronously on some browsers).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handler = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', handler);
      return () => window.speechSynthesis.removeEventListener?.('voiceschanged', handler);
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { mouthOpen, state, setState, play, speakBrowser, stop, ensureContext };
}
