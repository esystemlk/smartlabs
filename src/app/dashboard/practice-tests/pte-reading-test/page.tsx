
'use client';

import { useState } from 'react';
import { pteReadingTestData } from '@/lib/pte-reading-test-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { scorePteReadingTest } from '@/ai/flows/score-pte-reading';
import type { PteReadingTestInput, PteReadingTestOutput } from '@/ai/flows/pte-reading.types';
import { ArrowLeft, CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type UserAnswers = { [key: string]: string };

export default function PteReadingTestPage() {
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [result, setResult] = useState<PteReadingTestOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResult(null);

    const testInput: PteReadingTestInput = {
      questions: pteReadingTestData.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        userAnswer: userAnswers[q.id] || 'Not Answered',
        correctAnswer: q.correctAnswer,
      })),
    };

    try {
      const scoreResult = await scorePteReadingTest(testInput);
      setResult(scoreResult);
    } catch (error) {
      console.error('Scoring failed:', error);
      // Handle error display to the user
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
      setUserAnswers({});
      setResult(null);
      setIsLoading(false);
  }

  const isTestTaken = result !== null;

  return (
    <div className="w-full">
        <div className="mx-auto max-w-4xl space-y-4">
             <Button asChild variant="ghost">
                <Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Practice Tests</Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">PTE Reading: Multiple-Choice, Single Answer</CardTitle>
                    <CardDescription>Read the passage and answer the questions that follow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-6 mb-8 bg-muted/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Reading Passage</h3>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{pteReadingTestData.passage}</p>
                    </div>

                    <div className="space-y-8">
                        {pteReadingTestData.questions.map((q, index) => (
                        <div key={q.id}>
                            <p className="font-semibold mb-4">
                            Question {index + 1}: {q.questionText}
                            </p>
                            <RadioGroup
                            value={userAnswers[q.id]}
                            onValueChange={(value) => handleAnswerChange(q.id, value)}
                            disabled={isTestTaken || isLoading}
                            >
                            {q.options.map((option) => {
                                const isCorrect = isTestTaken && result?.results.find(r => r.id === q.id)?.correctAnswer === option;
                                const isUserChoice = isTestTaken && userAnswers[q.id] === option;
                                const isIncorrectChoice = isUserChoice && !isCorrect;

                                return (
                                <div key={option} className={cn(
                                    "flex items-center space-x-2 p-3 rounded-md border transition-all",
                                    isTestTaken && isCorrect && "border-green-500 bg-green-500/10",
                                    isTestTaken && isIncorrectChoice && "border-red-500 bg-red-500/10",
                                )}>
                                    <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                                    <Label htmlFor={`${q.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                                    {isTestTaken && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                    {isTestTaken && isIncorrectChoice && <XCircle className="h-5 w-5 text-red-600" />}
                                </div>
                                );
                            })}
                            </RadioGroup>
                            {isTestTaken && result?.results.find(r => r.id === q.id)?.feedback && (
                                <div className="mt-3 text-sm p-3 rounded-md bg-secondary">
                                    <p><span className="font-bold">Feedback:</span> {result.results.find(r => r.id === q.id)?.feedback}</p>
                                </div>
                            )}
                        </div>
                        ))}
                    </div>

                    {!isTestTaken ? (
                        <Button onClick={handleSubmit} disabled={isLoading} className="mt-8 w-full" size="lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Scoring...' : 'Submit Answers'}
                        </Button>
                    ) : (
                         <div className="mt-10">
                            <Card className="bg-secondary">
                                <CardHeader>
                                    <CardTitle>Your Result</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-muted-foreground">Overall Score</p>
                                        <p className="text-6xl font-bold text-primary">{result.overallScore}%</p>
                                        <Progress value={result.overallScore} className="mt-2" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">General Feedback:</p>
                                        <p className="text-muted-foreground">{result.generalFeedback}</p>
                                    </div>
                                    <Button onClick={handleRetry} className="w-full" size="lg" variant="outline">
                                        <RefreshCw className="mr-2 h-4 w-4" /> Retry Test
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
