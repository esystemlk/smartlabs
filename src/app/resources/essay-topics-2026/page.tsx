'use client';

import { motion } from 'framer-motion';
import {
    PenTool,
    BookOpen,
    ChevronLeft,
    Share2,
    Calendar,
    Award,
    FileText,
    Target,
    Sparkles,
    Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';

export default function EssayTopics2026Page() {
    const essays = [
        {
            id: "01",
            title: "Should parents be held legally responsible for the actions of their children?",
            type: "Agree / Disagree Structure – Opinion: Agree",
            color: "slate",
            content: [
                "Parents play a fundamental role in shaping a child's behaviour and moral values during early development. This essay agrees that parents should be held legally responsible for their children's actions, particularly when minors are involved and negligence can be identified.",
                "One major reason for this view is that parents are the primary source of guidance, discipline, and supervision in a child's life. When children engage in antisocial or unlawful behaviour, it is often linked to a lack of parental monitoring or ineffective upbringing. For example, studies on juvenile delinquency frequently show that children who receive little supervision are more likely to engage in harmful activities. As a result, holding parents accountable encourages them to take a more active and responsible role in guiding their children.",
                "Another important reason to support this position is that legal responsibility promotes social responsibility and prevention. If parents are aware that they may face legal consequences, they are more likely to correct problematic behaviour at an early stage. This preventive approach can reduce youth crime and protect society as a whole. Furthermore, such responsibility does not imply total blame but rather shared accountability when parental negligence is evident.",
                "In conclusion, parents should be held legally responsible for their children's actions in a limited and fair manner. This approach strengthens parental involvement and contributes to a safer and more disciplined society."
            ]
        },
        {
            id: "02",
            title: "Universities should only procure digital media rather than update textbooks.",
            type: "Discussion + Opinion",
            color: "blue",
            content: [
                "With the rapid growth of online digital resources, many people believe that traditional libraries have become outdated. This essay discusses the advantages and disadvantages of relying solely on digital media and argues that a balanced approach is more effective.",
                "On the one hand, digital media offers clear advantages for universities and students. Online resources are easily accessible, regularly updated, and cost-efficient over time. Students can access journals, e-books, and research materials from any location, which supports flexible learning and independent study. In addition, digital content reduces the need for physical storage and maintenance, making it environmentally friendly.",
                "On the other hand, physical libraries and textbooks still serve an important academic purpose. Many learners find printed materials more effective for concentration and long-term retention of information. Libraries also provide a quiet and structured environment that promotes focused learning. Moreover, not all students have equal access to digital devices or stable internet connections, which makes printed resources essential for educational equality.",
                "In conclusion, although digital media has transformed higher education, libraries have not become obsolete. Universities should invest in both digital resources and updated textbooks to ensure effective and inclusive learning."
            ]
        },
        {
            id: "03",
            title: "Global problems are related to governments and international organizations. What are the problems and what is your solution?",
            type: "Problem–Solution Structure",
            color: "emerald",
            content: [
                "In today's interconnected world, many serious global issues are closely linked to the actions of governments and international organisations. This essay outlines the major global problems and suggests effective solutions to address them.",
                "One of the most serious global problems is climate change, which has worsened due to weak government policies and poor international coordination. Many governments prioritise economic development over environmental protection, while international agreements are often ignored or poorly enforced. In addition, global inequality remains a pressing issue, as developing countries suffer from limited access to education, healthcare, and economic opportunities due to inadequate global support systems.",
                "To tackle these challenges, stronger cooperation between governments and international organisations is essential. Governments should implement strict environmental regulations and commit to binding international agreements. At the same time, international bodies should provide financial aid, technological support, and policy guidance to less developed nations. By strengthening accountability and collaboration, long-term global stability can be achieved.",
                "In conclusion, global problems largely arise from ineffective governance and weak international coordination. Through unified efforts and practical global policies, governments and international organisations can successfully overcome these challenges."
            ]
        },
        {
            id: "04",
            title: "Some people argue that experience is the best teacher. How far do you agree?",
            type: "Agree / Disagree Structure – Opinion: Agree",
            color: "amber",
            content: [
                "Many people believe that true learning occurs outside classrooms through real-life situations. This essay strongly agrees that life experience teaches people more effectively than books or formal education.",
                "One key reason for this view is that experience provides practical knowledge that cannot be fully gained from textbooks. When individuals face real challenges, they learn how to make decisions, solve problems, and adapt to unexpected situations. For example, a person entering the workplace often learns more about communication, responsibility, and time management through daily tasks than through academic theory. As a result, experiential learning tends to be deeper and more memorable.",
                "Another important reason is that life experiences help people develop emotional intelligence and resilience. Situations such as failure, success, or personal responsibility teach valuable lessons about patience and self-discipline. These qualities are difficult to acquire through formal education alone, as they require direct involvement and reflection. Consequently, experience shapes character and behaviour in a more lasting way.",
                "In conclusion, while formal education provides essential theoretical knowledge, life experience plays a more significant role in meaningful learning. Therefore, experience can be considered the most effective teacher in preparing individuals for real-world challenges."
            ]
        },
        {
            id: "05",
            title: "Scientists believe that the increasing average temperature is an issue. What caused global warming and what solutions can reduce its effects?",
            type: "Cause–Solution Structure",
            color: "rose",
            content: [
                "In recent decades, the steady rise in global temperatures has become a serious concern worldwide. This essay explains the main causes of global warming and presents effective solutions to reduce its impact.",
                "One primary cause of global warming is excessive greenhouse gas emissions resulting from human activities. The burning of fossil fuels for electricity, transport, and industrial production releases large amounts of carbon dioxide into the atmosphere. In addition, deforestation significantly contributes to the problem, as trees that absorb carbon dioxide are removed for urban development and agriculture. As a result, heat is trapped in the atmosphere, leading to rising global temperatures.",
                "To reduce the effects of global warming, governments and individuals must adopt sustainable practices. Governments should invest in renewable energy sources such as solar and wind power while enforcing strict environmental regulations. At the same time, individuals can contribute by reducing energy consumption, using public transport, and supporting reforestation programmes. Through combined efforts at both national and individual levels, the impact of global warming can be effectively minimised.",
                "In conclusion, global warming is largely caused by human actions that disrupt natural environmental balance. By implementing sustainable policies and promoting environmental awareness, its harmful effects can be reduced for future generations."
            ]
        },
        {
            id: "06",
            title: "Should marketing focus on company reputation or short-term strategies such as discounts?",
            type: "Agree / Disagree Structure – Opinion: Reputation",
            color: "purple",
            content: [
                "In competitive consumer markets, companies often debate whether to prioritise long-term brand reputation or short-term promotional strategies. This essay argues that marketing should place greater emphasis on building a strong company reputation rather than relying on temporary discounts.",
                "One main reason for supporting this view is that a positive reputation builds long-term customer trust and loyalty. When consumers associate a brand with quality, reliability, and ethical practices, they are more likely to make repeat purchases regardless of price fluctuations. For example, well-known clothing and food brands often retain customers even without frequent discounts because buyers trust their products. As a result, reputation-based marketing ensures stable revenue and sustained growth.",
                "Another important reason is that excessive reliance on discounts can reduce perceived product value. Constant promotions may encourage customers to focus only on price rather than quality, which can harm brand image over time. In contrast, companies that highlight their values, quality standards, and customer satisfaction create a strong emotional connection with consumers. Consequently, reputation-driven marketing offers a more sustainable competitive advantage.",
                "In conclusion, although short-term offers may temporarily boost sales, they are not effective in the long run. Therefore, companies producing consumer goods should prioritise building a strong reputation to achieve lasting success."
            ]
        },
        {
            id: "07",
            title: "Television serves many useful functions. To what extent do you agree?",
            type: "Agree / Disagree Structure – Opinion: Agree",
            color: "cyan",
            content: [
                "Television continues to play an important role in modern society by influencing daily life in various ways. This essay strongly agrees that television helps people relax, learn new information, and provides companionship, especially for those who feel lonely.",
                "One key reason for this view is that television is an effective source of relaxation and entertainment. After a long day of work or study, watching programmes such as dramas, movies, or sports helps people reduce stress and refresh their minds. From my own experience, watching educational documentaries or light entertainment in the evening helps me unwind and regain mental balance. As a result, television contributes positively to emotional well-being.",
                "Another important reason is that television serves as a valuable learning tool and a source of companionship. News channels, documentaries, and educational programmes improve general knowledge and awareness of global events. At the same time, for elderly people or those living alone, television offers a sense of presence and comfort. Consequently, television fulfils both educational and social needs.",
                "In conclusion, television is more than just a source of entertainment. It plays a meaningful role in relaxation, learning, and emotional support, making it a valuable part of everyday life."
            ]
        },
        {
            id: "08",
            title: "Unemployment among young people is a serious problem. Shortening the working week has been suggested as a solution.",
            type: "Advantages–Disadvantages + Opinion",
            color: "indigo",
            content: [
                "Youth unemployment has become a major social and economic concern in many countries. This essay discusses the advantages and disadvantages of shortening the working week and argues that this policy should apply to the entire workforce rather than only young workers.",
                "One clear advantage of reducing working hours is that it can create more job opportunities for young people. When existing employees work fewer hours, companies may need to hire additional staff to maintain productivity. As a result, young workers can gain access to employment, work experience, and financial independence. Moreover, a shorter working week can improve work–life balance and reduce stress levels among employees.",
                "However, this policy also has notable disadvantages. Shortening the working week may increase operational costs for employers, especially if they are required to hire more workers. In addition, reduced working hours could lead to lower income for employees and decreased overall productivity. Regarding implementation, applying this policy only to young workers may cause inequality and workplace dissatisfaction. Therefore, if introduced, it should be applied to the entire workforce to ensure fairness and effectiveness.",
                "In conclusion, although shortening the working week offers potential benefits in reducing youth unemployment, it also presents economic challenges. Overall, a workforce-wide approach would be more practical and equitable."
            ]
        },
        {
            id: "09",
            title: "Artificial intelligence can translate foreign languages, making language learning unnecessary. To what extent do you agree?",
            type: "Agree / Disagree Structure – Opinion: Disagree",
            color: "teal",
            content: [
                "With rapid advancements in artificial intelligence, computer-based translation has become widely available. This essay strongly disagrees with the idea that learning a foreign language is unnecessary despite the development of translation technology.",
                "One main reason for this view is that language learning involves more than simple word-for-word translation. Understanding a foreign language allows individuals to grasp cultural meanings, emotions, and social context, which machines often fail to interpret accurately. For example, idioms, humour, and tone are frequently mistranslated by computers, leading to misunderstandings. As a result, human language skills remain essential for effective communication.",
                "Another important reason is that relying solely on translation technology can limit personal and professional development. Learning a foreign language improves cognitive ability, memory, and problem-solving skills. In addition, many employers value multilingual individuals, especially in international business and education. Consequently, language proficiency provides long-term benefits that technology alone cannot replace.",
                "In conclusion, although artificial intelligence has made translation faster and more convenient, it cannot fully replace the value of learning a foreign language. Therefore, acquiring language skills remains necessary in an increasingly globalised world."
            ]
        },
        {
            id: "10",
            title: "Many countries invest heavily in restoring historic buildings rather than on modern housing. To what extent do you agree or disagree?",
            type: "Advantages–Disadvantages + Opinion",
            color: "orange",
            content: [
                "Governments around the world allocate substantial funds to preserve historical monuments, often prioritising this over modern housing projects. This essay discusses the advantages and disadvantages of this practice and argues that a balanced approach is preferable.",
                "One advantage of restoring historic buildings is the preservation of cultural heritage and tourism potential. Restored monuments attract tourists, generate revenue, and strengthen national identity. For example, cities like Rome and Kyoto have benefited economically and culturally from maintaining their historical sites. Additionally, preserving history can educate citizens and instil pride in local traditions.",
                "However, prioritising historic restoration over modern housing has significant disadvantages. Many people, especially in urban areas, face housing shortages, high rents, and inadequate living conditions. Allocating funds mainly to monuments does not address these social needs. In my own experience living in a city where new apartments are scarce, the lack of affordable housing negatively affects young families and workers. Therefore, investing solely in historic preservation can create social inequality.",
                "In conclusion, while restoring historic buildings has clear cultural and economic benefits, neglecting modern housing needs is a serious drawback. A balanced policy that supports both heritage preservation and housing development would better serve society."
            ]
        }
    ];

    const colorMap: Record<string, { bg: string, badge: string, text: string, border: string }> = {
        slate: { bg: "bg-slate-50 dark:bg-slate-950/40", badge: "bg-slate-900", text: "text-slate-900 dark:text-white", border: "border-slate-100 dark:border-slate-800" },
        blue: { bg: "bg-blue-50/30 dark:bg-blue-950/10", badge: "bg-blue-600", text: "text-blue-600", border: "border-blue-100/50 dark:border-blue-900/20" },
        emerald: { bg: "bg-emerald-50/30 dark:bg-emerald-950/10", badge: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-100/50 dark:border-emerald-900/20" },
        amber: { bg: "bg-amber-50/30 dark:bg-amber-950/10", badge: "bg-amber-600", text: "text-amber-600", border: "border-amber-100/50 dark:border-amber-900/20" },
        rose: { bg: "bg-rose-50/30 dark:bg-rose-950/10", badge: "bg-rose-600", text: "text-rose-600", border: "border-rose-100/50 dark:border-rose-900/20" },
        purple: { bg: "bg-purple-50/30 dark:bg-purple-950/10", badge: "bg-purple-600", text: "text-purple-600", border: "border-purple-100/50 dark:border-purple-900/20" },
        cyan: { bg: "bg-cyan-50/30 dark:bg-cyan-950/10", badge: "bg-cyan-600", text: "text-cyan-600", border: "border-cyan-100/50 dark:border-cyan-900/20" },
        indigo: { bg: "bg-indigo-50/30 dark:bg-indigo-950/10", badge: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-100/50 dark:border-indigo-900/20" },
        teal: { bg: "bg-teal-50/30 dark:bg-teal-950/10", badge: "bg-teal-600", text: "text-teal-600", border: "border-teal-100/50 dark:border-teal-900/20" },
        orange: { bg: "bg-orange-50/30 dark:bg-orange-950/10", badge: "bg-orange-600", text: "text-orange-600", border: "border-orange-100/50 dark:border-orange-900/20" }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#020617] selection:bg-primary/20">
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
                        <div className="flex gap-3">
                            <Button variant="outline" size="icon" className="rounded-xl border-slate-200 dark:border-slate-800">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[48px] shadow-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-10 md:p-16 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                                        RESTRICTED MATERIAL
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Feb 2026
                                    </Badge>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95]">
                                    ESSAY TOPICS & <span className="text-primary italic">PREDICTIONS</span>
                                </h1>
                                <div className="flex items-center gap-4 text-slate-500 font-bold">
                                    <span className="flex items-center gap-2">
                                        <PenTool className="h-4 w-4 text-primary" />
                                        Master Code Cheat Sheet
                                    </span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                    <span>By SmartLabs</span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-10 md:p-16 prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-strong:font-black prose-p:leading-relaxed prose-p:text-lg prose-p:text-slate-600 dark:prose-p:text-slate-400">
                            <p className="italic text-xl text-primary font-bold mb-12">
                                Your Ultimate Guide to Ace PTE Writing with High-Scoring Structures, Linking Phrases, and Ready-to-Fill Templates
                            </p>

                            <div className="space-y-16">
                                {/* All 10 Essays */}
                                {essays.map((essay) => (
                                    <section key={essay.id} className={`relative p-10 ${colorMap[essay.color].bg} rounded-[32px] border ${colorMap[essay.color].border}`}>
                                        <Badge className={`absolute -top-3 left-8 ${colorMap[essay.color].badge} text-white border-none font-black text-[10px] tracking-widest px-3 py-1`}>
                                            ESSAY {essay.id}
                                        </Badge>
                                        <h3 className={`${colorMap[essay.color].text} mt-0`}>{essay.title}</h3>
                                        <p className={`font-bold ${colorMap[essay.color].text} underline decoration-${essay.color}-600/30 decoration-4 underline-offset-4`}>
                                            {essay.type}
                                        </p>
                                        {essay.content.map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                    </section>
                                ))}

                                {/* Universal Templates Section */}
                                <div className="mt-32 pt-16 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-16">
                                        <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                                            <Award size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black m-0 leading-none">Universal PTE Essay Template</h2>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Fill-in Version</p>
                                        </div>
                                    </div>

                                    {/* Template 1: Agree/Disagree */}
                                    <div className="mb-12 p-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[40px]">
                                        <h3 className="text-2xl font-black text-primary mb-8 mt-0">1. Agree / Disagree Essay</h3>
                                        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                            <p className="text-slate-600 dark:text-slate-400 font-bold">Question: <span className="text-slate-400 dark:text-slate-500 italic">[Insert essay question]</span></p>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Introduction (2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Background sentence about the topic]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Thesis sentence: clearly state your opinion – agree/disagree/partly agree]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 1 (Reason / Evidence 1)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: main reason supporting your opinion]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: why this reason is valid]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example: personal experience, observation, or study]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence: result / effect / consequence]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 2 (Reason / Evidence 2)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: another reason supporting your opinion]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: expand on the reason]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example: personal experience, observation, or study]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence: result / effect / consequence]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Conclusion (1–2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Restate your opinion clearly]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Final comment summarising your argument]</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Template 2: Problem-Solution */}
                                    <div className="mb-12 p-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[40px]">
                                        <h3 className="text-2xl font-black text-primary mb-8 mt-0">2. Problem–Solution Essay</h3>
                                        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                            <p className="text-slate-600 dark:text-slate-400 font-bold">Question: <span className="text-slate-400 dark:text-slate-500 italic">[Insert essay question]</span></p>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Introduction (2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Background sentence introducing the problem]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Thesis sentence: indicate you will discuss problems and solutions]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 1 (Problems)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: main problem]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: cause / effect / why it is important]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example or data: optional evidence]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence summarising the problem]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 2 (Solutions)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: main solution / recommendation]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: how it addresses the problem]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example or evidence: optional]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence: positive effect / benefit]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Conclusion (1–2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Summarise problems and solutions]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Final recommendation / call to action]</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Template 3: Advantages-Disadvantages */}
                                    <div className="mb-12 p-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[40px]">
                                        <h3 className="text-2xl font-black text-primary mb-8 mt-0">3. Advantages–Disadvantages Essay</h3>
                                        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                            <p className="text-slate-600 dark:text-slate-400 font-bold">Question: <span className="text-slate-400 dark:text-slate-500 italic">[Insert essay question]</span></p>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Introduction (2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Background sentence about the issue]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Thesis sentence: indicate you will discuss advantages and disadvantages and state opinion if needed]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 1 (Advantages)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: main advantage]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: why it is beneficial]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example / evidence: optional]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence: result / effect]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Body Paragraph 2 (Disadvantages)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Topic sentence: main disadvantage]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Explanation: why it is a concern]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Example / evidence: optional / personal experience]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Link sentence: effect or recommendation]</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4 border-l-4 border-primary pl-4">Conclusion (1–2 sentences)</h4>
                                                <ul className="list-none pl-0 space-y-2">
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[Summarise advantages and disadvantages]</li>
                                                    <li className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">[State final opinion or balanced view]</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Super Condensed Cheat Sheet */}
                                <div className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary dark:to-primary-600 rounded-[64px] text-white my-20 shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Sparkles className="h-10 w-10" />
                                        <h2 className="text-3xl font-black m-0 text-white">PTE Super-Condensed Visual Essay Cheat Sheet</h2>
                                    </div>
                                    <p className="text-white/90 font-bold mb-10">Complex & Compound Sentences for Maximum Scores</p>

                                    <div className="space-y-6">
                                        {/* Agree/Disagree Cheat */}
                                        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                            <h4 className="text-xl font-black mb-6 text-white flex items-center gap-3">
                                                <Lightbulb className="h-6 w-6 text-yellow-300" />
                                                1. Agree / Disagree Essay
                                            </h4>
                                            <div className="mb-4 p-3 bg-white/5 rounded-xl">
                                                <p className="text-white/80 font-bold">Question: <span className="text-white/50">[________________]</span></p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">INTRODUCTION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Background: <span className="text-yellow-300">[In recent years, _______ has become a widely discussed issue, and many people have different views on its impact.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Thesis: <span className="text-yellow-300">[This essay strongly agrees/disagrees that _______ because _______ and _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 1</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Reason: <span className="text-green-300">[One key reason for this is that _______, which often leads to _______ and affects _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-green-300">[For example, _______, which clearly illustrates _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-green-300">[As a result, _______, and therefore _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 2</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Reason: <span className="text-blue-300">[Another important reason is that _______, while also contributing to _______ and impacting _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-blue-300">[For instance, _______, which supports the idea that _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-blue-300">[Consequently, _______, and this indicates that _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">CONCLUSION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm"><span className="text-pink-300">[In conclusion, _______, because _______ and _______. Overall, it is evident that _______, and therefore _______.]</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Problem-Solution Cheat */}
                                        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                            <h4 className="text-xl font-black mb-6 text-white flex items-center gap-3">
                                                <Target className="h-6 w-6 text-orange-300" />
                                                2. Problem–Solution Essay
                                            </h4>
                                            <div className="mb-4 p-3 bg-white/5 rounded-xl">
                                                <p className="text-white/80 font-bold">Question: <span className="text-white/50">[________________]</span></p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">INTRODUCTION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Background: <span className="text-yellow-300">[In today's world, _______ has become a serious concern, and it affects _______ in many ways.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Thesis: <span className="text-yellow-300">[This essay will discuss the main problems of _______ and propose solutions that can address _______ effectively.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 1 – PROBLEMS</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Problem: <span className="text-red-300">[The primary problem is that _______, which often results in _______ and creates _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-red-300">[For example, _______, which clearly shows _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-red-300">[As a result, _______, and therefore _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 2 – SOLUTIONS</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Solution: <span className="text-green-300">[To tackle this issue, _______ should be implemented, as it can _______ and help _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-green-300">[For instance, _______, which demonstrates that _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-green-300">[Consequently, _______, and this will contribute to _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">CONCLUSION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl">
                                                        <p className="text-white/90 font-mono text-sm"><span className="text-pink-300">[In conclusion, the problems of _______ can be mitigated by _______, which will reduce _______ and improve _______. It is therefore essential that _______, because _______ and _______.]</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Advantages-Disadvantages Cheat */}
                                        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                            <h4 className="text-xl font-black mb-6 text-white flex items-center gap-3">
                                                <Award className="h-6 w-6 text-purple-300" />
                                                3. Advantages–Disadvantages Essay
                                            </h4>
                                            <div className="mb-4 p-3 bg-white/5 rounded-xl">
                                                <p className="text-white/80 font-bold">Question: <span className="text-white/50">[________________]</span></p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">INTRODUCTION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Background: <span className="text-yellow-300">[In modern society, _______ is often debated because it affects _______ and _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Thesis: <span className="text-yellow-300">[This essay will examine both the advantages and disadvantages of _______, while providing a reasoned opinion on _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 1 – ADVANTAGES</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Advantage: <span className="text-green-300">[One major advantage is that _______, which allows _______ and helps _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-green-300">[For example, _______, which clearly illustrates _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-green-300">[As a result, _______, and therefore _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">BODY 2 – DISADVANTAGES</p>
                                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                                        <p className="text-white/90 font-mono text-sm">Disadvantage: <span className="text-orange-300">[However, a significant disadvantage is that _______, which may lead to _______ and affect _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Example: <span className="text-orange-300">[For instance, _______, which proves that _______.]</span></p>
                                                        <p className="text-white/90 font-mono text-sm">Link: <span className="text-orange-300">[Consequently, _______, and this indicates that _______.]</span></p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-sm font-bold mb-2">CONCLUSION</p>
                                                    <div className="bg-white/5 p-4 rounded-xl">
                                                        <p className="text-white/90 font-mono text-sm"><span className="text-pink-300">[In conclusion, while _______ offers advantages such as _______, _______ should also be considered because _______. Overall, it is clear that _______, and therefore _______.]</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pro Tip */}
                                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md p-6 rounded-2xl border-2 border-yellow-400/40">
                                            <p className="text-white font-black text-lg mb-2">💡 Pro Tip:</p>
                                            <p className="text-white/90 font-medium">Fill each blank with your idea, example, or reasoning. Use the linking phrases and compound-complex sentence prompts to create a cohesive and high-scoring essay.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-10 text-center">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Confidential SmartLabs Student Note • Unauthorized sharing prohibited • © 2026
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}