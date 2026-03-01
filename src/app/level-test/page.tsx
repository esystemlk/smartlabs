'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    ChevronLeft,
    Timer,
    Trophy,
    BookOpen,
    Mic,
    PenTool,
    Brain,
    GraduationCap,
    ArrowRight,
    ShieldCheck,
    Search,
    History,
    LayoutDashboard,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LEVEL_TEST_DATA } from '@/lib/level-test-data';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { scoreLevelTest } from '@/ai/flows/score-level-test';

// Section components will be defined here or imported
// For simplicity in this large file, I'll define logic and structure

export default function LevelTestPage() {
    const { user, isUserLoading: authLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState(0); // 0: Intro, 1-6: Sections, 7: Review, 8: Finalizing, 9: Result
    const [answers, setAnswers] = useState<any>({
        grammar: {},
        vocabulary: {},
        spelling: {},
        sentences: {},
        paragraph: "",
        reading: {},
        speaking: { audioBlob: null, audioUrl: null, transcript: "" }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Auto-redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/level-test');
        }
    }, [user, authLoading, router]);

    // Timer logic
    useEffect(() => {
        let timer: any;
        if (isTimerRunning && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            handleCompleteTest();
        }
        return () => clearInterval(timer);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const startTest = () => {
        setStep(1);
        setIsTimerRunning(true);
    };

    const nextStep = () => {
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleCompleteTest = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);
        setStep(8);

        try {
            // 1. Calculate base scores
            let grammarScore = 0;
            LEVEL_TEST_DATA.grammar.forEach(q => {
                if (answers.grammar[q.id] === q.answer) grammarScore++;
            });

            let vocabularyScore = 0;
            LEVEL_TEST_DATA.vocabulary.forEach(q => {
                if (answers.vocabulary[q.id] === q.answer) vocabularyScore++;
            });

            let spellingScore = 0;
            LEVEL_TEST_DATA.spelling.forEach(q => {
                if (answers.spelling[q.id]?.trim().toLowerCase() === q.answer.toLowerCase()) spellingScore++;
            });

            let readingScore = 0;
            LEVEL_TEST_DATA.reading.questions.forEach(q => {
                if (answers.reading[q.id] === q.answer) readingScore++;
            });

            // 2. AI Scoring for Sentences and Speaking
            const aiInput = {
                sentences: LEVEL_TEST_DATA.sentenceConstruction.map(s => ({
                    id: s.id,
                    task: s.task,
                    answer: (s as any).isParagraph ? answers.paragraph : (answers.sentences[s.id] || "")
                })),
                speaking: {
                    readAloudText: LEVEL_TEST_DATA.speaking[0].text!,
                    speechTask: LEVEL_TEST_DATA.speaking[1].task!,
                    audioDataUri: answers.speaking.audioBase64 || ""
                }
            };

            const aiResult = await scoreLevelTest(aiInput);

            const sentenceScore = aiResult.sentences.reduce((acc, curr) => acc + curr.score, 0);

            // Note: sentenceScore now includes both sentences (5 marks) and paragraph (5 marks) in the AI prompt logic. 
            // In the code, sentences array contains both.

            const speakingScore = (
                aiResult.speaking.readAloudPronunciation +
                aiResult.speaking.readAloudFluency +
                aiResult.speaking.taskGrammar +
                aiResult.speaking.taskVocabulary +
                aiResult.speaking.taskSentenceStructure +
                aiResult.speaking.taskPronunciationFluency
            );

            const totalScore = grammarScore + vocabularyScore + spellingScore + sentenceScore + readingScore + speakingScore;
            const percentageScore = (totalScore / 55) * 100;

            // Level Classification
            let level = "";
            if (percentageScore <= 30) level = "Beginner (A1–A2)";
            else if (percentageScore <= 50) level = "Intermediate (B1)";
            else if (percentageScore <= 70) level = "Upper-Intermediate (B2)";
            else if (percentageScore <= 85) level = "Advanced (C1)";
            else level = "Highly Advanced (C2)";

            const resultData = {
                userId: user?.uid,
                userName: user?.displayName || user?.email?.split('@')[0],
                userEmail: user?.email,
                scores: {
                    grammar: grammarScore,
                    vocabulary: vocabularyScore,
                    spelling: spellingScore,
                    sentences: sentenceScore,
                    reading: readingScore,
                    speaking: speakingScore,
                    total: totalScore,
                    percentage: percentageScore
                },
                aiFeedback: aiResult,
                level,
                answers: {
                    grammar: answers.grammar,
                    vocabulary: answers.vocabulary,
                    spelling: answers.spelling,
                    sentences: answers.sentences,
                    reading: answers.reading
                }
            };

            // 3. Save to Firestore
            if (firestore) {
                await addDoc(collection(firestore, 'levelTestResults'), {
                    ...resultData,
                    timestamp: serverTimestamp()
                });
            }

            setTestResult(resultData);
            setStep(9);
        } catch (error) {
            console.error("Error finalizing test:", error);
            toast({
                variant: "destructive",
                title: "Submission Error",
                description: "There was an error scoring your test. Please contact support."
            });
            setStep(7);
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl min-h-screen">
            <AnimatePresence mode="wait">
                {step === 0 && <IntroStep onStart={startTest} />}
                {step >= 1 && step <= 7 && (
                    <motion.div
                        key="test-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Header / Nav */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-headline">Smart Level Test</h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Section {step} of 7</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="flex-1 md:flex-none">
                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                        <span>Progress</span>
                                        <span>{Math.round((step / 7) * 100)}%</span>
                                    </div>
                                    <Progress value={(step / 7) * 100} className="h-2 w-full md:w-48" />
                                </div>

                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-secondary text-secondary-foreground'}`}>
                                    <Timer className="h-4 w-4" />
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="min-h-[500px]">
                            {step === 1 && <GrammarSection answers={answers} setAnswers={setAnswers} />}
                            {step === 2 && <VocabularySection answers={answers} setAnswers={setAnswers} />}
                            {step === 3 && <SpellingSection answers={answers} setAnswers={setAnswers} />}
                            {step === 4 && <SentenceSection answers={answers} setAnswers={setAnswers} />}
                            {step === 5 && <ParagraphSection answers={answers} setAnswers={setAnswers} />}
                            {step === 6 && <ReadingSection answers={answers} setAnswers={setAnswers} />}
                            {step === 7 && <SpeakingSection answers={answers} setAnswers={setAnswers} />}
                            {step === 8 && <ReviewStep answers={answers} onFinalSubmit={handleCompleteTest} isSubmitting={isSubmitting} />}
                        </div>

                        {/* Footer Navigation */}
                        <div className="flex justify-between items-center pt-6">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={step === 1}
                                className="group"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Previous Section
                            </Button>

                            {step < 8 ? (
                                <Button onClick={nextStep} className="group">
                                    Next Section
                                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCompleteTest}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                                    Submit Final Test
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 9 && (
                    <motion.div
                        key="finalizing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold font-headline">Analyzing Your Performance</h2>
                            <p className="text-muted-foreground max-w-md">Our AI is evaluating your sentences, pronunciation, and fluency to provide a comprehensive diagnostic report...</p>
                        </div>
                    </motion.div>
                )}
                {step === 10 && testResult && <ResultStep result={testResult} />}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-components ---

function IntroStep({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 py-12 text-center"
        >
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
                <GraduationCap className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight">Smart Level Test</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Determine your English proficiency level with our advanced AI-powered assessment.
                    Get instant feedback on your grammar, reading, writing, and speaking.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 w-full max-w-3xl mt-8">
                <div className="p-6 bg-card border rounded-2xl flex flex-col items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Timer className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold">25-30 Minutes</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive evaluation across all core skills.</p>
                </div>
                <div className="p-6 bg-card border rounded-2xl flex flex-col items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Trophy className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold">50 Marks Total</h3>
                    <p className="text-sm text-muted-foreground">Scored based on official IELTS/PTE standards.</p>
                </div>
                <div className="p-6 bg-card border rounded-2xl flex flex-col items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <Brain className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold">AI Diagnostic</h3>
                    <p className="text-sm text-muted-foreground">Advanced scoring for speaking and writing.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-8 w-full max-w-md">
                <Button size="lg" onClick={onStart} className="text-lg h-14 rounded-full font-bold shadow-lg shadow-primary/20">
                    Begin Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/50 py-2 px-4 rounded-full">
                    <ShieldCheck className="h-4 w-4" />
                    Your results will be saved to your profile for teachers to review.
                </div>
            </div>

            <Alert className="max-w-xl text-left">
                <AlertTitle className="font-bold">Important Note</AlertTitle>
                <AlertDescription>
                    Please ensure you are in a quiet environment and have your microphone ready for the speaking section.
                </AlertDescription>
            </Alert>
        </motion.div>
    );
}

function GrammarSection({ answers, setAnswers }: any) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <PenTool className="h-6 w-6 text-primary" />
                    Section 1: Grammar & Tenses
                </CardTitle>
                <CardDescription>Choose the correct answer for each sentence. (10 Marks)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
                {LEVEL_TEST_DATA.grammar.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-card border rounded-2xl space-y-4 hover:border-primary/50 transition-colors">
                        <p className="font-bold text-lg flex gap-3">
                            <span className="text-primary/40 font-mono">{idx + 1}.</span>
                            {q.question.split('____').map((part, i, arr) => (
                                <span key={i}>
                                    {part}
                                    {i < arr.length - 1 && <span className="underline decoration-primary/30 decoration-2 underline-offset-4 px-2 italic text-primary">______</span>}
                                </span>
                            ))}
                        </p>
                        <RadioGroup
                            value={answers.grammar[q.id]}
                            onValueChange={(val) => setAnswers({ ...answers, grammar: { ...answers.grammar, [q.id]: val } })}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
                        >
                            {q.options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                return (
                                    <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted ${answers.grammar[q.id] === letter ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/30'}`}>
                                        <RadioGroupItem value={letter} id={`q${q.id}-${letter}`} className="sr-only" />
                                        <Label htmlFor={`q${q.id}-${letter}`} className="flex items-center w-full cursor-pointer gap-3 font-medium">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono transition-colors ${answers.grammar[q.id] === letter ? 'bg-primary text-white' : 'bg-muted-foreground/10'}`}>
                                                {letter}
                                            </div>
                                            {opt}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function VocabularySection({ answers, setAnswers }: any) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Section 2: Academic Vocabulary
                </CardTitle>
                <CardDescription>Choose the most appropriate word to complete the sentence. (5 Marks)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {LEVEL_TEST_DATA.vocabulary.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-card border rounded-2xl space-y-4">
                        <p className="font-bold text-lg">
                            <span className="text-primary/40 mr-3 font-mono">{idx + 11}.</span>
                            {q.question}
                        </p>
                        <RadioGroup
                            value={answers.vocabulary[q.id]}
                            onValueChange={(val) => setAnswers({ ...answers, vocabulary: { ...answers.vocabulary, [q.id]: val } })}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {q.options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                return (
                                    <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted ${answers.vocabulary[q.id] === letter ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/30'}`}>
                                        <RadioGroupItem value={letter} id={`v${q.id}-${letter}`} className="sr-only" />
                                        <Label htmlFor={`v${q.id}-${letter}`} className="flex items-center w-full cursor-pointer gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono ${answers.vocabulary[q.id] === letter ? 'bg-primary text-white' : 'bg-muted-foreground/10'}`}>
                                                {letter}
                                            </div>
                                            {opt}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function SpellingSection({ answers, setAnswers }: any) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    Section 3: Spelling
                </CardTitle>
                <CardDescription>Correct the spelling of the following words. (5 Marks)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {LEVEL_TEST_DATA.spelling.map((q, idx) => (
                        <div key={q.id} className="p-6 bg-card border rounded-2xl space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Word {idx + 16}</Label>
                                <span className="text-red-500 font-bold line-through text-sm">{q.word}</span>
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="Enter correct spelling..."
                                    className="h-14 text-lg font-bold"
                                    value={answers.spelling[q.id] || ""}
                                    onChange={(e) => setAnswers({ ...answers, spelling: { ...answers.spelling, [q.id]: e.target.value } })}
                                />
                                <PenTool className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 pointer-events-none" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SentenceSection({ answers, setAnswers }: any) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <PenTool className="h-6 w-6 text-primary" />
                    Section 4: Sentence Construction
                </CardTitle>
                <CardDescription>Write one sentence according to the specific instructions below. (5 Marks - AI Scored)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {LEVEL_TEST_DATA.sentenceConstruction.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-card border rounded-2xl space-y-4">
                        <Label className="text-lg font-bold flex gap-3 italic">
                            <span className="text-primary/40 font-mono not-italic">{idx + 21}.</span>
                            {q.task}
                        </Label>
                        <Textarea
                            placeholder="Write your sentence here..."
                            className="min-h-[100px] text-lg resize-none"
                            value={answers.sentences[q.id] || ""}
                            onChange={(e) => setAnswers({ ...answers, sentences: { ...answers.sentences, [q.id]: e.target.value } })}
                        />
                        <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground">Character count: {answers.sentences[q.id]?.length || 0}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function ParagraphSection({ answers, setAnswers }: any) {
    const paragraphTask = LEVEL_TEST_DATA.sentenceConstruction.find(s => (s as any).isParagraph);
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <PenTool className="h-6 w-6 text-primary" />
                    Section 5: Long Sentence Construction
                </CardTitle>
                <CardDescription>Write a short paragraph according to the instructions. (5 Marks - AI Scored)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <div className="p-8 bg-card border rounded-3xl space-y-4">
                    <Label className="text-xl font-bold leading-relaxed block">
                        Task: {paragraphTask?.task}
                    </Label>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-primary font-medium text-sm">
                        Purpose: Evaluate coherence, sentence variety, and the ability to produce longer academic sentences.
                    </div>
                    <Textarea
                        placeholder="Type your 50-word paragraph here..."
                        className="min-h-[200px] text-lg leading-relaxed resize-none mt-4"
                        value={answers.paragraph || ""}
                        onChange={(e) => setAnswers({ ...answers, paragraph: e.target.value })}
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-4">
                        <div className="flex gap-4">
                            <span>Words: {answers.paragraph?.trim().split(/\s+/).filter(Boolean).length || 0} / 50</span>
                            <span>Characters: {answers.paragraph?.length || 0}</span>
                        </div>
                        {answers.paragraph?.trim().split(/\s+/).filter(Boolean).length >= 45 && (
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Length requirement met
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ReadingSection({ answers, setAnswers }: any) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Section 5: IELTS Reading
                </CardTitle>
                <CardDescription>Read the passage and answer the questions below. (10 Marks)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 grid lg:grid-cols-2 gap-8 items-start">
                {/* Passage Side */}
                <div className="bg-card border rounded-2xl p-8 sticky top-24 max-h-[70vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-6 font-headline underline underline-offset-8 decoration-primary/20">The Growth of Online Learning</h3>
                    <div className="prose prose-slate max-w-none text-muted-foreground text-lg leading-relaxed space-y-4">
                        {LEVEL_TEST_DATA.reading.passage.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </div>

                {/* Questions Side */}
                <div className="space-y-6">
                    {LEVEL_TEST_DATA.reading.questions.map((q, idx) => (
                        <div key={q.id} className="p-6 bg-card border rounded-2xl space-y-4">
                            <p className="font-bold">
                                <span className="text-primary/40 mr-2 font-mono">{idx + 26}.</span>
                                {q.question}
                            </p>
                            {q.options ? (
                                <RadioGroup
                                    value={answers.reading[q.id]}
                                    onValueChange={(val) => setAnswers({ ...answers, reading: { ...answers.reading, [q.id]: val } })}
                                    className="grid grid-cols-1 gap-3"
                                >
                                    {q.options.map((opt, i) => {
                                        const letter = String.fromCharCode(65 + i);
                                        return (
                                            <div key={i} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted ${answers.reading[q.id] === letter ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/30'}`}>
                                                <RadioGroupItem value={letter} id={`r${q.id}-${letter}`} className="sr-only" />
                                                <Label htmlFor={`r${q.id}-${letter}`} className="flex items-center w-full cursor-pointer gap-3 text-sm">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold font-mono text-xs ${answers.reading[q.id] === letter ? 'bg-primary text-white' : 'bg-muted-foreground/10'}`}>
                                                        {letter}
                                                    </div>
                                                    {opt}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            ) : (
                                <RadioGroup
                                    value={answers.reading[q.id]}
                                    onValueChange={(val) => setAnswers({ ...answers, reading: { ...answers.reading, [q.id]: val } })}
                                    className="flex flex-wrap gap-4"
                                >
                                    {["True", "False", "Not Given"].map((val) => (
                                        <div key={val} className={`flex items-center space-x-2 p-3 px-4 rounded-full border-2 transition-all cursor-pointer hover:bg-muted ${answers.reading[q.id] === val ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/30'}`}>
                                            <RadioGroupItem value={val} id={`r${q.id}-${val}`} className="sr-only" />
                                            <Label htmlFor={`r${q.id}-${val}`} className="cursor-pointer font-bold text-xs uppercase tracking-widest">{val}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SpeakingSection({ answers, setAnswers }: any) {
    const { toast } = useToast();
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'stopped'>('idle');
    const [audioUrl, setAudioUrl] = useState<string | null>(answers.speaking.audioUrl);
    const mediaRecorderRef = (window as any)._mediaRecorderRef || { current: null };
    const audioChunksRef = (window as any)._audioChunksRef || { current: [] };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            (window as any)._mediaRecorderRef = mediaRecorderRef;

            audioChunksRef.current = [];
            (window as any)._audioChunksRef = audioChunksRef;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Convert to Base64 for AI scoring later
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    setAnswers({
                        ...answers,
                        speaking: {
                            ...answers.speaking,
                            audioUrl: url,
                            audioBase64: reader.result as string
                        }
                    });
                };

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecordingStatus('recording');
        } catch (err) {
            console.error("Microphone error:", err);
            toast({ variant: "destructive", title: "Microphone Error", description: "Could not access microphone." });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecordingStatus('stopped');
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <Mic className="h-6 w-6 text-primary" />
                    Section 6: Speaking
                </CardTitle>
                <CardDescription>Record your responses for the tasks below. (5 Marks - AI Scored)</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
                <div className="p-8 bg-card border rounded-3xl space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Trophy className="h-5 w-5" />
                            <span className="font-bold uppercase tracking-tighter text-sm">Task 1: Read Aloud</span>
                        </div>
                        <p className="text-2xl font-bold leading-relaxed bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            {LEVEL_TEST_DATA.speaking[0].text}
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Brain className="h-5 w-5" />
                            <span className="font-bold uppercase tracking-tighter text-sm">Task 2: Speech (30-40s)</span>
                        </div>
                        <p className="text-xl font-bold flex items-center gap-4">
                            Q: {LEVEL_TEST_DATA.speaking[1].task}
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-12 bg-secondary/30 rounded-3xl border-2 border-dashed border-primary/20 space-y-6">
                        {recordingStatus === 'idle' && (
                            <Button onClick={startRecording} size="lg" className="h-20 w-20 rounded-full shadow-xl shadow-primary/20">
                                <Mic className="h-8 w-8" />
                            </Button>
                        )}
                        {recordingStatus === 'recording' && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-20 w-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-xl shadow-red-500/20">
                                    <div className="w-8 h-8 bg-white rounded-sm" />
                                </div>
                                <Button variant="destructive" onClick={stopRecording}>Stop & Save Recording</Button>
                                <span className="text-red-500 font-mono font-bold animate-bounce mt-2">Recording Live...</span>
                            </div>
                        )}
                        {recordingStatus === 'stopped' && audioUrl && (
                            <div className="w-full max-w-md space-y-6 text-center">
                                <div className="p-4 bg-background rounded-2xl border flex items-center gap-4">
                                    <audio src={audioUrl} controls className="flex-1" />
                                </div>
                                <Button variant="outline" onClick={() => setRecordingStatus('idle')}>
                                    <History className="mr-2 h-4 w-4" /> Re-record
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-green-600 font-bold bg-green-50 py-2 px-4 rounded-full">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Recording Captured Successfully
                                </div>
                            </div>
                        )}
                        {recordingStatus === 'idle' && <p className="text-muted-foreground font-medium">Click the microphone to start recording both tasks in one go.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ReviewStep({ answers, onFinalSubmit, isSubmitting }: any) {
    const sections = [
        { name: "Grammar", count: Object.keys(answers.grammar).length, total: 10 },
        { name: "Vocabulary", count: Object.keys(answers.vocabulary).length, total: 5 },
        { name: "Spelling", count: Object.keys(answers.spelling).filter(k => answers.spelling[k]).length, total: 5 },
        { name: "Sentences", count: Object.keys(answers.sentences).filter(k => answers.sentences[k]).length, total: 5 },
        { name: "Reading", count: Object.keys(answers.reading).length, total: 10 },
        { name: "Speaking", count: answers.speaking.audioBase64 ? 1 : 0, total: 1 },
    ];

    const allComplete = sections.every(s => s.count === s.total);

    return (
        <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold font-headline">Test Review</h2>
                <p className="text-muted-foreground italic">Double check your answers before submitting. You cannot go back once submitted.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((s) => (
                    <Card key={s.name} className={s.count === s.total ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">{s.name}</CardTitle>
                            {s.count === s.total ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <Circle className="h-4 w-4 text-red-600" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{s.count}/{s.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {s.count === s.total ? 'All questions answered' : `${s.total - s.count} questions missing`}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Alert variant={allComplete ? "default" : "destructive"}>
                <AlertTitle className="font-bold">{allComplete ? 'Ready for Submission' : 'Incomplete Sections'}</AlertTitle>
                <AlertDescription>
                    {allComplete
                        ? "Great! You have answered all parts of the test. Ready to see your score?"
                        : "You have missing answers in some sections. It is recommended to answer all questions for a more accurate level placement."}
                </AlertDescription>
            </Alert>
        </div>
    );
}

function ResultStep({ result }: { result: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 py-10"
        >
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-primary/10 rounded-full">
                    <Trophy className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl font-black font-headline tracking-tighter">Congratulations, {result.userName}!</h1>
                    <p className="text-xl text-muted-foreground">You have successfully completed the Smart Level Test.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mt-12">
                {/* Result Card */}
                <Card className="lg:col-span-2 overflow-hidden border-2 border-primary/20 shadow-2xl">
                    <div className="bg-primary p-8 text-white text-center space-y-4">
                        <p className="uppercase tracking-[0.2em] font-bold text-primary-foreground/80 opacity-60">Your Proficiency Level</p>
                        <h2 className="text-5xl font-black font-headline">{result.level}</h2>
                        <div className="flex justify-center items-center gap-6 pt-4">
                            <div className="text-center">
                                <p className="text-4xl font-black">{result.scores.total}/50</p>
                                <p className="text-xs uppercase opacity-70">Total Score</p>
                            </div>
                            <div className="w-px h-12 bg-white/20" />
                            <div className="text-center">
                                <p className="text-4xl font-black">{result.scores.percentage}%</p>
                                <p className="text-xs uppercase opacity-70">Accuracy</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-8 space-y-8 bg-card">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <ScoreStat label="Grammar" score={result.scores.grammar} total={10} />
                            <ScoreStat label="Vocabulary" score={result.scores.vocabulary} total={5} />
                            <ScoreStat label="Spelling" score={result.scores.spelling} total={5} />
                            <ScoreStat label="Reading" score={result.scores.reading} total={10} />
                            <ScoreStat label="Writing" score={result.scores.sentences} total={5} />
                            <ScoreStat label="Speaking" score={result.scores.speaking} total={15} />
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                                <Brain className="h-6 w-6 text-primary" />
                                AI Diagnostic Breakdown
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <DiagnosticBadge label="Grammar Level" value={result.aiFeedback.diagnostic.grammarLevel} />
                                <DiagnosticBadge label="Complexity" value={result.aiFeedback.diagnostic.sentenceComplexity} />
                                <DiagnosticBadge label="Vocabulary" value={result.aiFeedback.diagnostic.vocabularyLevel} />
                                <DiagnosticBadge label="Pronunciation" value={result.aiFeedback.diagnostic.pronunciation} />
                            </div>
                            <div className="p-6 bg-muted rounded-2xl space-y-3 border">
                                <h4 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                                    <PenTool className="h-4 w-4" />
                                    Examiner Summary
                                </h4>
                                <p className="text-lg italic leading-relaxed">"{result.aiFeedback.diagnostic.summary}"</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Based on your score, we recommend the following class level:</p>
                            <div className="p-4 bg-primary text-white rounded-xl text-center font-bold text-xl mb-4">
                                {result.level.includes("Beginner") ? "Grammar Clinic" :
                                    result.level.includes("Intermediate") ? "PTE Boostify (Foundation)" :
                                        result.level.includes("Advanced") ? "PTE Boostify (Standard)" : "PTE Boostify (Intensive)"}
                            </div>
                            <div className="space-y-3">
                                <Button asChild className="w-full h-12 rounded-xl group" variant="default">
                                    <Link href={result.level.includes("Beginner") ? "/courses/grammar-clinic" : "/courses/pte-boostify"}>
                                        View Recommended Course
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                                <Button asChild className="w-full h-12 rounded-xl group" variant="outline">
                                    <Link href={result.level.includes("Beginner") ? "https://wa.me/yourwhatsappnumber?text=I'd like to enroll in Grammar Clinic after my level test" : "/courses"}>
                                        Proceed to Payment
                                        <CreditCard className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Shared With Admins</h4>
                            <p className="text-xs text-muted-foreground">A copy of this diagnostic report has been shared with our academic team to customize your study plan.</p>
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher${i}`} alt="Admin" />
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                    +4
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button asChild variant="outline" className="w-full">
                        <a href="/dashboard">
                            Back to Dashboard
                        </a>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

function ScoreStat({ label, score, total }: { label: string; score: number; total: number }) {
    const percentage = (score / total) * 100;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>{label}</span>
                <span>{score}/{total}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${percentage > 80 ? 'bg-green-500' : percentage > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                />
            </div>
        </div>
    );
}

function DiagnosticBadge({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-4 bg-card border rounded-xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{label}</span>
            <span className="font-bold text-primary">{value}</span>
        </div>
    );
}
