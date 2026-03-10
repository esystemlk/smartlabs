'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, GraduationCap, ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-10">
                <div className="relative inline-block scale-110 mb-6">
                    <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    <div className="relative bg-background p-6 rounded-full border-4 border-green-500/50 shadow-xl shadow-green-500/20">
                        <CheckCircle2 className="h-16 w-16 text-green-500 animate-scale-in" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-headline font-black text-foreground drop-shadow-sm tracking-tight capitalize">
                        Payment Successful!
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                        Thank you! Your payment has been received. Your course access will be activated shortly.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                    <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all">
                        <Link href="/my-purchases">
                            <LayoutDashboard className="h-5 w-5 mr-2" />
                            Go to My Courses
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold hover:bg-muted/50 border-2 transition-all">
                        <Link href="/">
                            Return to Website
                        </Link>
                    </Button>
                </div>

                <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl mx-auto">
                    <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Start Learning</h3>
                                <p className="text-sm text-muted-foreground leading-snug">Access your materials instantly once activated.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                            <div className="p-3 bg-accent-3/10 rounded-2xl">
                                <Sparkles className="h-6 w-6 text-accent-3" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Bonus Perks</h3>
                                <p className="text-sm text-muted-foreground leading-snug">Check your email for additional resources.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <footer className="pt-20 text-muted-foreground text-sm font-medium flex items-center justify-center gap-2">
                    <Image src="/logo.png" alt="Smart Labs Logo" width={24} height={24} className="opacity-60 grayscale hover:grayscale-0 transition-all cursor-pointer" />
                    <span>© 2026 Smart Labs PTE. All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
