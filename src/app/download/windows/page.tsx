'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Download,
    Monitor,
    ShieldCheck,
    Zap,
    CheckCircle2,
    ArrowRight,
    Info,
    ChevronRight,
    Cpu,
    Database,
    Globe,
    QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export default function WindowsDownloadPage() {
    const downloadLink = "https://mega.nz/file/TwwCQSba#1J8JSSQ1GtIDzlF1yauK09Bwd48RS4KlCgwzJRP3VgU";
    const qrData = encodeURIComponent(downloadLink);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}&bgcolor=000&color=fff&margin=10`;

    const features = [
        { icon: Zap, title: "Peak Performance", desc: "Native Windows optimization for zero-latency AI analysis." },
        { icon: ShieldCheck, title: "Secure Environment", desc: "Built-in anti-cheat and secure browser protocols." },
        { icon: Globe, title: "Offline Ready", desc: "Access core practice modules even without an internet connection." },
        { icon: Monitor, title: "Native UI", desc: "Seamless integration with Windows 10 & 11 features." },
    ];

    const requirements = [
        { label: "Operating System", value: "Windows 10 / 11 (64-bit)" },
        { label: "Processor", value: "Intel Core i3 or equivalent (i5 recommended)" },
        { label: "Memory", value: "4GB RAM (8GB recommended)" },
        { label: "Storage", value: "500MB available space" },
    ];

    const steps = [
        "Click the 'Download for Windows' button below.",
        "Open the 'SmartLabs_Setup.exe' file from your downloads.",
        "Follow the on-screen instructions to complete installation.",
        "Sign in with your Smart Labs account and start practicing!"
    ];

    return (
        <div className="min-h-screen bg-[#0a0f1a] pt-32 pb-20 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-3/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4 opacity-30" />
            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-16 sm:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
                    >
                        <Monitor className="h-4 w-4" />
                        <span>Desktop Application</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight"
                    >
                        Get Smart Labs <br />
                        <span className="gradient-text uppercase">V1.0 ONLINE APP</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        The ultimate native experience for PTE mastery. Version 1.0 features full online sync and real-time AI phonetic tracking.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* Main Download Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-8 flex flex-col gap-8"
                    >
                        <SpotlightCard className="glass-card p-8 sm:p-12 rounded-[40px] border-white/10 bg-black/40 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-white tracking-tight">Windows Native Installer</h2>
                                        <p className="text-white/40 text-sm">Recommended for most users on Windows 10 and 11.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-xs font-bold">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>Verified Secure</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 mb-12">
                                    {features.map((feature, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                                <feature.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                                                <p className="text-xs text-white/50 leading-relaxed">{feature.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6 p-2 bg-white/5 rounded-[28px] border border-white/5">
                                    <Button
                                        size="xl"
                                        className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 shadow-[0_10px_40px_rgba(79,70,229,0.4)] rounded-2xl px-12 h-20 text-lg font-black uppercase tracking-widest"
                                        asChild
                                    >
                                        <a href={downloadLink} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-3 h-6 w-6" />
                                            Download Now
                                        </a>
                                    </Button>
                                    <div className="flex flex-col px-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Release Notes</span>
                                        <span className="text-sm font-bold text-white/80">V1.0 - Stable Build (Online)</span>
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Installation Guide */}
                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="glass-card p-8 rounded-[32px] border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-primary" />
                                    How to Install
                                </h3>
                                <div className="space-y-4">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                                                {i + 1}
                                            </div>
                                            <p className="text-xs text-white/60 leading-relaxed font-medium">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-[32px] border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-accent-3" />
                                    System Requirements
                                </h3>
                                <div className="space-y-4">
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                                            <span className="text-xs text-white/40 font-medium">{req.label}</span>
                                            <span className="text-xs text-white/90 font-bold">{req.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar - QR Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-4"
                    >
                        <div className="lg:sticky lg:top-32 space-y-8">
                            <SpotlightCard className="glass-card p-8 rounded-[40px] border-white/10 bg-gradient-to-br from-primary/10 to-transparent text-center">
                                <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
                                    <QrCode className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">Scan to Download</h3>
                                <p className="text-sm text-white/40 mb-8 leading-relaxed">Need the file on another device? Scan this QR code to access the download link instantly.</p>

                                <div className="bg-white p-4 rounded-3xl inline-block shadow-[0_0_50px_rgba(79,70,229,0.3)] group hover:scale-105 transition-transform duration-500">
                                    <img
                                        src={qrCodeUrl}
                                        alt="Download QR Code"
                                        className="w-48 h-48 rounded-xl"
                                    />
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    Supports All Devices
                                </div>
                            </SpotlightCard>

                            <div className="p-8 rounded-[32px] border border-white/5 bg-white/5">
                                <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Need help?</h4>
                                <p className="text-xs text-white/40 mb-6 leading-relaxed">If you encounter any issues during the installation process, our technical team is ready to assist you.</p>
                                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Footer Decoration */}
            <div className="mt-32 border-t border-white/5 pt-20 pb-10 text-center">
                <p className="text-white/20 text-xs font-medium">
                    Smart Labs © 2026. All Rights Reserved. Windows is a trademark of Microsoft Corporation.
                </p>
            </div>
        </div>
    );
}
