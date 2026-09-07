import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreSst } from '@/api/score';
import { ApiError } from '@/api/client';
import { Button, Card } from '@/ui/components';
import { AudioButton, ScoreHeader, ScoreBreakdown, Bullets, Answerbox } from '@/ui/trainer';
import { theme } from '@/theme';
import type { TrainerProps } from '@/trainers/types';

/** Summarize Spoken Text — listen (TTS of transcript), write a 50–70 word summary. */
export function SstTrainer({ question, onNext }: TrainerProps) {
  const router = useRouter();
  const transcript = String(question.transcript ?? '');
  const audioUrl = typeof question.audioUrl === 'string' ? question.audioUrl : undefined;

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const submit = async () => {
    setError(null);
    const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
    if (words < 40) return setError('Write a summary of about 50–70 words.');
    setLoading(true);
    try {
      setResult(await scoreSst({ transcript, summary: summary.trim() }));
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NO_CREDITS') {
        setError('You are out of SST credits.');
        router.push('/credits');
      } else {
        setError(e instanceof Error ? e.message : 'Scoring failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View style={{ gap: 16 }}>
        <ScoreHeader score={result.total} max={result.maxTotal ?? 12} label={`Summarize Spoken Text · Band ${result.band ?? '—'}`} />
        {result.scores ? <ScoreBreakdown scores={result.scores} /> : null}
        {typeof result.summaryText === 'string' ? <Card><Text style={{ color: theme.colors.text, lineHeight: 22 }}>{result.summaryText}</Text></Card> : null}
        <Bullets title="How to improve" items={result.suggestedImprovements ?? []} />
        {typeof result.modelAnswer === 'string' ? (
          <Card style={{ gap: 6 }}>
            <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>Model answer</Text>
            <Text style={{ color: theme.colors.textMuted, lineHeight: 22 }}>{result.modelAnswer}</Text>
          </Card>
        ) : null}
        <Button label="Next lecture" onPress={() => { setResult(null); setSummary(''); onNext(); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 8 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small }}>
          Listen to the ~90s lecture, then summarize it in 50–70 words. The transcript is hidden — play the audio.
        </Text>
        <AudioButton audioUrl={audioUrl} text={transcript} label="Play lecture" />
      </Card>
      <Answerbox value={summary} onChangeText={setSummary} placeholder="The lecture mainly discusses…" wordTarget="aim 50–70" />
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <Button label="Score my summary" onPress={submit} loading={loading} />
    </View>
  );
}
