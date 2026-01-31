
'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentCancelPage() {
    return (
        <div className="w-full">
            <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
                <Card className="w-full max-w-lg text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <CardTitle className="mt-4 text-3xl font-headline">Payment Canceled</CardTitle>
                        <CardDescription className="text-lg">Your transaction was not completed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            It looks like you've canceled the payment process. Your enrollment has not been completed. If this was a mistake, you can try again.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Button asChild size="lg">
                                <Link href="/enroll">Try Again</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/">Back to Home</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
