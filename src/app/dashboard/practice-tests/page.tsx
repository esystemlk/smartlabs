'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { BookOpen, ArrowLeft, Sparkles, Target, Globe, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const practiceTests = [
  // --- PTE ---
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Read Aloud',
    description: 'Practice reading a text aloud.',
    href: '/dashboard/practice-tests/pte-speaking-read-aloud',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Repeat Sentence',
    description: 'Listen and repeat a sentence.',
    href: '/dashboard/practice-tests/pte-speaking-repeat-sentence',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Describe Image',
    description: 'Describe an image in detail.',
    href: '/dashboard/practice-tests/pte-speaking-describe-image',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Retell Lecture',
    description: 'Listen to a lecture and retell it.',
    href: '/dashboard/practice-tests/pte-speaking-retell-lecture',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Answer Short Question',
    description: 'Answer simple questions.',
    href: '/dashboard/practice-tests/pte-speaking-answer-short-question',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Summarize Group Discussion',
    description: 'Listen and summarize a discussion.',
    href: '/dashboard/practice-tests/pte-speaking-summarize-group-discussion',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Respond to a Situation',
    description: 'Respond to a daily life situation.',
    href: '/dashboard/practice-tests/pte-speaking-respond-to-situation',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Speaking',
    title: 'Respond to a Situation (Core)',
    description: 'Core-specific situation response.',
    href: '/dashboard/practice-tests/pte-speaking-respond-to-situation-core',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Writing',
    title: 'Summarize Written Text',
    description: 'Write a one-sentence summary of a text.',
    href: '/dashboard/practice-tests/pte-writing-summarize-text',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Writing',
    title: 'Write Essay',
    description: 'Write a 200-300 word argumentative essay.',
    href: '/dashboard/practice-tests/pte-writing-write-essay',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Writing',
    title: 'Summarize Written Text (Core)',
    description: 'Core-specific summary writing.',
    href: '/dashboard/practice-tests/pte-writing-summarize-text-core',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Writing',
    title: 'Write Email (Core)',
    description: 'Core-specific email writing task.',
    href: '/dashboard/practice-tests/pte-writing-write-email-core',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Reading',
    title: 'Reading: Multiple-Choice',
    description: 'Practice your reading comprehension skills for the PTE Academic exam.',
    href: '/dashboard/practice-tests/pte-reading-test',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Reading',
    title: 'Fill in the Blanks (Dropdown)',
    description: 'Select the most appropriate word from a dropdown.',
    href: '/dashboard/practice-tests/pte-reading-fill-in-blanks-dropdown',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Reading',
    title: 'Multiple-Choice, Multiple Answer',
    description: 'Select all correct responses from a list.',
    href: '/dashboard/practice-tests/pte-reading-multiple-choice-multiple-answer',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Reading',
    title: 'Reorder Paragraphs',
    description: 'Arrange text boxes in the correct order.',
    href: '/dashboard/practice-tests/pte-reading-reorder-paragraphs',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Reading',
    title: 'Fill in the Blanks (Drag & Drop)',
    description: 'Drag words to fill the blanks in a text.',
    href: '/dashboard/practice-tests/pte-reading-fill-in-blanks-drag-drop',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Summarize Spoken Text',
    description: 'Summarize a lecture you hear.',
    href: '/dashboard/practice-tests/pte-listening-summarize-spoken-text',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Multiple-Choice, Multiple Answer',
    description: 'Select all correct responses from a list.',
    href: '/dashboard/practice-tests/pte-listening-multiple-choice-multiple-answer',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Fill in the Blanks',
    description: 'Type the missing word in a transcript.',
    href: '/dashboard/practice-tests/pte-listening-fill-in-blanks',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Highlight Correct Summary',
    description: 'Choose the best summary of a recording.',
    href: '/dashboard/practice-tests/pte-listening-highlight-correct-summary',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Multiple-Choice, Single Answer',
    description: 'Select one correct response.',
    href: '/dashboard/practice-tests/pte-listening-multiple-choice-single-answer',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Select Missing Word',
    description: 'Choose the last word of a recording.',
    href: '/dashboard/practice-tests/pte-listening-select-missing-word',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Highlight Incorrect Words',
    description: 'Find words that differ from a recording.',
    href: '/dashboard/practice-tests/pte-listening-highlight-incorrect-words',
    status: 'Available',
    hasAiScore: false,
  },
  {
    exam: 'PTE',
    section: 'Listening',
    title: 'Write from Dictation',
    description: 'Type a sentence you hear.',
    href: '/dashboard/practice-tests/pte-listening-write-from-dictation',
    status: 'Available',
    hasAiScore: true,
  },
  {
    exam: 'CELPIP',
    section: 'Listening',
    title: 'CELPIP Listening Practice',
    description: 'Listen to conversations and answer questions to prepare for the CELPIP Listening test.',
    href: '/dashboard/practice-tests/celpip-listening-practice',
    status: 'Available',
    hasAiScore: false,
  },
];

