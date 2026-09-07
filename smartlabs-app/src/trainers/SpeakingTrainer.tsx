import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Audio } from 'expo-av';
import { scoreSpeaking, type SpeakingScore } from '@/api/score';
import { ApiError } from '@/api/client';
import { SpeechRecorder } from '@/audio/recorder';
import { Button, Card } from '@/ui/components';
import { AudioButton, ScoreHeader, Bullets } from '@/ui/trainer';
import { theme } from '@/theme';
import type { TrainerProps } from '@/trainers/types';

type Present = 'text' | 'audio' | 'image';

const META: Record<string, { promptKey: string; present: Present; instruction: string }> = {
  'read-aloud': { promptKey: 'text', present: 'text', instruction: 'Read the text aloud, clearly and at a steady pace.' },
  'repeat-sentence': { promptKey: 'text', present: 'audio', instruction: 'Listen, then repeat the sentence exactly.' },
  'describe-image': { promptKey: 'describe', present: 'image', instruction: 'Describe the image in about 40 seconds.' },
  'retell-lecture': { promptKey: 'transcript', present: 'audio', instruction: 'Listen to the lecture, then retell the main points.' },
  'answer-short-question': { promptKey: 'question', present: 'audio', instruction: 'Listen and answer in a few words.' },
  'summarize-group-discussion': { promptKey: 'transcript', present: 'audio', instruction: 'Listen to the discussion, then summarize it.' },
  'respond-to-situation': { promptKey: 'situation', present: 'text', instruction: 'Read the situation and respond appropriately.' },
};

