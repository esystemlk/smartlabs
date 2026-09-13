import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { scoreSpeaking, type SpeakingScore } from '@/api/score';
import { ApiError } from '@/api/client';
import { SpeechRecorder } from '@/audio/recorder';
import { PromptPlayer } from '@/audio/player';
import { useAuth } from '@/auth/AuthContext';
import { bumpSession } from '@/lib/progress';
import { BackLink, slate, tint } from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

type Present = 'text' | 'audio' | 'image';
interface TaskMeta {
  promptKey: string;
  present: Present;
  instruction: string;
  subtitle: string;
  prep: number;
  record: number;
}

// Mirrors the website dashboard/practice/* pages (prep + record seconds, prompt
// presentation, and the "how it works" line) so the flow matches smartlabs.lk.
const META: Record<string, TaskMeta> = {
  'read-aloud': { promptKey: 'text', present: 'text', instruction: 'Read the passage aloud', subtitle: 'Read the passage aloud, clearly and at a natural pace.', prep: 35, record: 40 },
  'repeat-sentence': { promptKey: 'text', present: 'audio', instruction: 'Listen, then repeat the sentence', subtitle: 'Listen to the sentence, then repeat it exactly.', prep: 2, record: 15 },
  'describe-image': { promptKey: 'describe', present: 'image', instruction: 'Describe the image', subtitle: 'Study the image, then describe it in detail.', prep: 25, record: 40 },
  'retell-lecture': { promptKey: 'transcript', present: 'audio', instruction: 'Retell the lecture', subtitle: 'Listen to the lecture, then retell the main points.', prep: 10, record: 40 },
  'answer-short-question': { promptKey: 'question', present: 'audio', instruction: 'Answer in a few words', subtitle: 'Listen to the question and answer briefly.', prep: 2, record: 10 },
  'summarize-group-discussion': { promptKey: 'transcript', present: 'audio', instruction: 'Summarize the discussion', subtitle: 'Listen to the discussion, then summarize it.', prep: 10, record: 40 },
  'respond-to-situation': { promptKey: 'situation', present: 'text', instruction: 'Respond to the situation', subtitle: 'Read the situation and respond appropriately.', prep: 20, record: 40 },
};

type Phase = 'idle' | 'listening' | 'prep' | 'recording' | 'scoring' | 'result' | 'error';

