'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, AlertTriangle, RefreshCcw, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

function CancelContent() {
    return (
        <div className="container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center">
            <div className="max-w-xl w-full text-center space-y-10 py-12 px-6 rounded-3xl bg-destructive/5 border border-destructive/10 shadow-2xl shadow-destructive/10 backdrop-blur-sm">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150- animate-pulse"></div>
                    <div className="relative bg-background p-6 rounded-full border-4 border-destructive/50 shadow-xl shadow-destructive/20">
                        <XCircle className="h-16 w-16 text-destructive animate-bounce-soft" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-headline font-black text-destructive tracking-tight capitalize drop-shadow-sm">
                        Payment Not Completed
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-semibold leading-relaxed max-w-md mx-auto">
                        Your payment was not completed. Please try again or contact support if the issue persists.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                    <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/20 hover:shadow-destructive/40 hover:-translate-y-1 active:scale-95 transition-all">
                        <Link href="/courses">
                            <RefreshCcw className="h-5 w-5 mr-3" />
                            Try Again
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold border-destructive/20 hover:bg-destructive/10 text-destructive-foreground transition-all">
                        <Link href="/">
                            Return to Homepage
                        </Link>
                    </Button>
                </div>

                <div className="pt-20 grid grid-cols-1 gap-6 w-full max-w-sm mx-auto">
                    <Card className="rounded-3xl border-destructive/10 shadow-sm overflow-hidden bg-destructive/5 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300">
                        <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-2 text-destructive-foreground">Common Issues</h3>
                                <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 font-medium">
                                    <li>• Insufficient bank balance</li>
                                    <li>• Card type not supported</li>
                                    <li>• Connection timed out</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <footer className="pt-20 text-muted-foreground text-sm font-medium flex flex-col items-center gap-4">
                    <a href="mailto:support@smartlabs.lk" className="hover:text-primary transition-colors hover:underline">
                        Need help? support@smartlabs.lk
                    </a>
                    <div className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Smart Labs Logo" width={24} height={24} className="opacity-60 grayscale" />
                        <span>© 2026 Smart Labs PTE. All rights reserved.</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default function PaymentCancelPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CancelContent />
        </Suspense>
    );
}
