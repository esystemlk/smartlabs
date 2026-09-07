import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreEssay } from '@/api/score';
import { ApiError } from '@/api/client';
import { Button, Card } from '@/ui/components';
import { ScoreHeader, Answerbox } from '@/ui/trainer';
import { theme } from '@/theme';
import type { TrainerProps } from '@/trainers/types';

interface Criterion { name: string; score: number; max: number; color?: string; comment?: string }

/** Write Essay — 200–300 word argumentative essay, AI-scored (essay credit pool). */
export function EssayTrainer({ question, onNext }: TrainerProps) {
  const router = useRouter();
  const topic = String(question.topic ?? question.prompt ?? '');

  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const submit = async () => {
    setError(null);
    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    if (wordCount < 120) return setError('Write a fuller essay (aim for 200–300 words).');
    setLoading(true);
    try {
      setResult(await scoreEssay({ topic, essay: essay.trim(), wordCount }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of essay credits.');
        router.push('/credits');
      } else {
        setError(e instanceof Error ? e.message : 'Scoring failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const criteria: Criterion[] = Array.isArray(result.criteria) ? result.criteria : [];
    return (
      <View style={{ gap: 16 }}>
        <ScoreHeader score={result.overallBand ?? '—'} max={90} label={`Write Essay${result.bandLabel ? ` · ${result.bandLabel}` : ''}`} />
        {typeof result.summaryText === 'string' ? (
          <Card><Text style={{ color: theme.colors.text, lineHeight: 22 }}>{result.summaryText}</Text></Card>
        ) : null}
        {criteria.length ? (
          <Card style={{ gap: 12 }}>
            {criteria.map((c) => (
              <View key={c.name} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{c.name}</Text>
                  <Text style={{ color: c.color ?? theme.colors.accent, fontWeight: '800' }}>{c.score}/{c.max}</Text>
                </View>
                {c.comment ? <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 19 }}>{c.comment}</Text> : null}
              </View>
            ))}
          </Card>
        ) : null}
        <Button label="Next topic" onPress={() => { setResult(null); setEssay(''); onNext(); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card><Text style={{ color: theme.colors.text, lineHeight: 23 }}>{topic}</Text></Card>
      <Answerbox value={essay} onChangeText={setEssay} placeholder="Write your essay…" wordTarget="aim 200–300" />
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <Button label="Score my essay" onPress={submit} loading={loading} />
    </View>
  );
}
