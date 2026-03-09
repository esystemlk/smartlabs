'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Question,
    ChatCircleDots,
    EnvelopeSimple,
    Phone,
    WhatsappLogo,
    CaretRight,
    Lifebuoy
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';

const supportOptions = [
    {
        title: "Live Support Chat",
        description: "Chat with our support team in real-time for immediate assistance.",
        icon: ChatCircleDots,
        link: "/dashboard/support",
        buttonText: "Open Chat",
        color: "blue",
        requiresAuth: true
    },
    {
        title: "Contact Form",
        description: "Send us a detailed message and we'll get back to you within 24 hours.",
        icon: EnvelopeSimple,
        link: "/contact",
        buttonText: "Send Message",
        color: "purple"
    },
    {
        title: "WhatsApp Support",
        description: "Connect with us on WhatsApp for quick inquiries and updates.",
        icon: WhatsappLogo,
        link: "https://wa.me/94766914650",
        buttonText: "WhatsApp Us",
        color: "green",
        isExternal: true
    },
    {
        title: "Phone Support",
        description: "Call our educational consultants for direct guidance.",
        icon: Phone,
        link: "tel:+94766914650",
        buttonText: "Call Now",
        color: "sky"
    }
];

export default function SupportPage() {
    const { user } = useUser();

    return (
        <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-900/10">
            <section className="relative overflow-hidden py-16 sm:py-24">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_70%)]" />

                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-widest mb-6">
                            <Lifebuoy weight="fill" className="h-4 w-4" />
                            <span>Help Center</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                            How Can We <span className="text-blue-500 italic">Help</span> You?
                        </h1>

                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-12">
                            Whether you're looking for technical support, course guidance, or general inquiries, our expert team is here to ensure your success.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mt-12">
                        {supportOptions.map((option, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-sky-400/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] h-full flex flex-col text-left shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110`}>
                                        <option.icon weight="duotone" className="h-8 w-8" />
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                        {option.title}
                                    </h3>

                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                        {option.description}
                                    </p>

                                    {option.requiresAuth && !user ? (
                                        <Link href={`/login?redirect=${encodeURIComponent(option.link)}`}>
                                            <Button className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border-none transition-all">
                                                Log In to Chat
                                                <CaretRight weight="bold" className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={option.link} target={option.isExternal ? "_blank" : undefined}>
                                            <Button className="w-full h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500 text-slate-900 dark:text-white font-bold transition-all flex items-center justify-center gap-2">
                                                {option.buttonText}
                                                <CaretRight weight="bold" className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-20 p-10 rounded-[40px] bg-slate-900 dark:bg-blue-600 text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-left">
                                <h2 className="text-3xl font-black mb-2 tracking-tight">Need immediate answers?</h2>
                                <p className="text-white/70 max-w-md">Check out our frequently asked questions for detailed guides on PTE, IELTS, and platform usage.</p>
                            </div>
                            <Link href="/help-center">
                                <Button className="h-14 px-10 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest shadow-xl shadow-black/20">
                                    Browse FAQ
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
