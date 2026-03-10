'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/lib/services/payment.service';

interface RegisterButtonProps {
    courseId: string;
    courseName: string;
    price: number;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    children?: React.ReactNode;
}

export function RegisterButton({
    courseId,
    courseName,
    price,
    className,
    variant = "default",
    children
}: RegisterButtonProps) {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!user) {
            toast({
                title: 'Login Required',
                description: 'Please login to register for this course.',
                variant: 'destructive',
            });
            router.push('/login');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Fetch PayHere settings for this course
            const settings = await paymentService.getCoursePaymentSetting(courseId);

            if (!settings || settings.status !== 'active' || !settings.payherePaymentLink) {
                toast({
                    title: 'Registration Unavailable',
                    description: 'Online registration for this course is currently disabled. Please contact support.',
                    variant: 'destructive',
                });
                return;
            }

            // 2. Create Payment Order
            const orderId = `ORDER_${Date.now()}_${user.uid.slice(0, 5)}`;
            const orderCreated = await paymentService.createPaymentOrder({
                userId: user.uid,
                courseId: courseId,
                orderId: orderId,
                paymentStatus: 'pending',
                paymentAmount: settings.price || price,
            });

            if (!orderCreated) {
                throw new Error('Failed to create payment order');
            }

            // 3. Redirect to PayHere
            const priceVal = settings.price || price;
            const payUrl = new URL(settings.payherePaymentLink);

            // Append parameters to help PayHere identify our order in the notify callback
            payUrl.searchParams.set('order_id', orderId);
            payUrl.searchParams.set('amount', priceVal.toFixed(2));
            payUrl.searchParams.set('currency', 'LKR');
            payUrl.searchParams.set('custom_1', user.uid);
            payUrl.searchParams.set('custom_2', courseId);

            // Helpful for programmatic return/cancel tracking
            const baseUrl = window.location.origin;
            payUrl.searchParams.set('return_url', `${baseUrl}/payment-success?order_id=${orderId}`);
            payUrl.searchParams.set('cancel_url', `${baseUrl}/payment-cancel?order_id=${orderId}`);
            payUrl.searchParams.set('notify_url', `${baseUrl}/api/payhere/notify`);

            window.location.href = payUrl.toString();

        } catch (error: any) {
            console.error('Registration error:', error);
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleRegister}
            disabled={isLoading}
            className={className}
            variant={variant}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {children || (
                <>
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    );
}