export function SpeakingTrainer({ task, question, onNext }: TrainerProps) {
  const router = useRouter();
  const meta = META[task.taskType] ?? { promptKey: 'text', present: 'text', instruction: 'Speak your answer.' };
  const promptText = String(question[meta.promptKey] ?? question.text ?? '');
  const title = typeof question.title === 'string' ? question.title : '';
  const svg = typeof question.svg === 'string' ? question.svg : '';

  const recorderRef = useRef<SpeechRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'recorded' | 'scoring'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeakingScore | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.cancel();
  }, []);

  const startRecording = async () => {
    setError(null);
    const ok = await SpeechRecorder.requestPermission();
    if (!ok) {
      setError('Microphone permission is required to record your answer.');
      return;
    }
    try {
      recorderRef.current = new SpeechRecorder();
      await recorderRef.current.start();
      setSeconds(0);
      setPhase('recording');
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { dataUri: uri } = await recorderRef.current!.stop();
      setDataUri(uri);
      setPhase('recorded');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save recording.');
      setPhase('idle');
    }
  };

  const playBack = async () => {
    if (!dataUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: dataUri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
    });
  };

  const submit = async () => {
    if (!dataUri) return;
    setError(null);
    setPhase('scoring');
    try {
      setResult(await scoreSpeaking({ taskType: task.taskType, promptText, audioDataUri: dataUri }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of speaking credits.');
        router.push('/credits');
      } else {
        setError(e instanceof Error ? e.message : 'Scoring failed.');
      }
      setPhase('recorded');
    }
  };

  const reset = () => {
    setResult(null);
    setDataUri(null);
    setSeconds(0);
    setPhase('idle');
    onNext();
  };

  if (result) {
    return (
      <View style={{ gap: 16 }}>
        <ScoreHeader score={result.overall} max={90} label={`${task.label} · overall`} />
        <Card style={{ gap: 12 }}>
          <Skill label="Content" score={result.content} feedback={result.contentFeedback} />
          <Skill label="Oral fluency" score={result.fluency} feedback={result.fluencyFeedback} />
          <Skill label="Pronunciation" score={result.pronunciation} feedback={result.pronunciationFeedback} />
        </Card>
        {result.transcript ? (
          <Card style={{ gap: 6 }}>
            <Text style={styles.blockTitle}>What we heard</Text>
            <Text style={styles.transcript}>{result.transcript}</Text>
          </Card>
        ) : null}
        <Bullets title="Tips" items={result.tips ?? []} />
        <Button label="Next question" onPress={reset} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Prompt presentation */}
      {meta.present === 'text' ? (
        <Card style={{ gap: title ? 8 : 0 }}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.prompt}>{promptText}</Text>
        </Card>
      ) : meta.present === 'image' ? (
        <Card style={{ gap: 10 }}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {svg ? (
            <View style={styles.imageWrap}>
              <SvgXml xml={svg} width="100%" height={220} />
            </View>
          ) : (
            <Text style={styles.prompt}>{promptText}</Text>
          )}
        </Card>
      ) : (
        <Card style={{ gap: 8 }}>
          <Text style={styles.hint}>Listen to the prompt — the text is hidden, just like the real exam.</Text>
          <AudioButton text={promptText} label="Play prompt" />
        </Card>
      )}

      <Text style={styles.instruction}>{meta.instruction}</Text>

      {/* Recorder */}
      <RecorderControl
        phase={phase}
        seconds={seconds}
        onStart={startRecording}
        onStop={stopRecording}
        onPlay={playBack}
        onSubmit={submit}
        onRedo={() => { setDataUri(null); setPhase('idle'); setSeconds(0); }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function RecorderControl({
  phase, seconds, onStart, onStop, onPlay, onSubmit, onRedo,
}: {
  phase: 'idle' | 'recording' | 'recorded' | 'scoring';
  seconds: number;
  onStart: () => void;
  onStop: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  onRedo: () => void;
}) {
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (phase === 'recording') {
    return (
      <Card style={{ alignItems: 'center', gap: 14 }}>
        <Text style={styles.timer}>{mmss}</Text>
        <Pressable onPress={onStop} style={styles.recBtnStop}>
          <Ionicons name="stop" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.hint}>Recording… tap to stop.</Text>
      </Card>
    );
  }
  if (phase === 'recorded') {
    return (
      <Card style={{ gap: 12 }}>
        <View style={styles.playbackRow}>
          <Pressable onPress={onPlay} style={styles.smallBtn}>
            <Ionicons name="play" size={18} color={theme.colors.accent} />
            <Text style={styles.smallBtnText}>Play back</Text>
          </Pressable>
          <Pressable onPress={onRedo} style={styles.smallBtn}>
            <Ionicons name="refresh" size={18} color={theme.colors.textMuted} />
            <Text style={[styles.smallBtnText, { color: theme.colors.textMuted }]}>Re-record</Text>
          </Pressable>
        </View>
        <Button label="Score my answer" onPress={onSubmit} />
      </Card>
    );
  }
  if (phase === 'scoring') {
    return (
      <Card style={{ alignItems: 'center', gap: 10 }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <Text style={styles.hint}>Scoring your recording…</Text>
      </Card>
    );
  }
  return (
    <Card style={{ alignItems: 'center', gap: 12 }}>
      <Pressable onPress={onStart} style={styles.recBtn}>
        <Ionicons name="mic" size={30} color={theme.colors.onAccent} />
      </Pressable>
      <Text style={styles.hint}>Tap to start recording your answer.</Text>
    </Card>
  );
}

function Skill({ label, score, feedback }: { label: string; score: number; feedback?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.skillRow}>
        <Text style={styles.skillLabel}>{label}</Text>
        <Text style={styles.skillScore}>{score}/90</Text>
      </View>
      {feedback ? <Text style={styles.skillFeedback}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  prompt: { color: theme.colors.text, fontSize: theme.font.body, lineHeight: 23 },
  hint: { color: theme.colors.textMuted, fontSize: theme.font.small, textAlign: 'center' },
  instruction: { color: theme.colors.textMuted, fontSize: theme.font.small, textAlign: 'center' },
  error: { color: theme.colors.danger, fontSize: theme.font.small },
  imageWrap: { backgroundColor: '#fff', borderRadius: theme.radius.md, padding: 8 },
  timer: { color: theme.colors.text, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  recBtn: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  recBtnStop: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: theme.colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  playbackRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallBtnText: { color: theme.colors.accent, fontSize: theme.font.body, fontWeight: '600' },
  blockTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  transcript: { color: theme.colors.textMuted, fontSize: theme.font.body, lineHeight: 22, fontStyle: 'italic' },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skillLabel: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' },
  skillScore: { color: theme.colors.accent, fontSize: theme.font.body, fontWeight: '800' },
  skillFeedback: { color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 19 },
});
