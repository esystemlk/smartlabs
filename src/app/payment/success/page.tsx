
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const router = useRouter();
    if (orderId) {
        // Auto-redirect to dashboard to show purchased course details
        setTimeout(() => {
            router.replace(`/dashboard?order_id=${orderId}`);
        }, 1500);
    }

    return (
        <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="mt-4 text-3xl font-headline">Payment Successful!</CardTitle>
                <CardDescription className="text-lg">Thank you for your enrollment.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Your payment has been processed and your spot is confirmed! We are now automatically updating your account access.
                </p>
                
                <Alert className="mt-6 text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Update In Progress</AlertTitle>
                    <AlertDescription>
                        It may take up to a minute for the new course to appear on your dashboard. Your dashboard will update automatically when it's ready.
                    </AlertDescription>
                </Alert>

                {orderId && (
                    <p className="mt-6 text-sm text-muted-foreground">
                        Your Order ID is: <span className="font-mono bg-muted p-1 rounded-md">{orderId}</span>
                    </p>
                )}
                <Button asChild size="lg" className="mt-8">
                    <Link href="/dashboard">Go to Your Dashboard</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function SuccessSkeleton() {
    return (
         <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <Skeleton className="h-9 w-3/4 mx-auto mt-4" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/3 mx-auto mt-2" />
                </div>
                <Skeleton className="h-12 w-1/2 mx-auto mt-8" />
            </CardContent>
        </Card>
    )
}

export default function PaymentSuccessPage() {
    return (
        <div className="w-full">
            <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
                <Suspense fallback={<SuccessSkeleton />}>
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
