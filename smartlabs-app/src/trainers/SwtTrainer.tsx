import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreSwt } from '@/api/score';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { bumpSession } from '@/lib/progress';
import {
  BackLink, PromptPanel, Textarea, LiveChecks, PrimaryButton, DarkButton,
  ScoreHeaderPanel, CircularScore, ScorePill, Section, ResultCard, Bullets,
  CorrectionRow, ModelAnswer, slate,
} from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

/** Summarize Written Text — read the passage, write a one-sentence summary. */
export function SwtTrainer({ question, accent, onBack }: TrainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const passage = String(question.passage ?? question.text ?? '');
  const title = typeof question.title === 'string' ? question.title : 'Passage';

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const form = useMemo(() => {
    const t = summary.trim();
    const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    const singleSentence = !/[.!?]+\s+\S/.test(t);
    const wordsOk = words >= 5 && words <= 75;
    return { words, singleSentence, wordsOk };
  }, [summary]);

  const submit = async () => {
    setError(null);
    if (!summary.trim()) return setError('Write a one-sentence summary first.');
    setLoading(true);
    try {
      setResult(await scoreSwt({ passage, summary: summary.trim() }));
      bumpSession(user?.uid);
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of SWT credits.');
        router.push('/credits');
      } else setError(e instanceof Error ? e.message : 'Scoring failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const s = result.scores ?? {};
    const pct = result.maxTotal ? Math.round((result.total / result.maxTotal) * 100) : 0;
    return (
      <View style={{ gap: 20 }}>
        <ScoreHeaderPanel
          accent={accent}
          circular={<CircularScore label="SWT Score" value={result.total} max={result.maxTotal ?? 9} pct={pct} accent={accent} />}
          title={result.summaryTitle}
          text={result.summaryText}
          pills={
            <>
              <ScorePill label="Content" value={s.content ?? 0} max={4} accent={accent} />
              <ScorePill label="Form" value={s.form ?? 0} max={1} accent={accent} />
              <ScorePill label="Grammar" value={s.grammar ?? 0} max={2} accent={accent} />
              <ScorePill label="Vocab" value={s.vocabulary ?? 0} max={2} accent={accent} />
            </>
          }
        />

        {result.mainTopic ? (
          <Section title="Main Topic" accent={accent}>
            <ResultCard><Text style={styles.body}>{result.mainTopic}</Text></ResultCard>
          </Section>
        ) : null}

        {result.strengths?.length ? (
          <Section title="Strengths" accent={accent}>
            <ResultCard><Bullets items={result.strengths} tone="green" symbol="+" /></ResultCard>
          </Section>
        ) : null}

        {result.missingIdeas?.length ? (
          <Section title="Missing Important Ideas" accent={accent}>
            <ResultCard><Bullets items={result.missingIdeas} tone="red" symbol="–" /></ResultCard>
          </Section>
        ) : null}

        {result.suggestedImprovements?.length ? (
          <Section title="How to Improve" accent={accent}>
            <ResultCard><Bullets items={result.suggestedImprovements} tone="accent" symbol="→" /></ResultCard>
          </Section>
        ) : null}

        {result.grammarCorrections?.length ? (
          <Section title="Grammar Corrections" accent={accent}>
            <View style={{ gap: 8 }}>
              {result.grammarCorrections.map((g: any, i: number) => (
                <CorrectionRow key={i} error={g.error} correction={g.correction} note={g.rule} />
              ))}
            </View>
          </Section>
        ) : null}

        {result.modelAnswer ? (
          <Section title="Model Full-Score Summary" accent={accent}>
            <ModelAnswer text={result.modelAnswer} why={result.modelAnswerWhy} />
          </Section>
        ) : null}

        <DarkButton label="Practise Another Passage" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <BackLink label="All passages" onPress={onBack} accent={accent} />
      <PromptPanel label={title} text={passage} accent={accent} />
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>YOUR ONE-SENTENCE SUMMARY</Text>
        <Textarea value={summary} onChangeText={setSummary} placeholder="Write a single, complete sentence summarising the passage…" />
        <LiveChecks
          checks={[
            { ok: form.wordsOk, label: `${form.words} / 5–75 words` },
            { ok: form.singleSentence, label: 'One sentence', bad: !form.singleSentence },
          ]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Score My Summary" onPress={submit} loading={loading} accent={accent} />
    </View>
  );
}

const styles = {
  body: { fontSize: 14, lineHeight: 21, color: slate[700] },
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5, color: slate[500] },
  error: { color: slate.red, fontSize: 13 },
};
