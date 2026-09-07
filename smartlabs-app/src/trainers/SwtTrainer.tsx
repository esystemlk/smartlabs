import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreSwt } from '@/api/score';
import { ApiError } from '@/api/client';
import { Button, Card } from '@/ui/components';
import { ScoreHeader, ScoreBreakdown, Bullets, Answerbox } from '@/ui/trainer';
import { theme } from '@/theme';
import type { TrainerProps } from '@/trainers/types';

/** Summarize Written Text — read the passage, write a one-sentence summary. */
export function SwtTrainer({ question, onNext }: TrainerProps) {
  const router = useRouter();
  const passage = String(question.passage ?? question.text ?? '');

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const submit = async () => {
    setError(null);
    const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
    if (words < 5) return setError('Write a one-sentence summary first.');
    setLoading(true);
    try {
      setResult(await scoreSwt({ passage, summary: summary.trim() }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of SWT credits.');
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
        <ScoreHeader score={result.total} max={result.maxTotal ?? 9} label="Summarize Written Text" />
        {result.scores ? <ScoreBreakdown scores={result.scores} /> : null}
        {typeof result.summaryText === 'string' ? <Card><Text style={{ color: theme.colors.text, lineHeight: 22 }}>{result.summaryText}</Text></Card> : null}
        <Bullets title="How to improve" items={result.suggestedImprovements ?? []} />
        <Button label="Try another" onPress={() => { setResult(null); setSummary(''); onNext(); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card><Text style={{ color: theme.colors.text, lineHeight: 23 }}>{passage}</Text></Card>
      <Answerbox value={summary} onChangeText={setSummary} placeholder="Write a single-sentence summary…" wordTarget="5–75, one sentence" />
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <Button label="Score my summary" onPress={submit} loading={loading} />
    </View>
  );
}