const exams = ['PTE', 'CELPIP'];
const sectionsByExam = exams.reduce(
  (acc, exam) => {
    acc[exam] = [...new Set(practiceTests.filter((t) => t.exam === exam).map((t) => t.section))];
    return acc;
  },
  {} as Record<string, string[]>
);

const examDetails: { [key: string]: { icon: any; color: string; iconColor: string; description: string } } = {
  PTE: {
    icon: Target,
    color: 'from-accent-1/20 to-accent-1/5',
    iconColor: 'text-accent-1',
    description: "Practice all PTE question types with AI feedback."
  },
  CELPIP: {
    icon: Zap,
    color: 'from-accent-4/20 to-accent-4/5',
    iconColor: 'text-accent-4',
    description: "Hone your skills for Canadian English proficiency."
  }
}


export default function PracticeTestsPage() {
  return (
    <div className="space-y-4">
        <Button asChild variant="ghost">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                <CardTitle className="text-2xl md:text-3xl">AI Scoring Tests</CardTitle>
                <CardDescription>
                    Select an exam below to browse available practice tests.
                </CardDescription>
                </div>
            </div>
            </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
            const details = examDetails[exam];
            const Icon = details.icon;
            return (
                <DropdownMenu key={exam}>
                <DropdownMenuTrigger asChild>
                    <Card className="group cursor-pointer overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all duration-300">
                    <CardHeader className={`bg-gradient-to-br ${details.color} p-6`}>
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl bg-white shadow-md`}>
                            <Icon className={`h-7 w-7 ${details.iconColor}`} />
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <CardTitle className="pt-4 text-xl">{exam} Practice Tests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <CardDescription>{details.description}</CardDescription>
                    </CardContent>
                    </Card>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-0">
                    <Accordion type="single" collapsible className="w-full">
                        {sectionsByExam[exam].map((section) => (
                            <AccordionItem value={section} key={section} className="border-b-0 last:border-b-0">
                                <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline hover:bg-muted/50 rounded-md">
                                    {section}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-col space-y-1 px-2 pb-2">
                                        {practiceTests
                                            .filter((t) => t.exam === exam && t.section === section)
                                            .map((test) => (
                                            <Link
                                                key={test.title}
                                                href={test.status !== 'Coming Soon' ? test.href : '#'}
                                                className={cn(
                                                "flex w-full items-center justify-between gap-2 rounded-md p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                                                test.status === 'Coming Soon' && "pointer-events-none opacity-50"
                                                )}
                                            >
                                                <span className="flex-1 truncate">{test.title}</span>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                {test.hasAiScore && (
                                                    <Badge
                                                    variant="secondary"
                                                    className="bg-primary/10 text-primary"
                                                    >
                                                    <Sparkles className="mr-1 h-3 w-3" />
                                                    AI
                                                    </Badge>
                                                )}
                                                </div>
                                            </Link>
                                            ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </DropdownMenuContent>
                </DropdownMenu>
            )
            })}
        </CardContent>
        </Card>
    </div>
  );
}
