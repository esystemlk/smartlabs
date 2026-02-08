'use client';

import { motion } from 'framer-motion';
import {
    Brain,
    ChevronLeft,
    Search,
    Timer,
    Layout,
    Languages,
    Target,
    Zap,
    Sparkles,
    Star,
    Award,
    CheckCircle2,
    BookOpen,
    Clock,
    Info,
    AlertTriangle,
    FileText,
    Lightbulb,
    TrendingUp,
    Users,
    Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function WorkshopDocumentPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] selection:bg-primary/20">
            <Header />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-5xl">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between mb-12">
                        <Link href="/resources">
                            <Button variant="ghost" className="rounded-2xl gap-2 font-bold group">
                                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Library
                            </Button>
                        </Link>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] px-4 py-1.5 rounded-full">
                                WORKSHOP MANUAL
                            </Badge>
                        </div>
                    </div>

                    {/* Content Paper Style */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[64px] shadow-3xl overflow-hidden"
                    >
                        {/* Content Body */}
                        <div className="p-12 md:p-24 space-y-24">

                            {/* Section 1: Identify the Essay Type */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <Search className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Identify the Essay Type</h2>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[32px] border border-slate-100 dark:border-slate-800 italic font-bold text-lg text-slate-600 dark:text-slate-400">
                                    "Before writing, spend 20–30 seconds to understand the question. Ask: What exactly is the examiner asking me to do?"
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="p-8 bg-amber-50 dark:bg-amber-950/10 rounded-[32px] border border-amber-100 dark:border-amber-900/20">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Timer className="text-amber-500 h-6 w-6" />
                                                <h4 className="font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest text-xs">Time Plan</h4>
                                            </div>
                                            <p className="font-bold text-amber-800 dark:text-amber-300 mb-4">In PTE, you have only 20 minutes. So your time plan should be:</p>
                                            <ul className="space-y-3 font-bold text-amber-800 dark:text-amber-300">
                                                <li>• <span className="font-black">14–16 minutes</span> → Writing</li>
                                                <li>• <span className="font-black">3–4 minutes</span> → Checking</li>
                                            </ul>
                                            <div className="mt-6 p-4 bg-amber-100 dark:bg-amber-900/20 rounded-2xl">
                                                <p className="text-sm font-black text-amber-900 dark:text-amber-200 mb-2">Check for:</p>
                                                <ul className="text-sm font-bold text-amber-800 dark:text-amber-300 space-y-1">
                                                    <li>• Spelling</li>
                                                    <li>• Grammar</li>
                                                    <li>• Missing words</li>
                                                    <li>• Spaces</li>
                                                    <li>• Sentence clarity</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-emerald-50 dark:bg-emerald-950/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Target className="text-emerald-500 h-6 w-6" />
                                                <h4 className="font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-widest text-xs">Ideal Word Count</h4>
                                            </div>
                                            <p className="font-black text-4xl text-emerald-600 dark:text-emerald-400">220–230 Words</p>
                                            <p className="text-sm font-bold text-emerald-800/80 dark:text-emerald-300/80 mt-4">Why?</p>
                                            <ul className="text-sm font-bold text-emerald-800 dark:text-emerald-300 space-y-2 mt-2">
                                                <li>• Below 200 → Low content score</li>
                                                <li>• Above 250 → More mistakes</li>
                                                <li>• <span className="font-black">220–230 = Safe and optimal</span></li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Card className="rounded-[32px] overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-xs">
                                            Quick Identification Trick
                                        </div>
                                        <CardContent className="p-8">
                                            <div className="space-y-6">
                                                {[
                                                    { signal: "Agree / extent", type: "Opinion" },
                                                    { signal: "Advantages / disadvantages", type: "Pros & Cons" },
                                                    { signal: "Problems / solutions", type: "Problem–Solution" },
                                                    { signal: "Some people… others…", type: "Discussion" },
                                                    { signal: "Why / What causes", type: "Open Question" }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                                                        <span className="font-bold text-slate-500 italic">If you see "{item.signal}"</span>
                                                        <Badge className="bg-primary/10 text-primary border-none font-black">{item.type}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* Section 2: Standard Essay Structure */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <Layout className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Standard Essay Structure (Works for ALL types)</h2>
                                </div>
                                <p className="text-xl font-bold text-slate-500">Every PTE essay should have 4 paragraphs:</p>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {['Introduction', 'Body Paragraph 1', 'Body Paragraph 2', 'Conclusion'].map((p, i) => (
                                        <div key={i} className="p-6 bg-slate-900 dark:bg-primary rounded-2xl text-white text-center">
                                            <span className="block text-[10px] font-black opacity-50 uppercase mb-1">Step {i + 1}</span>
                                            <span className="font-black text-sm tracking-tight">{p}</span>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-lg font-bold text-slate-600 dark:text-slate-400 italic">No matter what the question type is, the structure remains the same.</p>

                                <h3 className="text-2xl font-black mt-12">Paragraph Word Distribution</h3>
                                <div className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950">
                                                <th className="p-6 font-black uppercase text-xs tracking-widest">Paragraph</th>
                                                <th className="p-6 font-black uppercase text-xs tracking-widest">Words</th>
                                                <th className="p-6 font-black uppercase text-xs tracking-widest">Sentences</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-bold">
                                            <tr className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="p-6">Introduction</td>
                                                <td className="p-6">30–40</td>
                                                <td className="p-6">2 sentences</td>
                                            </tr>
                                            <tr className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="p-6">Body 1</td>
                                                <td className="p-6">80–90</td>
                                                <td className="p-6">4–5 sentences</td>
                                            </tr>
                                            <tr className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="p-6">Body 2</td>
                                                <td className="p-6">80–90</td>
                                                <td className="p-6">4–5 sentences</td>
                                            </tr>
                                            <tr className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="p-6">Conclusion</td>
                                                <td className="p-6">20–30</td>
                                                <td className="p-6">1 sentence</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Section 3: Introduction Structure */}
                            <section className="space-y-12">
                                <div className="flex items-center gap-4">
                                    <Lightbulb className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Introduction Structure (2 Sentences Only)</h2>
                                </div>

                                <div className="p-8 bg-primary/5 rounded-[32px] border-2 border-dashed border-primary/20">
                                    <h3 className="text-2xl font-black mb-4">Sentence 1 – Background Statement</h3>
                                    <p className="font-bold text-lg text-slate-600 dark:text-slate-400">Introduce the topic generally.</p>
                                </div>

                                <h3 className="text-3xl font-black">10 Alternative Introduction Starters (Universal)</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { num: 1, title: "Growing Attention Style", text: "The topic of [topic] has gained significant attention in today's world." },
                                        { num: 2, title: "Modern Society Style", text: "In modern society, [topic] plays an increasingly important role." },
                                        { num: 3, title: "Common Debate Style", text: "There is an ongoing debate about whether [topic statement]." },
                                        { num: 4, title: "Increasing Trend Style", text: "The growing trend of [topic] has sparked widespread discussion." },
                                        { num: 5, title: "Impact-Based Opening", text: "[Topic] has a major impact on individuals, society, and the economy." },
                                        { num: 6, title: "Importance Style", text: "The importance of [topic] cannot be ignored in today's fast-changing world." },
                                        { num: 7, title: "Public Concern Style", text: "[Topic] has become a matter of public concern in many countries." },
                                        { num: 8, title: "Change Over Time Style", text: "Over the past few years, [topic] has changed the way people live and work." },
                                        { num: 9, title: "Technology / Development Context (Flexible)", text: "With rapid social and technological developments, [topic] has become increasingly relevant." },
                                        { num: 10, title: "General Reality Statement", text: "Today, many people are affected by [topic], making it an important issue to consider." }
                                    ].map((item) => (
                                        <div key={item.num} className="p-6 bg-slate-50 dark:bg-slate-950/20 rounded-[24px] border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary text-white font-black flex items-center justify-center shrink-0">
                                                    {item.num}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
                                                    <p className="font-bold text-primary italic">"{item.text}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 4: Filling the Topic */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Filling the topic</h2>
                                </div>

                                <div className="p-10 bg-slate-50 dark:bg-slate-950/20 rounded-[48px] border border-slate-100 dark:border-slate-800">
                                    <p className="font-bold text-xl text-slate-700 dark:text-slate-300 mb-6 italic">
                                        Today, many people are affected by [topic], making it an important issue to consider.
                                    </p>
                                    <p className="font-black text-lg mb-4">Filling the topic</p>

                                    <div className="p-8 bg-blue-900 dark:bg-blue-950 rounded-[32px] border-2 border-blue-700 dark:border-blue-800">
                                        <h3 className="text-2xl font-black mb-6 text-blue-300 text-center">Golden Rule for Students</h3>
                                        <p className="font-bold text-blue-200 mb-4">Do not copy the question.</p>
                                        <p className="font-bold text-blue-200 mb-4">Change at least:</p>
                                        <ul className="space-y-2 font-bold text-blue-100">
                                            <li>• Sentence structure</li>
                                            <li>• One or two keywords</li>
                                        </ul>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black">Replace Key Words with Synonyms</h3>
                                <p className="text-lg font-bold text-slate-600 dark:text-slate-400">Teach students common replacements:</p>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800">
                                        <div className="p-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs">
                                            Basic → Better Options
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-950">
                                                    <th className="p-4 font-black text-sm">Original</th>
                                                    <th className="p-4 font-black text-sm">Paraphrase</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-bold">
                                                {[
                                                    ["people", "individuals / many people / society"],
                                                    ["big problem", "major issue"],
                                                    ["important", "significant / crucial"],
                                                    ["changing", "transforming / evolving"],
                                                    ["more common", "increasingly popular"],
                                                    ["big", "large"],
                                                    ["very big", "significant"],
                                                    ["small", "minimal"],
                                                    ["very small", "negligible"],
                                                    ["help", "assist"],
                                                    ["help people", "support individuals"],
                                                    ["make better", "improve"],
                                                    ["make easier", "simplify"],
                                                    ["make possible", "enable"]
                                                ].map(([orig, para], i) => (
                                                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                                                        <td className="p-4 text-slate-500">{orig}</td>
                                                        <td className="p-4 text-primary">{para}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800">
                                            <div className="p-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs">
                                                Lifestyle & Society
                                            </div>
                                            <table className="w-full">
                                                <tbody className="font-bold">
                                                    {[
                                                        ["our life", "people's daily lives"],
                                                        ["society", "modern society"],
                                                        ["way of life", "lifestyle"],
                                                        ["living standard", "quality of life"]
                                                    ].map(([orig, para], i) => (
                                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                                                            <td className="p-4 text-slate-500">{orig}</td>
                                                            <td className="p-4 text-primary">{para}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800">
                                            <div className="p-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs">
                                                Technology
                                            </div>
                                            <table className="w-full">
                                                <tbody className="font-bold">
                                                    {[
                                                        ["new technology", "advanced technology"],
                                                        ["using technology", "the use of technology"],
                                                        ["technology growing", "rapid technological development"],
                                                        ["online use", "digital platforms"]
                                                    ].map(([orig, para], i) => (
                                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                                                            <td className="p-4 text-slate-500">{orig}</td>
                                                            <td className="p-4 text-primary">{para}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Example Section */}
                                <div className="mt-12 p-10 bg-blue-50 dark:bg-blue-950/10 rounded-[48px] border-2 border-blue-100 dark:border-blue-900/20">
                                    <h3 className="text-2xl font-black mb-6 text-blue-900 dark:text-blue-200">Identify the Core Topic</h3>
                                    <div className="mb-6">
                                        <p className="font-black text-lg mb-2 text-blue-800 dark:text-blue-300">Question:</p>
                                        <p className="font-bold text-blue-700 dark:text-blue-400">People who are famous entertainers or sportspeople should give up the right to privacy as this is the price of fame.</p>
                                    </div>
                                    <div className="mb-6">
                                        <p className="font-black text-lg mb-2 text-blue-800 dark:text-blue-300">Core ideas:</p>
                                        <ul className="space-y-2 font-bold text-blue-700 dark:text-blue-400">
                                            <li>• Famous people / celebrities / athletes</li>
                                            <li>• Privacy</li>
                                            <li>• Fame</li>
                                            <li>• Public attention</li>
                                        </ul>
                                    </div>
                                    <p className="font-bold text-blue-600 dark:text-blue-400 italic">These words are important you need to use them in the essay body as well</p>
                                </div>

                                <div className="p-10 bg-slate-50 dark:bg-slate-950/20 rounded-[48px] border border-slate-100 dark:border-slate-800">
                                    <p className="font-bold text-slate-600 dark:text-slate-400 mb-4">There is an ongoing debate about whether [rephrased statement].</p>
                                    <p className="font-black text-lg text-slate-900 dark:text-white mb-2">Fill:</p>
                                    <p className="font-bold text-primary text-xl italic">There is an ongoing debate about whether famous entertainers and sportspeople should sacrifice their privacy as a consequence of their popularity.</p>
                                </div>
                            </section>

                            {/* MY WAY - Universal Background Formula */}
                            <section className="space-y-10">
                                <div className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary dark:to-primary-600 rounded-[64px] text-white shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Star className="h-12 w-12 text-yellow-300" />
                                        <h2 className="text-4xl font-black m-0 text-white">MY WAY – Universal Background Formula</h2>
                                    </div>
                                    <div className="p-8 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20">
                                        <p className="text-3xl font-black italic leading-relaxed text-white">
                                            "In modern society, the issue of <span className="text-yellow-300 underline">[issue]</span> <span className="text-pink-300 underline decoration-4">for / in / on</span> <span className="text-yellow-300 underline">[who/what]</span> has become widely discussed."
                                        </p>
                                    </div>
                                </div>

                                {/* Examples */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    {[
                                        {
                                            question: "Online education is replacing traditional classroom learning. Do you agree or disagree?",
                                            identify: "Who/What? → students / education system\nIssue → online education replacing traditional learning",
                                            background: "In modern society, the issue of online education replacing traditional classroom learning has become widely discussed."
                                        },
                                        {
                                            question: "What are the advantages and disadvantages of working from home?",
                                            identify: "Who? → employees / workers\nIssue → working from home",
                                            background: "In modern society, the issue of remote work for employees has become widely discussed."
                                        },
                                        {
                                            question: "Traffic congestion is increasing in major cities. What problems does it cause and how can it be solved?",
                                            identify: "Who/What? → major cities / urban residents\nIssue → traffic congestion",
                                            background: "In modern society, the issue of traffic congestion in major cities has become widely discussed."
                                        },
                                        {
                                            question: "Some people think social media connects people, while others believe it creates isolation. Discuss both views.",
                                            identify: "Who? → individuals / society\nIssue → impact of social media",
                                            background: "In modern society, the issue of the impact of social media on individuals has become widely discussed."
                                        }
                                    ].map((example, i) => (
                                        <div key={i} className="p-8 bg-slate-50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                            <p className="font-black text-sm text-slate-500 uppercase mb-2">Question</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300 mb-4">{example.question}</p>
                                            <p className="font-black text-sm text-slate-500 uppercase mb-2">Step 1: Identify</p>
                                            <p className="font-bold text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-line">{example.identify}</p>
                                            <p className="font-black text-sm text-slate-500 uppercase mb-2">Background Statement</p>
                                            <p className="font-bold text-primary text-lg italic">{example.background}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Smart Labs Rule: Choosing the Right Preposition */}
                                <div className="mt-12 p-12 bg-primary rounded-[48px] text-white">
                                    <h3 className="text-3xl font-black mb-8">Smart Labs Rule: Choosing the Right Preposition</h3>
                                    <div className="p-6 bg-white/10 rounded-[24px] mb-8">
                                        <p className="text-2xl font-bold italic">Base structure</p>
                                        <p className="text-3xl font-black mt-4">In modern society, the issue of [issue] <span className="text-yellow-300">for / in / on</span> [who/what] has become widely discussed.</p>
                                    </div>

                                    <div className="space-y-8">
                                        {/* FOR */}
                                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/20">
                                            <h4 className="text-2xl font-black mb-4 text-yellow-300">1) Use FOR → when talking about people affected</h4>
                                            <p className="font-bold mb-4">Use for when the issue impacts a group of people.</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Pattern</p>
                                            <p className="font-bold mb-4 text-lg">issue of [issue] for [people]</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Examples</p>
                                            <ul className="space-y-2 font-bold">
                                                <li>• the issue of privacy for celebrities</li>
                                                <li>• the issue of remote work for employees</li>
                                                <li>• the issue of mental health for students</li>
                                            </ul>
                                            <div className="mt-4 p-4 bg-yellow-300/20 rounded-2xl">
                                                <p className="font-black">Teaching tip: FOR = impact on people directly</p>
                                            </div>
                                        </div>

                                        {/* IN */}
                                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/20">
                                            <h4 className="text-2xl font-black mb-4 text-green-300">2) Use IN → when talking about places, systems, or environments</h4>
                                            <p className="font-bold mb-4">Use in when the issue exists within a system, area, or location.</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Pattern</p>
                                            <p className="font-bold mb-4 text-lg">issue of [issue] in [place/system]</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Examples</p>
                                            <ul className="space-y-2 font-bold">
                                                <li>• traffic congestion in major cities</li>
                                                <li>• technology use in education</li>
                                                <li>• pollution in urban areas</li>
                                                <li>• competition in the job market</li>
                                            </ul>
                                            <div className="mt-4 p-4 bg-green-300/20 rounded-2xl">
                                                <p className="font-black">Teaching tip: IN = inside a place or system</p>
                                            </div>
                                        </div>

                                        {/* ON */}
                                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/20">
                                            <h4 className="text-2xl font-black mb-4 text-blue-300">3) Use ON → when talking about effects or influence</h4>
                                            <p className="font-bold mb-4">Use on when the issue affects something.</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Pattern</p>
                                            <p className="font-bold mb-4 text-lg">issue of the impact/effect of [something] on [who/what]</p>
                                            <p className="font-black text-sm mb-2 opacity-70">Examples</p>
                                            <ul className="space-y-2 font-bold">
                                                <li>• the impact of social media on individuals</li>
                                                <li>• the effect of technology on society</li>
                                                <li>• the influence of advertising on children</li>
                                            </ul>
                                            <div className="mt-4 p-4 bg-blue-300/20 rounded-2xl">
                                                <p className="font-black">Teaching tip: ON = effect or influence</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-[24px] border-2 border-yellow-400/40">
                                        <p className="font-black text-xl mb-4">Simple Memory Trick for Students</p>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="font-black text-2xl text-yellow-300">FOR</p>
                                                <p className="font-bold">people affected</p>
                                            </div>
                                            <div>
                                                <p className="font-black text-2xl text-green-300">IN</p>
                                                <p className="font-bold">place/system</p>
                                            </div>
                                            <div>
                                                <p className="font-black text-2xl text-blue-300">ON</p>
                                                <p className="font-bold">impact/effect</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Second Sentence (Thesis) */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <TrendingUp className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Now lets go for second sentence</h2>
                                </div>

                                <div className="p-10 bg-slate-900 dark:bg-slate-950 rounded-[48px] text-white">
                                    <h3 className="text-3xl font-black mb-8 text-white">Simple Memory Trick for Students</h3>
                                    <ul className="space-y-3 font-bold text-xl">
                                        <li>• <span className="text-yellow-300 font-black">FOR</span> → people affected</li>
                                        <li>• <span className="text-green-300 font-black">IN</span> → place/system</li>
                                        <li>• <span className="text-blue-300 font-black">ON</span> → impact/effect</li>
                                    </ul>
                                </div>

                                <div className="p-10 bg-orange-50 dark:bg-orange-950/10 rounded-[48px] border-2 border-orange-200 dark:border-orange-900/30">
                                    <h3 className="text-2xl font-black mb-6 text-orange-900 dark:text-orange-200">Now lets go for second sentence</h3>
                                    <div className="p-6 bg-orange-500 rounded-[24px] text-white mb-6">
                                        <p className="font-bold text-lg mb-2">Background sentence = introduce the issue</p>
                                        <p className="font-bold text-lg">Thesis statement = tell the examiner what you will discuss</p>
                                    </div>
                                    <p className="font-bold text-lg text-slate-700 dark:text-slate-300 italic">
                                        In my opinion, this trend is [positive/negative] as it results in [reason 1] and [reason 2].
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {/* Agree/Disagree */}
                                    <div className="p-8 bg-slate-50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">Agree / Disagree Essay</h3>
                                        <p className="font-bold text-primary text-lg italic">"In my opinion, this trend is [positive/negative] as it results in [reason 1] and [reason 2]."</p>
                                    </div>

                                    {/* Advantages/Disadvantages */}
                                    <div className="p-8 bg-blue-50 dark:bg-blue-950/10 rounded-[32px] border border-blue-100 dark:border-blue-900/20">
                                        <h3 className="text-2xl font-black mb-4 text-blue-900 dark:text-blue-200">Advantages / Disadvantages Essay</h3>
                                        <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">Template:</p>
                                        <p className="font-bold text-blue-700 dark:text-blue-400 mb-4">"This essay will discuss the advantages, such as flexibility and reduced travel time, as well as the disadvantages, including social isolation and communication challenges."</p>
                                        <p className="font-black text-sm mb-2">If question asks: Do advantages outweigh disadvantages?</p>
                                        <p className="font-bold text-primary text-lg italic">"Although this trend has certain drawbacks, I believe its benefits, such as [advantage 1] and [advantage 2], outweigh the disadvantages."</p>
                                    </div>

                                    {/* Problem-Solution */}
                                    <div className="p-8 bg-emerald-50 dark:bg-emerald-950/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20">
                                        <h3 className="text-2xl font-black mb-4 text-emerald-900 dark:text-emerald-200">Problem – Solution Essay</h3>
                                        <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Template:</p>
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-4">"This essay will examine the major problems, including [problem 1] and [problem 2], and suggest effective solutions such as [solution 1] and [solution 2]."</p>
                                        <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Example:</p>
                                        <p className="font-bold text-primary text-lg italic">"This essay will examine the major problems, including traffic delays and air pollution, and suggest effective solutions such as improved public transport and stricter regulations."</p>
                                    </div>

                                    {/* Discussion */}
                                    <div className="p-8 bg-purple-50 dark:bg-purple-950/10 rounded-[32px] border border-purple-100 dark:border-purple-900/20">
                                        <h3 className="text-2xl font-black mb-4 text-purple-900 dark:text-purple-200">Discussion (Two Views)</h3>
                                        <p className="font-bold text-purple-800 dark:text-purple-300 mb-2">Template:</p>
                                        <p className="font-bold text-purple-700 dark:text-purple-400 mb-4">"This essay will discuss both perspectives before presenting my opinion that [your opinion]."</p>
                                        <p className="font-bold text-purple-800 dark:text-purple-300 mb-2">Example:</p>
                                        <p className="font-bold text-primary text-lg italic">"This essay will discuss both perspectives before presenting my opinion that technology brings more benefits than drawbacks."</p>
                                    </div>
                                </div>
                            </section>

                            {/* HARD PART - Hybrid Essays */}
                            <section className="space-y-10">
                                <div className="p-12 bg-red-50 dark:bg-red-950/10 rounded-[64px] border-4 border-red-200 dark:border-red-900/30">
                                    <div className="flex items-center gap-4 mb-8">
                                        <AlertTriangle className="text-red-500 h-12 w-12" />
                                        <h2 className="text-4xl font-black m-0 text-red-900 dark:text-red-200">HARD PART NOW IN PTE ESSAY</h2>
                                    </div>

                                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px] mb-8">
                                        <p className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-6">Unemployment among young people is a serious problem. One suggested solution is to shorten the working week. What do you think are the advantages and disadvantages? Do you think this policy should apply to just young workers or the whole workforce?</p>

                                        <h3 className="text-2xl font-black mb-4">WHAT IS THIS TYPE NOW?</h3>

                                        <div className="space-y-6">
                                            <div>
                                                <p className="font-black text-lg mb-4">Look for Question Signals</p>
                                                <p className="font-bold text-slate-600 dark:text-slate-400 mb-4">We can see two tasks:</p>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
                                                        <p className="font-black text-sm text-blue-600 mb-2">Task 1</p>
                                                        <p className="font-bold text-blue-800 dark:text-blue-300">Advantages and disadvantages → Pros & Cons</p>
                                                    </div>
                                                    <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-2xl">
                                                        <p className="font-black text-sm text-purple-600 mb-2">Task 2</p>
                                                        <p className="font-bold text-purple-800 dark:text-purple-300">Your opinion → Young workers only OR whole workforce</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-primary/5 rounded-[24px] border-2 border-dashed border-primary/20">
                                                <p className="font-black text-lg mb-2">Final Answer: Essay Type</p>
                                                <p className="font-black text-2xl text-primary mb-4">Advantages & Disadvantages + Opinion Essay</p>
                                                <p className="font-bold text-slate-600 dark:text-slate-400 italic">(Also called: Double-question / Hybrid essay)</p>
                                            </div>

                                            <div className="p-8 bg-slate-900 dark:bg-primary rounded-[32px] text-white">
                                                <p className="font-bold text-lg italic">This essay will discuss the advantages of Shorting the work-weeks, such as [advantage 1] and [advantage 2], as well as the disadvantages, including [disadvantage 1] and [disadvantage 2], before explaining why this policy should apply to [young workers only / the entire workforce].</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* What is a Hybrid Essay */}
                                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px]">
                                        <h3 className="text-3xl font-black mb-6">What is a Hybrid Essay?</h3>
                                        <p className="font-bold text-lg mb-4">A Hybrid essay asks:</p>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl mb-6">
                                            <p className="font-bold text-xl">Discuss advantages/disadvantages OR problems/causes,<br /><span className="text-primary">AND</span><br />Give your opinion / choice / recommendation</p>
                                        </div>
                                        <p className="font-black mb-4">Examples:</p>
                                        <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
                                            <li>• Advantages & disadvantages + Do you agree?</li>
                                            <li>• Problems + Which solution is better?</li>
                                            <li>• Two views + Which should be preferred?</li>
                                        </ul>
                                    </div>

                                    {/* Smart Labs Universal Hybrid Template */}
                                    <div className="p-10 bg-gradient-to-br from-primary to-primary-600 rounded-[48px] text-white">
                                        <h3 className="text-3xl font-black mb-6">Smart Labs Universal Hybrid Template</h3>
                                        <p className="font-bold text-lg mb-6">This template works for:</p>
                                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                                            <div className="p-4 bg-white/10 rounded-2xl text-center font-black">Advantages + opinion</div>
                                            <div className="p-4 bg-white/10 rounded-2xl text-center font-black">Problems + opinion</div>
                                            <div className="p-4 bg-white/10 rounded-2xl text-center font-black">Two views + opinion</div>
                                        </div>
                                        <p className="font-bold mb-6 italic">Students just fill the blanks.</p>

                                        <div className="space-y-6">
                                            <div className="p-6 bg-white/10 rounded-[24px]">
                                                <p className="font-black mb-2">1. Background Sentence (Your standard system)</p>
                                                <p className="font-bold text-xl italic">In modern society, the issue of [main issue] for/in/on [who/what] has become widely discussed.</p>
                                            </div>

                                            <div className="p-6 bg-white/10 rounded-[24px]">
                                                <p className="font-black mb-4">2. Universal Hybrid Thesis Statement</p>
                                                <p className="font-bold text-sm mb-2 opacity-70">Template</p>
                                                <p className="font-bold text-xl italic mb-6">This essay will examine the [positive side / first aspect], such as [point 1] and [point 2], as well as the [negative side / second aspect], including [point 3] and [point 4], before explaining why [your final opinion/choice].</p>

                                                <p className="font-black mb-4">How Students Choose Words</p>
                                                <div className="overflow-hidden rounded-2xl border border-white/20">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-white/5">
                                                                <th className="p-4 font-black text-sm">Essay Type</th>
                                                                <th className="p-4 font-black text-sm">Fill this way</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="font-bold">
                                                            <tr className="border-t border-white/10">
                                                                <td className="p-4">Advantages & Disadvantages + opinion</td>
                                                                <td className="p-4 text-yellow-300">advantages / disadvantages</td>
                                                            </tr>
                                                            <tr className="border-t border-white/10">
                                                                <td className="p-4">Problems + opinion</td>
                                                                <td className="p-4 text-yellow-300">problems / possible solutions</td>
                                                            </tr>
                                                            <tr className="border-t border-white/10">
                                                                <td className="p-4">Two views + opinion</td>
                                                                <td className="p-4 text-yellow-300">first view / second view</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Examples */}
                                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                                        {[
                                            {
                                                title: "Example 1 – Advantages & Disadvantages + Opinion",
                                                topic: "Shorter working week",
                                                text: "This essay will examine the advantages, such as increased job opportunities and improved work-life balance, as well as the disadvantages, including reduced productivity and higher operational costs, before explaining why this policy should apply to the entire workforce."
                                            },
                                            {
                                                title: "Example 2 – Problems + Opinion",
                                                topic: "Traffic congestion",
                                                text: "This essay will examine the major problems, such as long commuting hours and air pollution, as well as possible solutions, including improved public transport and stricter traffic regulations, before explaining why public transportation expansion is the most effective approach."
                                            },
                                            {
                                                title: "Example 3 – Two Views + Opinion",
                                                topic: "Online vs classroom learning",
                                                text: "This essay will examine the benefits of online learning, such as flexibility and accessibility, as well as the advantages of traditional classrooms, including direct interaction and structured learning, before explaining why a blended approach is more effective."
                                            }
                                        ].map((ex, i) => (
                                            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[24px]">
                                                <p className="font-black text-sm text-slate-500 mb-2">{ex.title}</p>
                                                <p className="font-black text-lg mb-4 text-primary">Topic: {ex.topic}</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300 italic">{ex.text}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-6 bg-green-500 rounded-[24px] text-white text-center">
                                        <p className="font-black text-2xl">NICE NOW YOU CAN WRITE YOUR INTRODUCTION</p>
                                    </div>
                                </div>
                            </section>

                            {/* Body Paragraph Section */}
                            <section className="space-y-10">
                                <div className="p-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[64px] text-white text-center shadow-2xl">
                                    <h2 className="text-5xl font-black mb-4">LETS LEARN PROPERLY OUR ESSAY BODY NOW</h2>
                                </div>

                                {/* Agree-Disagree Strategy */}
                                <div className="p-10 bg-slate-50 dark:bg-slate-950/20 rounded-[48px] border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-3xl font-black mb-6">For Agree–Disagree essays in PTE:</h3>
                                    <div className="p-6 bg-primary/10 rounded-[24px] mb-6">
                                        <p className="font-black text-xl text-primary">Strongly choose ONE side and support it with two clear reasons.<br />Do not discuss both sides.</p>
                                    </div>
                                    <p className="font-bold text-lg mb-4">This is a good strategy for PTE.</p>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="font-black text-lg mb-4">PTE rewards:</p>
                                            <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
                                                <li>• Clear ideas</li>
                                                <li>• Fewer errors</li>
                                                <li>• Strong coherence</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-black text-lg mb-4">When students choose one side:</p>
                                            <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
                                                <li>• Body 1 → Reason 1 (why you agree)</li>
                                                <li>• Body 2 → Reason 2 (why you agree)</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-[24px]">
                                        <p className="font-black text-lg mb-2">The essay becomes:</p>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-4 bg-emerald-500 text-white rounded-2xl font-black">Logical</div>
                                            <div className="p-4 bg-emerald-500 text-white rounded-2xl font-black">Consistent</div>
                                            <div className="p-4 bg-emerald-500 text-white rounded-2xl font-black">Easy to follow</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-6 bg-red-50 dark:bg-red-950/20 rounded-[24px]">
                                        <p className="font-black text-lg mb-2">If they write both sides:</p>
                                        <ul className="space-y-2 font-bold text-red-700 dark:text-red-400">
                                            <li>• It becomes balanced but weak</li>
                                            <li>• No clear position</li>
                                            <li>• Ideas become shallow</li>
                                        </ul>
                                    </div>

                                    <div className="mt-8 p-6 bg-blue-500 text-white rounded-[24px]">
                                        <p className="font-black text-xl mb-4">PTE Does NOT Require Balance</p>
                                        <p className="font-bold mb-2">Unlike IELTS (where "discuss both sides" may be required), PTE only checks:</p>
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            <div className="p-3 bg-white/20 rounded-xl font-black text-center">Content relevance</div>
                                            <div className="p-3 bg-white/20 rounded-xl font-black text-center">Structure</div>
                                            <div className="p-3 bg-white/20 rounded-xl font-black text-center">Language quality</div>
                                        </div>
                                        <p className="font-black text-lg mt-4 text-center">A strong opinion essay scores well.</p>
                                    </div>
                                </div>

                                {/* Smart Labs Body Paragraph Guide */}
                                <div className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary dark:to-primary-600 rounded-[64px] text-white shadow-2xl">
                                    <h3 className="text-4xl font-black mb-8">Smart Labs Body Paragraph Guide (5-Sentence System)</h3>

                                    <div className="p-8 bg-white/10 rounded-[32px] mb-8">
                                        <p className="font-black text-2xl mb-6">What Students Must Do</p>
                                        <p className="font-bold text-lg mb-4">Tell students:</p>
                                        <p className="font-bold mb-4">Every body paragraph should include:</p>
                                        <ul className="space-y-2 font-bold text-lg mb-6">
                                            <li>• General topic + main factor</li>
                                            <li>• Explanation (what happens next)</li>
                                            <li>• FOLLOWUP</li>
                                            <li>• Example</li>
                                            <li>• Final result / impact</li>
                                        </ul>
                                        <p className="font-bold mb-2">And the paragraph should:</p>
                                        <ul className="space-y-2 font-bold">
                                            <li>• Have 5 sentences</li>
                                            <li>• Include compound or complex sentences</li>
                                            <li>• Show coherence and logical flow</li>
                                        </ul>
                                    </div>

                                    <div className="p-10 bg-white/10 rounded-[48px] border-2 border-white/20">
                                        <h4 className="text-3xl font-black mb-8 text-yellow-300">Smart Labs Body Paragraph (80–90 Words | 5 Sentences)</h4>
                                        <p className="font-black text-xl mb-6">Structure</p>

                                        <div className="space-y-6">
                                            {[
                                                { num: 1, title: "Topic + Main Factor", template: "One important [reason/advantage/problem/solution] related to [general topic] is that [main idea]." },
                                                { num: 2, title: "Explanation", template: "This is because [cause], which leads to [effect]." },
                                                { num: 3, title: "Further Support (Compound)", template: "Moreover, [additional supporting point], and this makes the situation more effective/serious." },
                                                { num: 4, title: "Example", template: "For example, [real-life or general example]." },
                                                { num: 5, title: "Final Result", template: "As a result, this significantly improves/affects [society/economy/individuals/environment]." }
                                            ].map((sent) => (
                                                <div key={sent.num} className="p-6 bg-white/5 rounded-[24px] border border-white/10">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-yellow-300 text-slate-900 font-black flex items-center justify-center shrink-0 text-xl">
                                                            {sent.num}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-lg mb-2">{sent.title}</p>
                                                            <p className="font-bold text-yellow-100 italic">"{sent.template}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Body Paragraph Examples */}
                                <div className="space-y-8">
                                    <h3 className="text-3xl font-black text-center">Body Paragraph Examples for Different Essay Types</h3>

                                    {[
                                        {
                                            type: "1) Agree–Disagree (Body Paragraph)",
                                            topic: "Online education is beneficial",
                                            text: "One important reason related to online education is that it provides flexibility for learners. This is because students can access study materials at any time, which allows them to manage their schedules efficiently. Moreover, it removes geographical barriers, and this makes learning accessible to a wider population. For example, many working professionals complete online courses without leaving their jobs. As a result, this significantly improves educational opportunities for individuals.",
                                            color: "blue"
                                        },
                                        {
                                            type: "2) Advantages Essay (Body Paragraph)",
                                            topic: "Working from home",
                                            text: "One major advantage related to remote work is that it saves commuting time for employees. This is because workers no longer need to travel long distances, which reduces physical and mental stress. Moreover, it lowers transportation expenses, and this helps employees manage their finances better. For example, many workers start their tasks immediately from home instead of spending hours on the road. As a result, this greatly improves productivity and work-life balance.",
                                            color: "emerald"
                                        },
                                        {
                                            type: "3) Disadvantages Essay (Body Paragraph)",
                                            topic: "Social media overuse",
                                            text: "One significant disadvantage related to excessive social media use is the decline in face-to-face communication. This occurs because people spend more time online, which reduces real-life interactions. Moreover, it can lead to social isolation, and this negatively affects emotional well-being. For example, many young individuals prefer online conversations instead of meeting friends in person. As a result, this creates serious challenges for healthy social development.",
                                            color: "red"
                                        },
                                        {
                                            type: "4) Problem Essay (Body Paragraph)",
                                            topic: "Traffic congestion",
                                            text: "One serious problem related to urban transportation is heavy traffic congestion. This happens because the number of private vehicles continues to increase, which causes long delays during peak hours. Moreover, it increases fuel consumption, and this contributes to environmental pollution. For example, many commuters spend several hours each day stuck in traffic. As a result, this negatively affects productivity and the overall quality of life.",
                                            color: "orange"
                                        },
                                        {
                                            type: "5) Solution Essay (Body Paragraph)",
                                            topic: "Traffic congestion solution",
                                            text: "One effective solution to traffic congestion is the improvement of public transportation systems. This is because reliable buses and trains can reduce the number of private vehicles on the roads, which helps ease traffic flow. Moreover, affordable transport options encourage people to shift from personal cars, and this reduces congestion further. For example, many cities have successfully controlled traffic after expanding metro services. As a result, this improves mobility and reduces environmental damage.",
                                            color: "green"
                                        },
                                        {
                                            type: "6) Discussion (Two Views) – Body Paragraph (View 1)",
                                            topic: "Online vs classroom learning",
                                            text: "One important perspective related to online education is that it offers greater convenience for students. This is because learners can attend classes from any location, which saves both time and effort. Moreover, digital platforms provide access to recorded lessons, and this helps students review difficult topics. For example, many university students prefer online courses due to their flexible schedules. As a result, this method has become increasingly popular in modern education.",
                                            color: "purple"
                                        }
                                    ].map((example, i) => (
                                        <div key={i} className={`p-8 bg-${example.color}-50 dark:bg-${example.color}-950/10 rounded-[32px] border border-${example.color}-100 dark:border-${example.color}-900/20`}>
                                            <h4 className="text-2xl font-black mb-2">{example.type}</h4>
                                            <p className="font-black text-sm text-slate-500 mb-4">Topic example: {example.topic}</p>
                                            <p className="font-bold text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{example.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Conclusion Section */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <Star className="text-primary h-8 w-8" />
                                    <h2 className="text-4xl font-black m-0">Smart Labs Universal Conclusion Template</h2>
                                </div>

                                <div className="p-8 bg-slate-50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black mb-4">General Structure (Fill-in-Blanks)</h3>
                                    <p className="font-bold text-xl text-primary italic">In conclusion, [restated opinion/main idea] due to its significant impact on [society/economy/individuals/environment].</p>
                                </div>

                                <h3 className="text-3xl font-black">How to Use for Different Essay Types</h3>

                                <div className="space-y-6">
                                    {[
                                        {
                                            type: "1) Agree–Disagree",
                                            template: "In conclusion, I strongly believe that [your position] because it plays a crucial role in improving [key area].",
                                            example: "In conclusion, I strongly believe that online education is beneficial because it plays a crucial role in improving learning opportunities for individuals."
                                        },
                                        {
                                            type: "2) Advantages–Disadvantages",
                                            template: "In conclusion, although this trend has certain drawbacks, its benefits, such as [advantage summary], make it overall beneficial.",
                                            example: "In conclusion, although remote work has some challenges, its benefits, such as flexibility and time savings, make it highly advantageous."
                                        },
                                        {
                                            type: "3) Problem–Solution",
                                            template: "In conclusion, addressing [problem] through [solution] is essential to improve [area].",
                                            example: "In conclusion, addressing traffic congestion through improved public transportation is essential to enhance urban mobility and environmental quality."
                                        },
                                        {
                                            type: "4) Discussion (Two Views)",
                                            template: "In conclusion, while both views have merit, I believe that [your opinion] offers greater long-term benefits.",
                                            example: ""
                                        },
                                        {
                                            type: "5) Hybrid Essay",
                                            template: "In conclusion, despite certain challenges, I believe that [your final decision] would provide the most effective long-term benefits.",
                                            example: ""
                                        }
                                    ].map((item, i) => (
                                        <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800">
                                            <h4 className="font-black text-lg mb-3">{item.type}</h4>
                                            <p className="font-bold text-sm text-slate-500 mb-2">Template:</p>
                                            <p className="font-bold text-primary italic mb-4">"{item.template}"</p>
                                            {item.example && (
                                                <>
                                                    <p className="font-bold text-sm text-slate-500 mb-2">Example:</p>
                                                    <p className="font-bold text-slate-700 dark:text-slate-300 italic">"{item.example}"</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Ultra-Universal Conclusion */}
                                <div className="p-12 bg-primary text-white rounded-[48px] text-center space-y-6 shadow-2xl">
                                    <p className="text-sm font-black uppercase tracking-widest opacity-60">Ultra-Universal Conclusion (Works for ANY Essay)</p>
                                    <p className="font-bold text-lg mb-4">Teach this if students want one safe sentence:</p>
                                    <p className="text-3xl md:text-4xl font-black leading-tight italic">
                                        "In conclusion, this issue requires careful consideration, and I believe that the discussed approach will bring positive long-term benefits to society."
                                    </p>
                                    <div className="pt-8">
                                        <p className="font-black text-xl mb-4">Teaching Rules</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-black uppercase tracking-[0.2em]">
                                            <div className="p-4 bg-white/10 rounded-2xl">Write only one sentence</div>
                                            <div className="p-4 bg-white/10 rounded-2xl">Do not add new ideas</div>
                                            <div className="p-4 bg-white/10 rounded-2xl">Restate your opinion clearly</div>
                                        </div>
                                        <p className="mt-4 font-bold">Keep it simple and error-free</p>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Note Footer */}
                        <div className="p-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Strictly for SmartLabs Registered Students • © 2026 Manual v1.0
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}