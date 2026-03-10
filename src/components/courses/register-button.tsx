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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [payId, setPayId] = useState<string | null>(null);

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
            const settings = await paymentService.getCoursePaymentSetting(courseId);

            if (!settings || settings.status !== 'active' || !settings.payherePaymentLink) {
                toast({
                    title: 'Registration Unavailable',
                    description: 'Online registration for this course is currently disabled. Please contact support.',
                    variant: 'destructive',
                });
                return;
            }

            setPayId(settings.payherePaymentLink);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error opening payment:', error);
            toast({
                title: 'Error',
                description: 'Could not load payment form. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Inject PayHere script when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // Small delay to ensure the div is rendered inside the dialog
            const timer = setTimeout(() => {
                // Remove existing script if any
                const existingScript = document.getElementById('payhere-button');
                if (existingScript) {
                    existingScript.remove();
                }

                const script = document.createElement('script');
                script.src = "https://www.payhere.lk/payhere.pay.button.js";
                script.id = "payhere-button";
                script.async = true;

                // Append to body to ensure it runs properly
                document.body.appendChild(script);
            }, 100);

            return () => {
                clearTimeout(timer);
                const existingScript = document.getElementById('payhere-button');
                if (existingScript) {
                    existingScript.remove();
                }
            };
        }
    }, [isModalOpen]);

    return (
        <>
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black font-headline tracking-tight">Complete Registration</DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground font-medium pt-2">
                            Please complete your secure payment for <strong className="text-foreground">{courseName}</strong> below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-10 min-h-[200px] w-full bg-muted/30 rounded-2xl mt-4 border border-border relative">
                        {payId ? (
                            <div id="payhere-form" data-pay-id={payId}></div>
                        ) : (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        )}
                        <p className="text-xs text-muted-foreground mt-6 font-bold flex items-center gap-1 opacity-70">
                            Secured by PayHere
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
