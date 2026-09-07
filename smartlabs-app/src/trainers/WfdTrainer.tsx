import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { scoreWfd, performanceSummary, type WfdResult } from '@/scoring/wfd';
import { Button, Card } from '@/ui/components';
import { AudioButton, ScoreHeader, WordChips, Answerbox } from '@/ui/trainer';
import { theme } from '@/theme';
import type { TrainerProps } from '@/trainers/types';

/**
 * Write from Dictation — listen (TTS of the sentence), type it exactly. Scored
 * locally with the ported deterministic engine (no AI, no credits).
 */
export function WfdTrainer({ question, onNext }: TrainerProps) {
  const sentence = String(question.text ?? '');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<WfdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!answer.trim()) return setError('Type what you heard first.');
    setResult(scoreWfd(sentence, answer.trim()));
  };

  if (result) {
    return (
      <View style={{ gap: 16 }}>
        <ScoreHeader score={result.pteScore} max={90} label={`Write from Dictation · ${result.accuracy}% accuracy`} />
        <Card><Text style={{ color: theme.colors.textMuted, lineHeight: 22 }}>{performanceSummary(result)}</Text></Card>
        <WordChips analysis={result.analysis} />
        <Card style={{ gap: 6 }}>
          <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>Correct sentence</Text>
          <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{sentence}</Text>
        </Card>
        <Button label="Next sentence" onPress={() => { setResult(null); setAnswer(''); onNext(); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 8 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small }}>
          Play the sentence and type it exactly as you hear it — spelling and word order both count.
        </Text>
        <AudioButton text={sentence} label="Play sentence" />
      </Card>
      <Answerbox value={answer} onChangeText={setAnswer} placeholder="Type the sentence…" />
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <Button label="Check my answer" onPress={submit} />
    </View>
  );
}
