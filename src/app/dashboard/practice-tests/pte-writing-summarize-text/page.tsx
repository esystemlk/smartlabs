'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { scorePteSummarizeWrittenText } from '@/ai/flows/score-pte-writing-summarize-text';
import type { PteSummarizeWrittenTextInput, PteSummarizeWrittenTextOutput } from '@/ai/flows/pte-writing.types';
import { pteSummarizeWrittenTextData } from '@/lib/pte-writing-summarize-written-text-data';
import { Progress } from '@/components/ui/progress';

export default function PteSummarizeWrittenTextPage() {
    const { toast } = useToast();
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [summary, setSummary] = useState('');
    const [result, setResult] = useState<PteSummarizeWrittenTextOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const currentTest = pteSummarizeWrittenTextData[currentTestIndex];

    const handleSubmit = async () => {
        const wordCount = summary.split(/\s+/).filter(Boolean).length;
        if (wordCount < 5 || wordCount > 75) {
            toast({ variant: 'destructive', title: 'Word Count Error', description: 'Your summary must be a single sentence between 5 and 75 words.' });
            return;
        }
        if (!summary.endsWith('.')) {
             toast({ variant: 'destructive', title: 'Form Error', description: 'Your summary must be a single sentence ending with a full stop.' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        const testInput: PteSummarizeWrittenTextInput = {
            passage: currentTest.passage,
            summary: summary,
        };

        try {
            const scoreResult = await scorePteSummarizeWrittenText(testInput);
            setResult(scoreResult);
        } catch (error) {
            console.error('Scoring failed:', error);
            toast({ variant: 'destructive', title: 'Scoring Failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = () => {
        setSummary('');
        setResult(null);
        setIsLoading(false);
        setCurrentTestIndex((prev) => (prev + 1) % pteSummarizeWrittenTextData.length);
    };

    const isTestTaken = result !== null;

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost">
                    <Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Practice Tests</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Writing: Summarize Written Text</CardTitle>
                        <CardDescription>Read the passage and write a one-sentence summary of 5-75 words. You have 10 minutes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 mb-8 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Reading Passage</h3>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{currentTest.passage}</p>
                        </div>
                        
                        <Textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Write your one-sentence summary here..."
                            className="min-h-24 text-base"
                            disabled={isTestTaken || isLoading}
                        />
                        <p className="text-sm text-muted-foreground mt-2">{summary.split(/\s+/).filter(Boolean).length} words</p>

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
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                            <ScoreDisplay title="Overall" score={result.overallScore} maxScore={7} />
                                            <ScoreDisplay title="Content" score={result.contentScore} maxScore={2} />
                                            <ScoreDisplay title="Form" score={result.formScore} maxScore={1} />
                                            <ScoreDisplay title="Grammar" score={result.grammarScore} maxScore={2} />
                                            <ScoreDisplay title="Vocabulary" score={result.vocabularyScore} maxScore={2} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Feedback:</p>
                                            <p className="text-muted-foreground mt-1">{result.feedback}</p>
                                        </div>
                                        <Button onClick={handleNext} className="w-full" size="lg" variant="outline">
                                            <RefreshCw className="mr-2 h-4 w-4" /> Next Passage
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
