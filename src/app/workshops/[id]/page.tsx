'use client';

import React, { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, User, CheckCircle2, Play, FileText, 
    Lock, Star, ExternalLink, Download, AlertCircle, Loader2,
    MessageCircle, QrCode, Youtube, ChevronDown, ChevronUp, HelpCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase';
import { 
    getWorkshopById, 
    registerForWorkshop, 
    Workshop, 
    WorkshopRegistration,
    getUserWorkshops,
    submitWorkshopProblem
} from '@/lib/services/workshop.service';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const PTE_FAQS = [
    { q: "What is PTE Academic?", a: "PTE Academic is a computer-based English language test accepted by educational institutions and governments around the world." },
    { q: "How long is the PTE test?", a: "The PTE Academic test takes approximately 2 hours to complete." },
    { q: "How is the PTE test scored?", a: "PTE uses automated scoring technology. You receive an overall score and scores for communicative skills (listening, reading, speaking, and writing) on a scale of 10-90." },
    { q: "When will I get my PTE results?", a: "Most PTE results are available within 48 hours, but it can take up to 5 business days." },
    { q: "How many times can I take the PTE?", a: "You can take the PTE Academic as many times as you want, but you must wait until you receive your results from one test before booking another." },
    { q: "What is a good PTE score for immigration?", a: "Typically, a score of 65 (equivalent to IELTS 7.0) or 79 (equivalent to IELTS 8.0) is required for various visa categories in Australia and New Zealand." },
    { q: "Is PTE easier than IELTS?", a: "Many students find PTE easier because it is fully computer-based and the scoring is more objective, especially in speaking and writing." },
    { q: "Can I use a pen and paper during the test?", a: "No, you are provided with an erasable marker pen and a laminated spiral-bound notepad." },
    { q: "Is there a break during the PTE test?", a: "As of November 2021, there is no scheduled break in the 2-hour PTE Academic test." },
    { q: "What documents do I need for the PTE test?", a: "You generally need a valid passport. Requirements can vary by country, so check the official Pearson website." },
    { q: "How do I book a PTE test?", a: "You can book the test online through the official Pearson PTE website." },
    { q: "What are the four sections of PTE?", a: "The sections are Speaking & Writing (together), Reading, and Listening." },
    { q: "Does PTE have negative marking?", a: "Only a few task types (Multiple-choice, choose multiple answers and Highlight incorrect words) have negative marking." },
    { q: "Can I skip questions in PTE?", a: "You can skip questions, but it's recommended to attempt all as there's no penalty for most." },
    { q: "What is the 'Repeat Sentence' task?", a: "You hear a sentence and must repeat it exactly as you heard it. It tests both listening and speaking." },
    { q: "How important is the 'Write from Dictation' task?", a: "It is extremely important as it contributes significantly to both your Listening and Writing scores." },
    { q: "Can I prepare for PTE at home?", a: "Yes, with the right materials and practice platforms like SmartLabs, you can achieve your target score from home." },
    { q: "Does the computer record my typing speed?", a: "No, but you must complete your writing tasks within the allotted time." },
    { q: "What if I have a strong accent?", a: "PTE's automated scoring is designed to recognize various accents, but clarity and oral fluency are key." },
    { q: "What is 'Describe Image'?", a: "You are shown an image (graph, chart, map, etc.) and have 40 seconds to describe it in detail." }
];

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { firestore, user, isUserLoading } = useFirebase();
    const { toast } = useToast();
    
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [registration, setRegistration] = useState<WorkshopRegistration | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [problemText, setProblemText] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id || !firestore) return;
            
            const ws = await getWorkshopById(firestore, id);
            setWorkshop(ws);

            if (user) {
                const userWs = await getUserWorkshops(firestore, user.uid);
                const reg = userWs.find(r => r.workshopId === id);
                setRegistration(reg || null);
            }
            setLoading(false);
        };
        loadData();
    }, [id, firestore, user]);

    const handleRegister = async () => {
        if (!user) {
            router.push(`/login?redirect=/workshops/${id}`);
            return;
        }

        setActionLoading(true);
        const result = await registerForWorkshop(firestore, {
            workshopId: id,
            userId: user.uid,
            fullName: user.displayName || 'Student',
            email: user.email || '',
            phone: '', 
        });

        if (result.success) {
            const userWs = await getUserWorkshops(firestore, user.uid);
            const reg = userWs.find(r => r.workshopId === id);
            setRegistration(reg || null);
            toast({ title: "Registration Successful!", description: "You have reserved your seat." });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setActionLoading(false);
    };

    const handleProblemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !problemText.trim() || !firestore) return;

        setActionLoading(true);
        const success = await submitWorkshopProblem(firestore, {
            workshopId: id,
            userId: user.uid,
            studentName: user.displayName || 'Anonymous',
            problem: problemText
        });

        if (success) {
            toast({ title: "Problem Submitted!", description: "We will discuss this in the next workshop." });
            setProblemText('');
        } else {
            toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
        }
        setActionLoading(false);
    };

    if (loading || isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!workshop) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-black">Workshop Not Found</h2>
                <Button asChild><Link href="/workshops">Back to Workshops</Link></Button>
            </div>
        );
    }

    const whatsappLink = workshop.whatsappLink || "https://chat.whatsapp.com/IUrSQ6Hh6mBEXk3k5ivBOD?mode=gi_t";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappLink)}`;

    return (
        <div className="w-full bg-slate-50 dark:bg-[#020617] min-h-screen pb-24 pt-32">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto space-y-20">
                    
                    {/* Hero Header Section */}
                    <div className="grid lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                                        Free Monthly Workshop
                                    </span>
                                    <Link 
                                        href="https://www.youtube.com/@SmartLabs-Official" 
                                        target="_blank"
                                        className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Youtube className="h-4 w-4" />
                                        SmartLabs Official
                                    </Link>
                                </div>
                                <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tighter leading-[0.9]">
                                    {workshop.title}
                                </h1>
                                <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                    {workshop.description}
                                </p>
                                
                                <div className="grid sm:grid-cols-3 gap-6 pt-6">
                                    <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                                        <Calendar className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</p>
                                        <p className="text-lg font-black mt-1">
                                            {new Date(workshop.date instanceof Date ? workshop.date : (workshop.date as any).toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                                        <Clock className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</p>
                                        <p className="text-lg font-black mt-1">{workshop.time}</p>
                                    </div>
                                    <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                                        <User className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Instructor</p>
                                        <p className="text-lg font-black mt-1">{workshop.instructor}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Registration Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="lg:col-span-1"
                        >
                            {!registration ? (
                                <Card className="p-10 rounded-[48px] border-none bg-white dark:bg-slate-900 shadow-2xl space-y-8 sticky top-32 border-t-4 border-primary">
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black tracking-tight">Reserve Seat</h3>
                                        <p className="text-sm text-muted-foreground font-medium">Join our exclusive monthly session and master your PTE goals.</p>
                                        <div className="flex items-center justify-between text-sm font-bold pt-4">
                                            <span className="text-muted-foreground">Available Seats</span>
                                            <span className="text-primary">{workshop.seatsAvailable} Left</span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full h-20 rounded-3xl text-xl font-black shadow-[0_20px_40px_rgba(79,70,229,0.2)]"
                                        disabled={actionLoading}
                                        onClick={handleRegister}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : "Register Now"}
                                    </Button>

                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Why Register?</p>
                                        <ul className="space-y-3">
                                            {workshop.benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm font-bold">
                                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-10 rounded-[48px] border-none bg-primary text-white shadow-2xl space-y-8 sticky top-32 overflow-hidden">
                                    <div className="relative z-10 space-y-6">
                                        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center">
                                            <MessageCircle className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black leading-tight">Join the Community</h3>
                                        <p className="text-white/80 font-medium">Get real-time updates, study materials, and session links in our WhatsApp community.</p>
                                        
                                        <div className="space-y-4">
                                            <Button 
                                                asChild
                                                className="w-full h-16 rounded-2xl bg-white text-primary hover:bg-white/90 font-black"
                                            >
                                                <Link href={whatsappLink} target="_blank">
                                                    Join WhatsApp Group
                                                </Link>
                                            </Button>
                                            
                                            <div className="p-4 bg-white rounded-3xl flex flex-col items-center gap-3">
                                                <div className="relative w-40 h-40">
                                                    <Image src={qrUrl} alt="WhatsApp QR" fill className="object-contain" />
                                                </div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Scan to Join</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                                </Card>
                            )}
                        </motion.div>
                    </div>

                    {/* PTE FAQs Section */}
                    <section className="space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black font-headline">PTE <span className="text-primary italic">Everything You Need to Know</span></h2>
                            <p className="text-xl text-muted-foreground font-medium">The most common questions students ask about the PTE exam.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {PTE_FAQS.map((faq, idx) => (
                                <Card 
                                    key={idx} 
                                    className="rounded-[32px] border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <div className="p-6 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <HelpCircle className="h-5 w-5 text-primary" />
                                            </div>
                                            <h4 className="font-black text-lg leading-tight">{faq.q}</h4>
                                        </div>
                                        {openFaq === idx ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <AnimatePresence>
                                        {openFaq === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-6 pb-6"
                                            >
                                                <p className="text-muted-foreground font-medium leading-relaxed pl-14">
                                                    {faq.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Problem Submission Section */}
                    <section className="py-20 px-10 rounded-[64px] bg-slate-900 text-white relative overflow-hidden">
                        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-6xl font-black font-headline leading-tight">
                                    Struggling with <br />
                                    <span className="text-primary italic">PTE Tasks?</span>
                                </h2>
                                <p className="text-xl text-white/60 font-medium">
                                    Submit your problems, score reports, or specific questions. We will analyze and discuss them in our next live workshop session.
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                                <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="Student" width={48} height={48} />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Join 1,000+ students</p>
                                </div>
                            </div>

                            <Card className="p-8 rounded-[40px] border-none bg-white/5 backdrop-blur-xl border border-white/10 space-y-6">
                                {!user ? (
                                    <div className="text-center py-10 space-y-6">
                                        <Lock className="h-12 w-12 text-primary mx-auto opacity-50" />
                                        <p className="text-lg font-bold">Please login to submit problems</p>
                                        <Button asChild className="rounded-2xl h-14 px-8">
                                            <Link href="/login">Login Now</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleProblemSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-white/40">Describe your problem</label>
                                            <Textarea 
                                                value={problemText}
                                                onChange={(e) => setProblemText(e.target.value)}
                                                placeholder="e.g. I am stuck at 50 in Speaking Read Aloud. My oral fluency is low..."
                                                className="bg-white/5 border-white/10 rounded-3xl h-40 focus:border-primary transition-all text-white placeholder:text-white/20"
                                                required
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin" /> : (
                                                <>Submit for Analysis <Send className="ml-2 h-5 w-5" /></>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </Card>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -mb-48 -mr-48" />
                    </section>

                </div>
            </div>
        </div>
    );
}
