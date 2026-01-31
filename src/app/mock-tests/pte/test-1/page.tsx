
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteLongReadingTestData, PteQuestion, FillInTheBlanksRW, ReorderParagraphs, FillInTheBlanksReading } from '@/lib/pte-long-reading-test-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Helper to shuffle an array
const shuffle = (array: any[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export default function PteMockTest1Page() {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [totalPossibleScore, setTotalPossibleScore] = useState(0);

    useEffect(() => {
        let total = 0;
        pteLongReadingTestData.questions.forEach(q => {
            if (q.type === 'fill-in-the-blanks-rw') {
                total += q.blanks.length;
            } else if (q.type === 'fill-in-the-blanks-r') {
                 total += q.correctWords.length;
            } else if (q.type === 're-order-paragraphs') {
                total += q.paragraphs.length - 1;
            }
        });
        setTotalPossibleScore(total);
    }, []);

    const handleAnswerChange = useCallback((questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    }, []);

    const handleSubmit = () => {
        let currentScore = 0;
        pteLongReadingTestData.questions.forEach(q => {
            const userAnswer = answers[q.id];
            if (!userAnswer) return;

            if (q.type === 'fill-in-the-blanks-rw') {
                q.blanks.forEach((blank, index) => {
                    if (userAnswer[`blank-${index}`] === blank.correctAnswer) {
                        currentScore++;
                    }
                });
            } else if (q.type === 're-order-paragraphs') {
                const correctOrder = q.correctOrder;
                for (let i = 0; i < userAnswer.length - 1; i++) {
                    const currentItem = userAnswer[i];
                    const nextItem = userAnswer[i+1];
                    const currentItemIndexInCorrect = correctOrder.indexOf(currentItem);
                    if (currentItemIndexInCorrect !== -1 && currentItemIndexInCorrect < correctOrder.length - 1) {
                        if (correctOrder[currentItemIndexInCorrect + 1] === nextItem) {
                            currentScore++;
                        }
                    }
                }
            } else if (q.type === 'fill-in-the-blanks-r') {
                q.correctWords.forEach((correctWord, index) => {
                    if (userAnswer[index] === correctWord) {
                        currentScore++;
                    }
                });
            }
        });
        setScore(currentScore);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleRetry = () => {
        setAnswers({});
        setIsSubmitted(false);
        setScore(0);
    };

    return (
        <div className="w-full">
            <section className="py-12 md:py-20">
                <div className="container mx-auto max-w-4xl space-y-8">
                    <Button asChild variant="ghost" className="-ml-4">
                        <Link href="/mock-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Mock Tests</Link>
                    </Button>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">{pteLongReadingTestData.title}</CardTitle>
                            <CardDescription>Complete all questions and submit your answers to see your score.</CardDescription>
                        </CardHeader>
                        {isSubmitted && (
                            <CardContent>
                                <Card className="bg-secondary text-center p-6">
                                    <CardTitle>Your Score</CardTitle>
                                    <p className="text-6xl font-bold text-primary mt-2">{score} / {totalPossibleScore}</p>
                                    <Progress value={(score/totalPossibleScore) * 100} className="mt-4 max-w-sm mx-auto"/>
                                </Card>
                            </CardContent>
                        )}
                    </Card>

                    {pteLongReadingTestData.questions.map((question, index) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <CardTitle>Question {index + 1}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {question.type === 'fill-in-the-blanks-rw' && (
                                    <FillInTheBlanksRWComponent question={question} onAnswerChange={handleAnswerChange} answers={answers[question.id] || {}} isSubmitted={isSubmitted} />
                                )}
                                {question.type === 're-order-paragraphs' && (
                                    <ReorderParagraphsComponent question={question} onAnswerChange={handleAnswerChange} initialOrder={answers[question.id]} isSubmitted={isSubmitted} />
                                )}
                                {question.type === 'fill-in-the-blanks-r' && (
                                    <FillInTheBlanksRComponent question={question} onAnswerChange={handleAnswerChange} answers={answers[question.id] || []} isSubmitted={isSubmitted} />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    
                    <div className="flex flex-col items-center gap-4 mt-8">
                        {!isSubmitted ? (
                            <Button onClick={handleSubmit} size="lg" className="w-full max-w-sm">Submit & Check Answers</Button>
                        ) : (
                            <Button onClick={handleRetry} size="lg" variant="outline" className="w-full max-w-sm">
                                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

// Sub-components for different question types

const FillInTheBlanksRWComponent = ({ question, onAnswerChange, answers, isSubmitted }: { question: FillInTheBlanksRW, onAnswerChange: Function, answers: Record<string,string>, isSubmitted: boolean }) => {
    const passageParts = question.passage.split('{BLANK}');
    return (
        <div className="text-lg leading-loose">
            {passageParts.map((part, index) => {
                if (index < question.blanks.length) {
                    const blankData = question.blanks[index];
                    const userAnswer = answers[`blank-${index}`];
                    const isCorrect = userAnswer === blankData.correctAnswer;
                    return (
                        <React.Fragment key={index}>
                            {part}
                            <Select
                                value={userAnswer}
                                onValueChange={(value) => onAnswerChange(question.id, { ...answers, [`blank-${index}`]: value })}
                                disabled={isSubmitted}
                            >
                                <SelectTrigger className={cn("inline-flex w-auto h-8 text-lg font-semibold mx-1",
                                    isSubmitted && !userAnswer && "border-dashed border-muted-foreground",
                                    isSubmitted && isCorrect && "border-green-500 text-green-700",
                                    isSubmitted && userAnswer && !isCorrect && "border-red-500 text-red-700"
                                )}>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {blankData.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {isSubmitted && !isCorrect && (
                                <span className="text-sm text-green-600 font-semibold ml-1">({blankData.correctAnswer})</span>
                            )}
                        </React.Fragment>
                    );
                }
                return part;
            })}
        </div>
    );
};

const ReorderParagraphsComponent = ({ question, onAnswerChange, initialOrder, isSubmitted }: { question: ReorderParagraphs, onAnswerChange: Function, initialOrder: string[], isSubmitted: boolean }) => {
    const [items, setItems] = useState<string[]>(question.paragraphs);

    useEffect(() => {
        if (!isSubmitted) {
            setItems(shuffle([...question.paragraphs]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitted, question.id]);

    useEffect(() => {
        if(!isSubmitted) {
            onAnswerChange(question.id, items);
        }
    }, [items, isSubmitted, onAnswerChange, question.id]);
    
    const isCorrect = isSubmitted && JSON.stringify(items) === JSON.stringify(question.correctOrder);
    
    return (
        <div>
            <CardDescription>{question.title}: The text boxes below are in the wrong order. Restore the original order.</CardDescription>
            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3 mt-4" >
                {items.map((item, index) => (
                    <Reorder.Item key={item} value={item} className={cn("p-4 bg-background rounded-lg shadow-sm flex items-center gap-4 border", isSubmitted ? "cursor-default" : "cursor-grab active:cursor-grabbing")}>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <span>{item}</span>
                        {isSubmitted && (
                            question.correctOrder[index] === item ? <CheckCircle className="h-5 w-5 text-green-500 ml-auto" /> : <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                        )}
                    </Reorder.Item>
                ))}
            </Reorder.Group>
            {isSubmitted && !isCorrect && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                    <h4 className="font-semibold text-green-800">Correct Order:</h4>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        {question.correctOrder.map(p => <li key={p}>{p}</li>)}
                    </ol>
                </div>
            )}
        </div>
    );
};

const FillInTheBlanksRComponent = ({ question, onAnswerChange, answers, isSubmitted }: { question: FillInTheBlanksReading, onAnswerChange: Function, answers: (string | null)[], isSubmitted: boolean }) => {
    const [wordBank, setWordBank] = useState<string[]>([]);
    
    useEffect(() => {
        if (!isSubmitted) {
            const initialBlanks = Array(question.correctWords.length).fill(null);
            onAnswerChange(question.id, initialBlanks);
            setWordBank(shuffle([...question.wordBank]));
        }
    }, [question.id, isSubmitted, question.correctWords.length, question.wordBank, onAnswerChange]);

    const handleWordBankClick = (word: string, index: number) => {
        if (isSubmitted) return;
        const firstEmptyBlankIndex = answers.findIndex(b => b === null);
        if (firstEmptyBlankIndex !== -1) {
            const newAnswers = [...answers];
            newAnswers[firstEmptyBlankIndex] = word;
            onAnswerChange(question.id, newAnswers);

            const newWordBank = [...wordBank];
            newWordBank.splice(index, 1);
            setWordBank(newWordBank);
        }
    };
    
    const handleBlankClick = (word: string, index: number) => {
        if (isSubmitted) return;
        const newAnswers = [...answers];
        newAnswers[index] = null;
        onAnswerChange(question.id, newAnswers);
        setWordBank(prev => [...prev, word]);
    };
    
    const passageParts = question.passage.split('{BLANK}');

    return (
        <div>
            <div className="p-6 mb-6 bg-muted/50 rounded-lg text-xl leading-relaxed">
               {passageParts.map((part, index) => (
                   <span key={index}>
                       {part}
                       {index < passageParts.length - 1 && (
                           <Button
                                variant="secondary"
                                className={cn(
                                    "inline-flex w-auto h-auto px-2 py-1 mx-1 text-xl font-semibold border-2 border-dashed border-muted-foreground/50",
                                    answers[index] && "border-solid border-primary",
                                    isSubmitted && answers[index] === question.correctWords[index] && "border-green-500 bg-green-500/10 text-green-700",
                                    isSubmitted && answers[index] !== question.correctWords[index] && "border-red-500 bg-red-500/10 text-red-700"
                                )}
                                onClick={() => answers[index] && handleBlankClick(answers[index]!, index)}
                                disabled={isSubmitted}
                           >
                                {answers[index] || <span className="w-24">&nbsp;</span>}
                           </Button>
                       )}
                   </span>
               ))}
            </div>
            
            {!isSubmitted && (
                 <div className="p-4 border rounded-lg">
                    <div className="flex flex-wrap gap-3">
                        {wordBank.map((word, index) => (
                            <Button key={`${word}-${index}`} variant="outline" onClick={() => handleWordBankClick(word, index)}>
                                {word}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
