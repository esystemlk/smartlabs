import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreEssay } from '@/api/score';
import { ApiError } from '@/api/client';
import {
  BackLink, PromptPanel, Textarea, LiveChecks, PrimaryButton, DarkButton,
  ScoreHeaderPanel, CircularScore, Section, ResultCard, slate,
} from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

interface Criterion { name: string; score: number; max: number; color?: string; comment?: string }

/** Write Essay — 200–300 word argumentative essay, AI-scored. */
export function EssayTrainer({ question, accent, onBack }: TrainerProps) {
  const router = useRouter();
  const topic = String(question.topic ?? question.prompt ?? '');

  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const words = useMemo(() => (essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0), [essay]);

  const submit = async () => {
    setError(null);
    if (words < 120) return setError('Write a fuller essay (aim for 200–300 words).');
    setLoading(true);
    try {
      setResult(await scoreEssay({ topic, essay: essay.trim(), wordCount: words }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of essay credits.');
        router.push('/credits');
      } else setError(e instanceof Error ? e.message : 'Scoring failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const criteria: Criterion[] = Array.isArray(result.criteria) ? result.criteria : [];
    const band = result.overallBand ?? 0;
    return (
      <View style={{ gap: 20 }}>
        <ScoreHeaderPanel
          accent={accent}
          circular={<CircularScore label="Essay Band" value={band} max={90} pct={Math.round((band / 90) * 100)} accent={accent} />}
          title={result.summaryTitle ?? result.bandLabel}
          text={result.summaryText}
        />

        {criteria.length ? (
          <Section title="Scoring Criteria" accent={accent}>
            <View style={{ gap: 8 }}>
              {criteria.map((c) => (
                <ResultCard key={c.name}>
                  <View style={styles.critRow}>
                    <Text style={styles.critName}>{c.name}</Text>
                    <Text style={[styles.critScore, { color: c.color ?? accent }]}>{c.score}/{c.max}</Text>
                  </View>
                  {c.comment ? <Text style={styles.critComment}>{c.comment}</Text> : null}
                </ResultCard>
              ))}
            </View>
          </Section>
        ) : null}

        <DarkButton label="Practise Another Topic" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <BackLink label="All topics" onPress={onBack} accent={accent} />
      <PromptPanel label="Essay Topic" text={topic} accent={accent} />
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>YOUR ESSAY</Text>
        <Textarea value={essay} onChangeText={setEssay} placeholder="Write your essay…" minHeight={200} />
        <LiveChecks checks={[{ ok: words >= 200 && words <= 300, label: `${words} / 200–300 words` }]} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Score My Essay" onPress={submit} loading={loading} accent={accent} />
    </View>
  );
}

const styles = {
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5, color: slate[500] },
  error: { color: slate.red, fontSize: 13 },
  critRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  critName: { fontSize: 14, fontWeight: '700' as const, color: slate[800] },
  critScore: { fontSize: 15, fontWeight: '800' as const },
  critComment: { fontSize: 12, color: slate[500], lineHeight: 18, marginTop: 4 },
};
