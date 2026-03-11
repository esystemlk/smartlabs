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

        // Route to the per-course enrollment page
        router.push(`/enroll/${courseId}`);
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
