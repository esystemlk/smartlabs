'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Search,
    ArrowLeft,
    FileText,
    Calendar,
    User,
    Mail,
    ExternalLink,
    ChevronDown,
    Filter,
    Download,
    Brain,
    History
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { format } from 'date-fns';

export default function LevelTestsAdminPage() {
    const { firestore } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');

    const resultsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'levelTestResults'), orderBy('timestamp', 'desc')) : null,
        [firestore]
    );

    const { data: results, isLoading } = useCollection(resultsQuery);

    const filteredResults = useMemo(() => {
        if (!results) return [];
        return results.filter(r => {
            const matchesSearch =
                r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = levelFilter === 'All' || r.level.includes(levelFilter);
            return matchesSearch && matchesLevel;
        });
    }, [results, searchQuery, levelFilter]);

    const levels = ['All', 'Beginner', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Highly Advanced'];

    return (
        <div className="w-full min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
                            <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                        </Button>
                        <h1 className="text-3xl font-black font-headline tracking-tight">Level Test Results</h1>
                        <p className="text-muted-foreground">Monitor student proficiency and review AI-generated diagnostic reports.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b pb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-10 h-11"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                                {levels.map(l => (
                                    <Button
                                        key={l}
                                        variant={levelFilter === l ? 'default' : 'secondary'}
                                        size="sm"
                                        onClick={() => setLevelFilter(l)}
                                        className="rounded-full text-xs font-bold px-4"
                                    >
                                        {l}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                <p className="text-sm font-medium text-muted-foreground">Loading test results...</p>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold">Student</TableHead>
                                        <TableHead className="font-bold">Date & Time</TableHead>
                                        <TableHead className="font-bold">Score</TableHead>
                                        <TableHead className="font-bold">Level</TableHead>
                                        <TableHead className="text-right font-bold w-[120px]">Report</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredResults.map((res) => (
                                        <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{res.userName}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {res.userEmail}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{res.timestamp ? format(res.timestamp.toDate(), 'MMM dd, yyyy') : 'No Date'}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{res.timestamp ? format(res.timestamp.toDate(), 'hh:mm a') : ''}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-primary">{res.scores.total}</span>
                                                    <span className="text-xs font-bold text-muted-foreground">/ 50</span>
                                                    <div className="ml-2 w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${(res.scores.total / 50) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold tracking-tight border-2 ${res.level.includes('Advanced') ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                                    res.level.includes('Intermediate') ? 'border-sky-200 bg-sky-50 text-sky-700' :
                                                        'border-slate-200 bg-slate-50 text-slate-700'
                                                    }`}>
                                                    {res.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ResultDetail result={res} history={results ? results.filter(h => h.userId === res.userId) : []} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold font-headline">No results found</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-sm">We couldn't find any test results matching your current filters or search query.</p>
                                <Button variant="outline" onClick={() => { setSearchQuery(''); setLevelFilter('All'); }}>Clear all filters</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ResultDetail({ result, history }: { result: any, history: any[] }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold gap-2">
                    <FileText className="h-4 w-4" /> View Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-8 bg-slate-900 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Brain className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary-foreground/60 font-bold uppercase tracking-wider text-[10px]">
                                <Trophy className="h-3 w-3" /> Grade Report
                            </div>
                            <DialogTitle className="text-4xl font-black font-headline leading-tight">{result.userName}</DialogTitle>
                            <div className="flex items-center gap-4 text-indigo-100/60 text-sm font-medium mt-2">
                                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {result.userEmail}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {result.timestamp ? format(result.timestamp.toDate(), 'PPP p') : 'No Date'}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[140px]">
                            <p className="text-xs uppercase font-bold text-white/60 mb-1">Final Level</p>
                            <p className="text-2xl font-black">{result.level.split('(')[0]}</p>
                            <p className="text-[10px] font-bold opacity-60 italic">{result.level.match(/\((.*?)\)/)?.[0] || ''}</p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-10">
                        {/* Score Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <ScoreBox label="Grammar" value={result.scores.grammar} total={10} />
                            <ScoreBox label="Vocabulary" value={result.scores.vocabulary} total={5} />
                            <ScoreBox label="Spelling" value={result.scores.spelling} total={5} />
                            <ScoreBox label="Reading" value={result.scores.reading} total={10} />
                            <ScoreBox label="Writing" value={result.scores.sentences} total={5} />
                            <ScoreBox label="Speaking" value={result.scores.speaking} total={10} />
                        </div>

                        {/* Diagnostic Section */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline flex items-center gap-3">
                                <Brain className="h-6 w-6 text-primary" />
                                Teacher Diagnostic Report
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InfoBadge label="Grammar Level" value={result.aiFeedback.diagnostic.grammarLevel} color="blue" />
                                <InfoBadge label="Complexity" value={result.aiFeedback.diagnostic.sentenceComplexity} color="purple" />
                                <InfoBadge label="Vocabulary" value={result.aiFeedback.diagnostic.vocabularyLevel} color="green" />
                                <InfoBadge label="Pronunciation" value={result.aiFeedback.diagnostic.pronunciation} color="orange" />
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 relative">
                                <div className="absolute top-4 right-6 text-slate-200">
                                    <FileText className="w-12 h-12" />
                                </div>
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Performance Summary</h4>
                                <p className="text-lg text-slate-800 italic leading-relaxed relative z-10">
                                    "{result.aiFeedback.diagnostic.summary}"
                                </p>
                            </div>
                        </div>

                        {/* Recent History */}
                        {history.length > 1 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold font-headline flex items-center gap-3">
                                    <History className="h-6 w-6 text-primary" />
                                    Test History
                                </h3>
                                <div className="space-y-2">
                                    {history.map((h, i) => (
                                        <div key={h.id} className={`flex items-center justify-between p-4 rounded-xl border ${h.id === result.id ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{format(h.timestamp.toDate(), 'PPP')}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{format(h.timestamp.toDate(), 'p')}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-black">{h.scores.total}/50</p>
                                                    <p className="text-[10px] uppercase text-muted-foreground">Score</p>
                                                </div>
                                                <div className="text-right w-32">
                                                    <p className="text-sm font-bold truncate">{h.level.split('(')[0]}</p>
                                                    <p className="text-[10px] uppercase text-muted-foreground">Level</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Answers Breakdown */}
                        <Separator />
                        <div className="space-y-4 pb-10">
                            <h3 className="text-xl font-bold font-headline">Submission Details</h3>
                            <Tabs defaultValue="sentences">
                                <TabsList>
                                    <TabsTrigger value="sentences">Writing Task</TabsTrigger>
                                    <TabsTrigger value="speaking">Speaking Task</TabsTrigger>
                                    <TabsTrigger value="mcq">MCQ Review</TabsTrigger>
                                </TabsList>
                                <TabsContent value="sentences" className="pt-4 space-y-4">
                                    {result.aiFeedback.sentences.map((s: any, idx: number) => (
                                        <div key={idx} className="p-4 border rounded-xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Sentence {idx + 1}</span>
                                                <Badge variant={s.score === 1 ? 'default' : 'destructive'}>{s.score === 1 ? 'Correct' : 'Incorrect'}</Badge>
                                            </div>
                                            <p className="font-medium text-slate-800">"{result.answers.sentences[s.id]}"</p>
                                            <p className="text-xs text-muted-foreground">Feedback: {s.feedback}</p>
                                        </div>
                                    ))}
                                </TabsContent>
                                <TabsContent value="speaking" className="pt-4 space-y-4">
                                    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4">
                                        <h4 className="font-bold text-sm opacity-60 uppercase tracking-widest">Transcribed Audio</h4>
                                        <p className="text-xl italic">"{result.aiFeedback.speaking.transcript || 'No transcript available'}"</p>
                                        <Separator className="opacity-10" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold opacity-40 uppercase">Feedback</p>
                                                <p className="text-sm">{result.aiFeedback.speaking.overallFeedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="mcq" className="pt-4">
                                    <p className="text-sm text-muted-foreground italic">Self-corrected multiple choice questions from Grammar, Vocabulary, and Reading sections.</p>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-slate-50 border-t flex justify-end">
                    <Button onClick={() => window.print()} variant="outline">Print Report</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ScoreBox({ label, value, total }: { label: string, value: number, total: number }) {
    return (
        <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-center flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
            <span className="text-xl font-black text-slate-800">{value} <span className="text-xs font-bold text-slate-300">/ {total}</span></span>
        </div>
    );
}

function InfoBadge({ label, value, color }: { label: string, value: string, color: 'blue' | 'purple' | 'green' | 'orange' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        purple: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return (
        <div className={`p-4 rounded-2xl border ${colors[color]} flex flex-col gap-1`}>
            <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">{label}</span>
            <span className="text-sm font-black">{value}</span>
        </div>
    );
}

function Trophy(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}
