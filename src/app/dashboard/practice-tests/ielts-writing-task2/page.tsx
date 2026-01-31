'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { scoreIeltsWritingTask2 } from '@/ai/flows/score-ielts-writing-task2';
import type { IeltsWritingTask2Input, IeltsWritingTask2Output } from '@/ai/flows/ielts-writing.types';
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const essayTopic = "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?";

export default function IeltsWritingTask2Page() {
  const [essay, setEssay] = useState('');
  const [result, setResult] = useState<IeltsWritingTask2Output | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (essay.split(' ').filter(n => n != '').length < 100) {
        alert('Please write at least 100 words.');
        return;
    }
    setIsLoading(true);
    setResult(null);

    const testInput: IeltsWritingTask2Input = {
      topic: essayTopic,
      essay: essay,
    };

    try {
      const scoreResult = await scoreIeltsWritingTask2(testInput);
      setResult(scoreResult);
    } catch (error) {
      console.error('Scoring failed:', error);
      // Handle error display to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setEssay('');
    setResult(null);
    setIsLoading(false);
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
            <CardTitle className="text-3xl font-headline">IELTS Writing Task 2: Essay</CardTitle>
            <CardDescription>You should spend about 40 minutes on this task. Write at least 250 words.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 mb-8 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Essay Topic</h3>
              <p className="text-muted-foreground leading-relaxed">{essayTopic}</p>
            </div>

            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Start writing your essay here..."
              className="min-h-96 text-base"
              disabled={isTestTaken || isLoading}
            />
            <p className="text-sm text-muted-foreground mt-2">{essay.split(' ').filter(n => n != '').length} words</p>

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
                    <div className="text-center">
                      <p className="text-muted-foreground">Overall Band Score</p>
                      <p className="text-6xl font-bold text-primary">{result.overallBandScore}</p>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <FeedbackItem title="Task Response" score={result.feedback.taskResponse.score} feedback={result.feedback.taskResponse.feedback} />
                        <FeedbackItem title="Coherence and Cohesion" score={result.feedback.coherenceAndCohesion.score} feedback={result.feedback.coherenceAndCohesion.feedback} />
                        <FeedbackItem title="Lexical Resource" score={result.feedback.lexicalResource.score} feedback={result.feedback.lexicalResource.feedback} />
                        <FeedbackItem title="Grammatical Range and Accuracy" score={result.feedback.grammaticalRangeAndAccuracy.score} feedback={result.feedback.grammaticalRangeAndAccuracy.feedback} />
                    </div>
                     <Separator />
                     <div>
                        <p className="font-semibold text-lg">General Feedback:</p>
                        <p className="text-muted-foreground mt-1">{result.generalFeedback}</p>
                    </div>
                    <Button onClick={handleRetry} className="w-full" size="lg" variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" /> Write a New Essay
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

function FeedbackItem({ title, score, feedback }: { title: string; score: number; feedback: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="font-semibold">{title}</p>
                <p className="font-bold text-lg text-primary">{score.toFixed(1)}</p>
            </div>
             <Progress value={(score / 9) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{feedback}</p>
        </div>
    )
}
