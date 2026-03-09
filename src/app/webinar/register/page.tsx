'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    User,
    Mail,
    Phone,
    BookOpen,
    BarChart3,
    Sparkles,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
    registerForWebinar,
    checkExistingRegistration,
    getWebinarSettings,
    type WebinarSettings,
    DEFAULT_WEBINAR_SETTINGS,
} from '@/lib/services/webinar.service';

export default function WebinarRegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    const [settings, setSettings] = useState<WebinarSettings>(DEFAULT_WEBINAR_SETTINGS);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [examType, setExamType] = useState<'IELTS' | 'PTE' | ''>('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | ''>('');

    // Load settings
    useEffect(() => {
        if (!firestore) return;
        getWebinarSettings(firestore).then(setSettings);
    }, [firestore]);

    // Redirect if not logged in
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push(`/login?redirect=${encodeURIComponent('/webinar/register')}`);
        }
    }, [user, isUserLoading, router]);

    // Pre-fill form and check existing registration
    useEffect(() => {
        if (user && firestore) {
            setFullName(user.displayName || '');
            setEmail(user.email || '');

            const checkRegistration = async () => {
                setIsCheckingRegistration(true);
                const exists = await checkExistingRegistration(firestore, user.uid);
                setIsAlreadyRegistered(exists);
                setIsCheckingRegistration(false);
            };
            checkRegistration();
        }
    }, [user, firestore]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firestore || !user) return;

        // Validation
        if (!fullName || !email || !phone || !examType || !level) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill in all fields before submitting.',
            });
            return;
        }

        setIsSubmitting(true);

        const result = await registerForWebinar(firestore, {
            userId: user.uid,
            fullName,
            email,
            phone,
            examType: examType as 'IELTS' | 'PTE',
            level: level as 'Beginner' | 'Intermediate' | 'Advanced',
        });

        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
            toast({
                title: 'Successfully Registered!',
                description: result.message,
            });
        } else {
            if (result.message.includes('already registered')) {
                setIsAlreadyRegistered(true);
            }
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: result.message,
            });
        }
    };

    // Loading state
    if (isUserLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Already registered state
    if (isAlreadyRegistered && !isCheckingRegistration) {
        return (
            <div className="w-full">
                <section className="py-20 md:py-32 bg-gradient-to-br from-white via-blue-50/50 to-sky-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-lg mx-auto text-center"
                        >
                            <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-[32px] blur-2xl" />
                                <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-100 dark:border-slate-800 rounded-[28px] shadow-xl">
                                    <CardContent className="p-10 space-y-6">
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Already Registered!</h2>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                            You are already registered for this webinar. The joining link will be sent to your email before the event.
                                        </p>
                                        <div className="pt-4 flex flex-col gap-3">
                                            <Link href="/webinar">
                                                <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                                    Back to Webinar Page
                                                </Button>
                                            </Link>
                                            <Link href="/">
                                                <Button variant="ghost" className="w-full h-10 text-gray-400 hover:text-gray-600 text-sm font-medium">
                                                    Go to Homepage
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="w-full">
                <section className="py-20 md:py-32 bg-gradient-to-br from-white via-blue-50/50 to-sky-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                            className="max-w-lg mx-auto text-center"
                        >
                            <div className="relative">
                                <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/20 via-sky-300/20 to-yellow-200/30 rounded-[36px] blur-2xl animate-pulse" />
                                <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-100 dark:border-slate-800 rounded-[28px] shadow-xl">
                                    <div className="h-1.5 bg-gradient-to-r from-blue-400 via-sky-400 to-yellow-300" />
                                    <CardContent className="p-10 space-y-6">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring' }}
                                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 flex items-center justify-center mx-auto"
                                        >
                                            <span className="text-5xl">🎉</span>
                                        </motion.div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Successfully Registered!</h2>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                            You are successfully registered for the webinar. The joining link will be sent to your email.
                                        </p>
                                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                📧 Check your inbox at <span className="font-bold">{email}</span> for confirmation details.
                                            </p>
                                        </div>
                                        <div className="pt-4 flex flex-col gap-3">
                                            <Link href="/webinar">
                                                <Button className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold shadow-lg shadow-blue-500/25">
                                                    View Webinar Details
                                                </Button>
                                            </Link>
                                            <Link href="/">
                                                <Button variant="ghost" className="w-full h-10 text-gray-400 hover:text-gray-600 text-sm font-medium">
                                                    Return to Homepage
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // Registration form
    return (
        <div className="w-full">
            <section className="py-16 md:py-24 bg-gradient-to-br from-white via-blue-50/50 to-sky-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
                {/* Background decorations */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4">
                    <div className="max-w-xl mx-auto">
                        {/* Back link */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6"
                        >
                            <Link href="/webinar" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Webinar
                            </Link>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-4">
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Register Now</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                Webinar Registration
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Fill in your details to secure your spot.
                            </p>
                        </motion.div>

                        {/* Form Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/15 via-sky-300/15 to-yellow-200/15 rounded-[28px] blur-xl" />
                                <Card className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-100/60 dark:border-slate-800 rounded-[24px] shadow-xl">
                                    <div className="h-1 bg-gradient-to-r from-blue-400 via-sky-400 to-yellow-300" />
                                    <CardContent className="p-8">
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Full Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName" className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-500" />
                                                    Full Name
                                                </Label>
                                                <Input
                                                    id="fullName"
                                                    type="text"
                                                    placeholder="Enter your full name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="h-12 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/50 dark:bg-slate-800/50"
                                                    required
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-blue-500" />
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="your.email@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="h-12 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/50 dark:bg-slate-800/50"
                                                    required
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-blue-500" />
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+94 7X XXX XXXX"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-12 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/50 dark:bg-slate-800/50"
                                                    required
                                                />
                                            </div>

                                            {/* Exam Type */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                                    Target Exam
                                                </Label>
                                                <Select value={examType} onValueChange={(value) => setExamType(value as 'IELTS' | 'PTE')}>
                                                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-400 bg-gray-50/50 dark:bg-slate-800/50">
                                                        <SelectValue placeholder="Select your target exam" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="IELTS">IELTS</SelectItem>
                                                        <SelectItem value="PTE">PTE</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Level */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-blue-500" />
                                                    Current English Level
                                                </Label>
                                                <Select value={level} onValueChange={(value) => setLevel(value as 'Beginner' | 'Intermediate' | 'Advanced')}>
                                                    <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-400 bg-gray-50/50 dark:bg-slate-800/50">
                                                        <SelectValue placeholder="Select your current level" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Submit */}
                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group disabled:opacity-60"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                            Registering...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Confirm Registration
                                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                                                By registering, you agree to receive the webinar joining link via email.
                                            </p>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
