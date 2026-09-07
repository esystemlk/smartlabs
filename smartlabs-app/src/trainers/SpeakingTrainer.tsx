import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Audio } from 'expo-av';
import { scoreSpeaking, type SpeakingScore } from '@/api/score';
import { ApiError } from '@/api/client';
import { SpeechRecorder } from '@/audio/recorder';
import { useAuth } from '@/auth/AuthContext';
import { bumpSession } from '@/lib/progress';
import {
  BackLink, AudioPlayButton, PrimaryButton, DarkButton,
  ScoreHeaderPanel, CircularScore, ScorePill, Section, ResultCard, Bullets, slate,
} from '@/ui/web';
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

export function SpeakingTrainer({ task, question, accent, onBack }: TrainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const meta = META[task.taskType] ?? { promptKey: 'text', present: 'text' as Present, instruction: 'Speak your answer.' };
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
    if (!(await SpeechRecorder.requestPermission())) {
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
      bumpSession(user?.uid);
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of speaking credits.');
        router.push('/credits');
      } else setError(e instanceof Error ? e.message : 'Scoring failed.');
      setPhase('recorded');
    }
  };

  if (result) {
    return (
      <View style={{ gap: 20 }}>
        <ScoreHeaderPanel
          accent={accent}
          circular={<CircularScore label="Overall" value={result.overall} max={90} pct={Math.round((result.overall / 90) * 100)} accent={accent} />}
          title={task.label}
          pills={
            <>
              <ScorePill label="Content" value={result.content} max={90} accent={accent} />
              <ScorePill label="Fluency" value={result.fluency} max={90} accent={accent} />
              <ScorePill label="Pronun." value={result.pronunciation} max={90} accent={accent} />
            </>
          }
        />
        {result.contentFeedback ? (
          <Section title="Content" accent={accent}><ResultCard><Text style={styles.body}>{result.contentFeedback}</Text></ResultCard></Section>
        ) : null}
        {result.fluencyFeedback ? (
          <Section title="Oral Fluency" accent={accent}><ResultCard><Text style={styles.body}>{result.fluencyFeedback}</Text></ResultCard></Section>
        ) : null}
        {result.pronunciationFeedback ? (
          <Section title="Pronunciation" accent={accent}><ResultCard><Text style={styles.body}>{result.pronunciationFeedback}</Text></ResultCard></Section>
        ) : null}
        {result.transcript ? (
          <Section title="What We Heard" accent={accent}><ResultCard><Text style={styles.transcript}>{result.transcript}</Text></ResultCard></Section>
        ) : null}
        {result.tips?.length ? (
          <Section title="Tips" accent={accent}><ResultCard><Bullets items={result.tips} tone="accent" symbol="→" /></ResultCard></Section>
        ) : null}
        <DarkButton label="Practise Another" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <BackLink label="All items" onPress={onBack} accent={accent} />

      {meta.present === 'text' ? (
        <View style={styles.promptPanel}>
          {title ? <Text style={[styles.panelLabel, { color: accent }]}>{title.toUpperCase()}</Text> : null}
          <Text style={styles.promptText}>{promptText}</Text>
        </View>
      ) : meta.present === 'image' ? (
        <View style={styles.promptPanel}>
          {title ? <Text style={[styles.panelLabel, { color: accent }]}>{title.toUpperCase()}</Text> : null}
          {svg && SvgXml ? (
            <View style={styles.imageWrap}><SvgXml xml={svg} width="100%" height={220} /></View>
          ) : (
            <Text style={styles.promptText}>{promptText}</Text>
          )}
        </View>
      ) : (
        <View style={styles.promptPanel}>
          <Text style={styles.hint}>Listen to the prompt — the text is hidden, just like the real exam.</Text>
          <AudioPlayButton text={promptText} label="Play prompt" accent={accent} />
        </View>
      )}

      <Text style={styles.instruction}>{meta.instruction}</Text>

      <RecorderControl
        phase={phase}
        seconds={seconds}
        accent={accent}
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
  phase, seconds, accent, onStart, onStop, onPlay, onSubmit, onRedo,
}: {
  phase: 'idle' | 'recording' | 'recorded' | 'scoring';
  seconds: number;
  accent: string;
  onStart: () => void; onStop: () => void; onPlay: () => void; onSubmit: () => void; onRedo: () => void;
}) {
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (phase === 'recording') {
    return (
      <View style={styles.recWrap}>
        <Text style={styles.timer}>{mmss}</Text>
        <Pressable onPress={onStop} style={styles.recStop}><Ionicons name="stop" size={28} color="#fff" /></Pressable>
        <Text style={styles.hint}>Recording… tap to stop.</Text>
      </View>
    );
  }
  if (phase === 'recorded') {
    return (
      <View style={styles.recWrap}>
        <View style={styles.playbackRow}>
          <Pressable onPress={onPlay} style={styles.smallBtn}><Ionicons name="play" size={18} color={accent} /><Text style={[styles.smallBtnText, { color: accent }]}>Play back</Text></Pressable>
          <Pressable onPress={onRedo} style={styles.smallBtn}><Ionicons name="refresh" size={18} color={slate[500]} /><Text style={[styles.smallBtnText, { color: slate[500] }]}>Re-record</Text></Pressable>
        </View>
        <PrimaryButton label="Score My Answer" onPress={onSubmit} accent={accent} />
      </View>
    );
  }
  if (phase === 'scoring') {
    return (
      <View style={styles.recWrap}>
        <ActivityIndicator color={accent} size="large" />
        <Text style={styles.hint}>Scoring your recording…</Text>
      </View>
    );
  }
  return (
    <View style={styles.recWrap}>
      <Pressable onPress={onStart} style={[styles.recMic, { backgroundColor: accent }]}><Ionicons name="mic" size={30} color="#fff" /></Pressable>
      <Text style={styles.hint}>Tap to start recording your answer.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  promptPanel: { backgroundColor: slate[50], borderRadius: 22, borderWidth: 1, borderColor: slate[200], padding: 18, gap: 10 },
  panelLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  promptText: { fontSize: 15, lineHeight: 23, color: slate[700] },
  imageWrap: { backgroundColor: '#fff', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: slate[200] },
  instruction: { fontSize: 13, color: slate[500], textAlign: 'center' },
  hint: { fontSize: 13, color: slate[500], textAlign: 'center', lineHeight: 19 },
  error: { color: slate.red, fontSize: 13 },
  recWrap: { alignItems: 'center', gap: 14, backgroundColor: slate.white, borderRadius: 22, borderWidth: 1, borderColor: slate[200], padding: 20 },
  timer: { fontSize: 34, fontWeight: '800', color: slate[900], fontVariant: ['tabular-nums'] },
  recMic: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  recStop: { width: 76, height: 76, borderRadius: 38, backgroundColor: slate.red, alignItems: 'center', justifyContent: 'center' },
  playbackRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallBtnText: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 21, color: slate[700] },
  transcript: { fontSize: 14, color: slate[600], lineHeight: 22, fontStyle: 'italic' },
});
