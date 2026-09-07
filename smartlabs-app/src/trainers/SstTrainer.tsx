import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { scoreSst } from '@/api/score';
import { ApiError } from '@/api/client';
import {
  BackLink, Textarea, LiveChecks, PrimaryButton, DarkButton, AudioPlayButton,
  ScoreHeaderPanel, CircularScore, ScorePill, Section, ResultCard, Bullets, ModelAnswer, slate,
} from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

/** Summarize Spoken Text — listen, then write a 50–70 word summary. */
export function SstTrainer({ question, accent, onBack }: TrainerProps) {
  const router = useRouter();
  const transcript = String(question.transcript ?? '');
  const audioUrl = typeof question.audioUrl === 'string' ? question.audioUrl : undefined;
  const title = typeof question.title === 'string' ? question.title : 'Lecture';

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const words = useMemo(() => (summary.trim() ? summary.trim().split(/\s+/).filter(Boolean).length : 0), [summary]);

  const submit = async () => {
    setError(null);
    if (words < 40) return setError('Write a summary of about 50–70 words.');
    setLoading(true);
    try {
      setResult(await scoreSst({ transcript, summary: summary.trim() }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'NO_CREDITS' || e.status === 402)) {
        setError('You are out of SST credits.');
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
          circular={<CircularScore label="SST Score" value={result.total} max={result.maxTotal ?? 12} pct={pct} accent={accent} />}
          title={result.summaryTitle ?? (result.band ? `Band ${result.band}` : undefined)}
          text={result.summaryText}
          pills={
            <>
              <ScorePill label="Content" value={s.content ?? 0} max={4} accent={accent} />
              <ScorePill label="Form" value={s.form ?? 0} max={2} accent={accent} />
              <ScorePill label="Grammar" value={s.grammar ?? 0} max={2} accent={accent} />
              <ScorePill label="Vocab" value={s.vocabulary ?? 0} max={2} accent={accent} />
              <ScorePill label="Spelling" value={s.spelling ?? 0} max={2} accent={accent} />
            </>
          }
        />

        {result.keyIdeasCovered?.length ? (
          <Section title="Key Ideas Covered" accent={accent}>
            <ResultCard><Bullets items={result.keyIdeasCovered} tone="green" symbol="✦" /></ResultCard>
          </Section>
        ) : null}

        {result.missingKeyIdeas?.length ? (
          <Section title="Missing Key Ideas" accent={accent}>
            <ResultCard><Bullets items={result.missingKeyIdeas} tone="red" symbol="–" /></ResultCard>
          </Section>
        ) : null}

        {result.suggestedImprovements?.length ? (
          <Section title="How to Improve" accent={accent}>
            <ResultCard><Bullets items={result.suggestedImprovements} tone="accent" symbol="→" /></ResultCard>
          </Section>
        ) : null}

        {result.modelAnswer ? (
          <Section title="Model Full-Score Summary" accent={accent}>
            <ModelAnswer text={result.modelAnswer} why={result.modelAnswerWhy} />
          </Section>
        ) : null}

        <DarkButton label="Practise Another Lecture" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <BackLink label="All lectures" onPress={onBack} accent={accent} />
      <View style={styles.listenCard}>
        <Text style={[styles.listenLabel, { color: accent }]}>{title.toUpperCase()}</Text>
        <Text style={styles.hint}>Listen to the lecture, then summarize it in 50–70 words. The transcript is hidden.</Text>
        <AudioPlayButton audioUrl={audioUrl} text={transcript} label="Play lecture" accent={accent} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>YOUR SUMMARY (50–70 WORDS)</Text>
        <Textarea value={summary} onChangeText={setSummary} placeholder="The lecture mainly discusses…" />
        <LiveChecks checks={[{ ok: words >= 50 && words <= 70, label: `${words} / 50–70 words` }]} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Score My Summary" onPress={submit} loading={loading} accent={accent} />
    </View>
  );
}

const styles = {
  listenCard: { backgroundColor: slate[50], borderRadius: 22, borderWidth: 1, borderColor: slate[200], padding: 18, gap: 10 },
  listenLabel: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5 },
  hint: { fontSize: 13, color: slate[500], lineHeight: 19 },
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5, color: slate[500] },
  error: { color: slate.red, fontSize: 13 },
};