export function SpeakingTrainer({ task, question, accent, onBack }: TrainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const meta = META[task.taskType] ?? { promptKey: 'text', present: 'text' as Present, instruction: 'Speak your answer', subtitle: 'Speak your answer.', prep: 20, record: 40 };
  const promptText = String(question[meta.promptKey] ?? question.text ?? '');
  const title = typeof question.title === 'string' ? question.title : '';
  const svg = typeof question.svg === 'string' ? question.svg : '';
  const audioUrl = typeof question.audioUrl === 'string' ? question.audioUrl : undefined;

  const recorderRef = useRef<SpeechRecorder | null>(null);
  const playerRef = useRef<PromptPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SpeakingScore | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const reset = useCallback(() => {
    clearTimer();
    recorderRef.current?.cancel();
    recorderRef.current = null;
    playerRef.current?.stop();
    setPhase('idle'); setResult(null); setError(''); setCount(0); setShowTranscript(false);
  }, []);

  // Reset when the item changes / on unmount.
  useEffect(() => { reset(); }, [question?.id, reset]);
  useEffect(() => () => { clearTimer(); recorderRef.current?.cancel(); playerRef.current?.unload(); }, []);

  const submit = useCallback(async (dataUri: string) => {
    setPhase('scoring');
    try {
      const score = await scoreSpeaking({ taskType: task.taskType, promptText, audioDataUri: dataUri });
      setResult(score);
      setPhase('result');
      bumpSession(user?.uid);
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of speaking credits.');
        setPhase('error');
        router.push('/credits');
      } else {
        setError(e instanceof Error ? e.message : 'Scoring failed. Please try again.');
        setPhase('error');
      }
    }
  }, [task.taskType, promptText, user?.uid, router]);

  const stopRecording = useCallback(async () => {
    clearTimer();
    try {
      const rec = recorderRef.current;
      if (!rec) return;
      const { dataUri } = await rec.stop();
      recorderRef.current = null;
      void submit(dataUri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the recording.');
      setPhase('error');
    }
  }, [submit]);

  const startRecording = useCallback(async () => {
    try {
      recorderRef.current = new SpeechRecorder();
      await recorderRef.current.start();
      setPhase('recording');
      setCount(meta.record);
      clearTimer();
      timerRef.current = setInterval(() => {
        setCount((c) => {
          if (c <= 1) { clearTimer(); void stopRecording(); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError('Microphone access was blocked. Please allow the mic and try again.');
      setPhase('error');
    }
  }, [meta.record, stopRecording]);

  const beginPrep = useCallback(() => {
    setCount(meta.prep);
    setPhase('prep');
    clearTimer();
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearTimer(); void startRecording(); return 0; }
        return c - 1;
      });
    }, 1000);
  }, [meta.prep, startRecording]);

  const start = useCallback(async () => {
    setError(''); setResult(null);
    if (!(await SpeechRecorder.requestPermission())) {
      setError('Microphone permission is required to record your answer.');
      setPhase('error');
      return;
    }
    // Audio prompts play once (like the exam) before preparation begins.
    if (meta.present === 'audio') {
      setPhase('listening');
      try {
        playerRef.current = new PromptPlayer();
        await playerRef.current.prepare({ audioUrl, text: promptText });
        await playerRef.current.play();
      } catch {
        /* fall through to prep even if playback fails */
      }
    }
    beginPrep();
  }, [meta.present, audioUrl, promptText, beginPrep]);

  const busy = phase === 'listening' || phase === 'prep' || phase === 'recording' || phase === 'scoring';

  return (
    <View style={{ gap: 14 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <BackLink label="All items" onPress={onBack} accent={accent} />
          <Text style={[styles.title, { color: accent }]}>{task.label}</Text>
          <Text style={styles.subtitle}>{meta.subtitle}</Text>
        </View>
        <View style={[styles.aiPill, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons name="sparkles" size={12} color={accent} />
          <Text style={[styles.aiPillText, { color: accent }]}>AI Score · {task.weight}</Text>
        </View>
      </View>

      {/* Prompt card */}
      <View style={[styles.promptCard, busy && { borderColor: accent, borderWidth: 2 }]}>
        <Text style={styles.instruction}>{meta.instruction}</Text>
        {meta.present === 'image' ? (
          svg ? <View style={styles.imageWrap}><SvgXml xml={svg} width="100%" height={220} /></View> : <Text style={styles.promptText}>{promptText}</Text>
        ) : meta.present === 'audio' ? (
          <View style={styles.audioNote}>
            <Ionicons name="volume-high" size={18} color={slate[500]} />
            <Text style={styles.audioNoteText}>The prompt plays once when you start — the text is hidden, just like the real exam.</Text>
          </View>
        ) : (
          <>
            {title ? <Text style={[styles.itemTitle, { color: accent }]}>{title.toUpperCase()}</Text> : null}
            <Text style={styles.promptText}>{promptText}</Text>
          </>
        )}
      </View>

      {/* Recorder */}
      <View style={styles.recorderCard}>
        {phase === 'idle' && (
          <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]}>
            <Ionicons name="mic" size={18} color="#fff" />
            <Text style={styles.startBtnText}>Start</Text>
          </Pressable>
        )}
        {phase === 'listening' && (
          <View style={styles.centerRow}>
            <Ionicons name="volume-high" size={22} color={accent} />
            <Text style={styles.stateText}>Listen…</Text>
          </View>
        )}
        {phase === 'prep' && (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.stateHint}>Get ready — recording starts in</Text>
            <Text style={[styles.bigCount, { color: accent }]}>{count}</Text>
            <Pressable onPress={() => { clearTimer(); void startRecording(); }} hitSlop={8}>
              <Text style={[styles.skip, { color: accent }]}>Skip & record now</Text>
            </Pressable>
          </View>
        )}
        {phase === 'recording' && (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={styles.centerRow}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>Recording… {count}s</Text>
            </View>
            <Pressable onPress={() => void stopRecording()} style={styles.stopBtn}>
              <Ionicons name="stop" size={16} color="#fff" />
              <Text style={styles.stopBtnText}>Stop & Score</Text>
            </Pressable>
          </View>
        )}
        {phase === 'scoring' && (
          <View style={styles.centerRow}>
            <ActivityIndicator color={accent} />
            <Text style={styles.stateText}>Scoring your response with AI…</Text>
          </View>
        )}
        {phase === 'error' && (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={styles.centerRow}>
              <Ionicons name="alert-circle" size={18} color={slate.red} />
              <Text style={styles.errText}>{error}</Text>
            </View>
            <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.startBtnText}>Try again</Text>
            </Pressable>
          </View>
        )}
        {phase === 'result' && (
          <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.startBtnText}>Record again</Text>
          </Pressable>
        )}
      </View>

      {/* Result */}
      {phase === 'result' && result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHead}>
            <Text style={styles.resultTitle}>Your AI Score</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.overall}>
                <Text style={[styles.overallNum, { color: accent }]}>{Math.round(result.overall)}</Text>
                <Text style={styles.overallMax}>/90</Text>
              </Text>
              <Text style={styles.overallLabel}>Overall</Text>
            </View>
          </View>

          <View style={{ gap: 14, marginTop: 12 }}>
            {[
              { label: 'Content', v: result.content, fb: result.contentFeedback },
              { label: 'Oral Fluency', v: result.fluency, fb: result.fluencyFeedback },
              { label: 'Pronunciation', v: result.pronunciation, fb: result.pronunciationFeedback },
            ].map((row) => (
              <View key={row.label} style={{ gap: 5 }}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricLabel}>{row.label}</Text>
                  <Text style={styles.metricVal}>{Math.round(row.v)}/90</Text>
                </View>
                <View style={styles.metricTrack}><View style={[styles.metricFill, { width: `${(row.v / 90) * 100}%`, backgroundColor: accent }]} /></View>
                {row.fb ? <Text style={styles.metricFb}>{row.fb}</Text> : null}
              </View>
            ))}
          </View>

          {result.tips?.length ? (
            <View style={[styles.tips, { backgroundColor: tint(accent, 0.1) }]}>
              <View style={styles.centerRowLeft}>
                <Ionicons name="checkmark-done" size={14} color={accent} />
                <Text style={[styles.tipsHead, { color: accent }]}>TIPS</Text>
              </View>
              {result.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={[styles.tipDot, { color: accent }]}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable onPress={() => setShowTranscript((v) => !v)} style={styles.transToggle} hitSlop={6}>
            <Ionicons name={showTranscript ? 'chevron-down' : 'chevron-forward'} size={14} color={slate[500]} />
            <Text style={styles.transToggleText}>{showTranscript ? 'Hide transcript' : 'Show transcript'}</Text>
          </Pressable>
          {showTranscript ? <Text style={styles.transcript}>{result.transcript || '—'}</Text> : null}

          <Pressable onPress={onBack} style={styles.anotherBtn}>
            <Text style={styles.anotherBtnText}>Practise Another</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 13, color: slate[500], marginTop: 3 },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 22 },
  aiPillText: { fontSize: 11, fontWeight: '800' },

  promptCard: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 18, gap: 10 },
  instruction: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: slate[500] },
  itemTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  promptText: { fontSize: 17, lineHeight: 26, color: slate[800] },
  imageWrap: { backgroundColor: '#fff', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: slate[200] },
  audioNote: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  audioNoteText: { flex: 1, fontSize: 13, color: slate[500], lineHeight: 19 },

  recorderCard: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 20, alignItems: 'center' },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  centerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  stateText: { fontSize: 14, color: slate[600], fontWeight: '500' },
  stateHint: { fontSize: 13, color: slate[500] },
  bigCount: { fontSize: 40, fontWeight: '900' },
  skip: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: slate.red },
  recText: { fontSize: 15, fontWeight: '800', color: slate.red },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: slate.red, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  stopBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  errText: { fontSize: 13, color: slate.red, flexShrink: 1 },

  resultCard: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 18 },
  resultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultTitle: { fontSize: 17, fontWeight: '800', color: slate[900] },
  overall: { textAlign: 'right' },
  overallNum: { fontSize: 30, fontWeight: '900' },
  overallMax: { fontSize: 15, color: slate[400], fontWeight: '700' },
  overallLabel: { fontSize: 11, color: slate[400] },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 14, fontWeight: '600', color: slate[700] },
  metricVal: { fontSize: 14, fontWeight: '800', color: slate[800] },
  metricTrack: { height: 8, borderRadius: 4, backgroundColor: slate[100], overflow: 'hidden' },
  metricFill: { height: 8, borderRadius: 4 },
  metricFb: { fontSize: 12.5, color: slate[500], lineHeight: 18 },
  tips: { borderRadius: 14, padding: 14, marginTop: 16, gap: 6 },
  tipsHead: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipDot: { fontSize: 14, lineHeight: 20 },
  tipText: { flex: 1, fontSize: 13.5, color: slate[700], lineHeight: 20 },
  transToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  transToggleText: { fontSize: 12, fontWeight: '700', color: slate[500] },
  transcript: { fontSize: 14, color: slate[600], lineHeight: 22, backgroundColor: slate[50], borderRadius: 12, padding: 12, marginTop: 8 },
  anotherBtn: { backgroundColor: slate[900], borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  anotherBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
