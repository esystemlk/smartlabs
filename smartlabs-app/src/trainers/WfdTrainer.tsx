import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { scoreWfd, performanceSummary, type WfdResult } from '@/scoring/wfd';
import { useAuth } from '@/auth/AuthContext';
import { bumpSession } from '@/lib/progress';
import {
  BackLink, Textarea, PrimaryButton, DarkButton, AudioPlayButton,
  ScoreHeaderPanel, CircularScore, Section, ResultCard, WordChips, slate,
} from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

/** Write from Dictation — listen, type it exactly. Deterministic local scoring. */
export function WfdTrainer({ question, accent, onBack }: TrainerProps) {
  const { user } = useAuth();
  const sentence = String(question.text ?? '');
  const title = typeof question.title === 'string' ? question.title : 'Dictation';

  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<WfdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!answer.trim()) return setError('Type what you heard first.');
    setResult(scoreWfd(sentence, answer.trim()));
    bumpSession(user?.uid);
  };

  if (result) {
    return (
      <View style={{ gap: 20 }}>
        <ScoreHeaderPanel
          accent={accent}
          circular={<CircularScore label="WFD Score" value={result.pteScore} max={90} pct={Math.round(result.accuracy)} accent={accent} />}
          title={`${result.correctWords} / ${result.totalWords} words correct`}
          text={performanceSummary(result)}
        />

        <Section title="Word-by-Word" accent={accent}>
          <ResultCard><WordChips analysis={result.analysis} /></ResultCard>
        </Section>

        <Section title="Correct Sentence" accent={accent}>
          <ResultCard><Text style={styles.body}>{sentence}</Text></ResultCard>
        </Section>

        <DarkButton label="Practise Another Sentence" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <BackLink label="All sentences" onPress={onBack} accent={accent} />
      <View style={styles.listenCard}>
        <Text style={[styles.listenLabel, { color: accent }]}>{title.toUpperCase()}</Text>
        <Text style={styles.hint}>Play the sentence and type it exactly — spelling and word order both count.</Text>
        <AudioPlayButton text={sentence} label="Play sentence" accent={accent} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>TYPE WHAT YOU HEAR</Text>
        <Textarea value={answer} onChangeText={setAnswer} placeholder="Type the sentence…" minHeight={90} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Check My Answer" onPress={submit} accent={accent} icon="checkmark" />
    </View>
  );
}

const styles = {
  listenCard: { backgroundColor: slate[50], borderRadius: 22, borderWidth: 1, borderColor: slate[200], padding: 18, gap: 10 },
  listenLabel: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5 },
  hint: { fontSize: 13, color: slate[500], lineHeight: 19 },
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5, color: slate[500] },
  body: { fontSize: 14, lineHeight: 21, color: slate[700] },
  error: { color: slate.red, fontSize: 13 },
};
