'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { scorePteWriteEssay } from '@/ai/flows/score-pte-writing-write-essay';
import type { PteWriteEssayInput, PteWriteEssayOutput } from '@/ai/flows/pte-writing.types';
import { pteWriteEssayData } from '@/lib/pte-writing-write-essay-data';
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function PteWriteEssayPage() {
  const { toast } = useToast();
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [essay, setEssay] = useState('');
  const [result, setResult] = useState<PteWriteEssayOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentTopic = pteWriteEssayData[currentTopicIndex];

  const handleSubmit = async () => {
    const wordCount = essay.split(/\s+/).filter(Boolean).length;
    if (wordCount < 150) {
        toast({ variant: 'destructive', title: 'Word Count Too Low', description: 'Please write at least 200 words.'});
        return;
    }
    setIsLoading(true);
    setResult(null);

    const testInput: PteWriteEssayInput = {
      topic: currentTopic.topic,
      essay: essay,
    };

    try {
      const scoreResult = await scorePteWriteEssay(testInput);
      setResult(scoreResult);
    } catch (error) {
      console.error('Scoring failed:', error);
      toast({ variant: 'destructive', title: 'Scoring Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setEssay('');
    setResult(null);
    setIsLoading(false);
    setCurrentTopicIndex((prev) => (prev + 1) % pteWriteEssayData.length);
  };

  const isTestTaken = result !== null;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl space-y-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/practice-tests">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Practice Tests
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">PTE Writing: Write Essay</CardTitle>
            <CardDescription>You have 20 minutes to write a 200-300 word essay on the topic below.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 mb-8 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Essay Topic</h3>
              <p className="text-muted-foreground leading-relaxed">{currentTopic.topic}</p>
            </div>

            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Start writing your essay here..."
              className="min-h-96 text-base"
              disabled={isTestTaken || isLoading}
            />
            <p className="text-sm text-muted-foreground mt-2">{essay.split(/\s+/).filter(Boolean).length} words</p>

            {!isTestTaken ? (
              <Button onClick={handleSubmit} disabled={isLoading} className="mt-8 w-full" size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isLoading ? 'Getting Feedback...' : 'Get AI Score & Feedback'}
              </Button>
            ) : (
              <div className="mt-10">
                <Card className="bg-secondary">
                  <CardHeader>
                    <CardTitle>Your AI-Generated Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <ScoreDisplay title="Overall" score={result.overallScore} maxScore={13} />
                        <ScoreDisplay title="Content" score={result.contentScore} maxScore={3} />
                        <ScoreDisplay title="Form" score={result.formScore} maxScore={2} />
                        <ScoreDisplay title="Structure" score={result.structureScore} maxScore={2} />
                        <ScoreDisplay title="Grammar" score={result.grammarScore} maxScore={2} />
                        <ScoreDisplay title="Vocabulary" score={result.vocabularyScore} maxScore={2} />
                        <ScoreDisplay title="Spelling" score={result.spellingScore} maxScore={2} />
                    </div>
                     <div>
                        <p className="font-semibold text-lg">Feedback:</p>
                        <p className="text-muted-foreground mt-1 whitespace-pre-line">{result.feedback}</p>
                    </div>
                    <Button onClick={handleNext} className="w-full" size="lg" variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" /> Try Another Topic
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreDisplay({ title, score, maxScore }: { title: string; score: number, maxScore: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-primary">{score}</p>
            <Progress value={(score / maxScore) * 100} className="h-1.5 mt-2 w-full" />
        </div>
    )
}
