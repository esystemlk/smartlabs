'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { paymentService } from '@/lib/services/payment.service';

interface RegisterButtonProps {
    courseId: string;
    courseName: string;
    price: number;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    children?: React.ReactNode;
    payhereButtonId?: string;
}

export function RegisterButton({
    courseId,
    courseName,
    price,
    className,
    variant = "default",
    children,
    payhereButtonId
}: RegisterButtonProps) {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleRegisterClick = async () => {
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
            // Admin provided a payhere link directly on the course
            let finalLink = payhereButtonId;

            // Fallback for older database configurations
            if (!finalLink) {
                const settings = await paymentService.getCoursePaymentSetting(courseId);

                if (!settings || settings.status !== 'active' || !settings.payherePaymentLink) {
                    toast({
                        title: 'Registration Unavailable',
                        description: 'Online registration for this course is currently disabled. Please contact support.',
                        variant: 'destructive',
                    });
                    return;
                }
                finalLink = settings.payherePaymentLink;
            }

            if (finalLink) {
                // If it's a URL, open it
                if (finalLink.startsWith('http://') || finalLink.startsWith('https://')) {
                    window.open(finalLink, '_blank');
                } else {
                    toast({
                        title: 'Invalid configuration',
                        description: 'The payment link for this course is not a valid URL. Please contact support.',
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            console.error('Error opening payment:', error);
            toast({
                title: 'Error',
                description: 'Could not load payment link. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleRegisterClick}
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
