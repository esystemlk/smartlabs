'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/lib/services/payment.service';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Valid phone required'),
  batch: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function EnrollCoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;
  const { firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const { data: course } = useDoc(courseRef as any);

  const batchesQuery = useMemoFirebase(
    () => (firestore && courseId ? collection(firestore, 'courses', courseId, 'batches') : null),
    [firestore, courseId]
  );
  const { data: batches } = useCollection(batchesQuery);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      batch: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/enroll/${courseId}`)}`);
    }
  }, [user, router, courseId]);

  const onSubmit = async (values: Values) => {
    // Prefer PayHere hosted link from Admin Payment Settings; fallback to course doc
    const settings = await paymentService.getCoursePaymentSetting(courseId);
    const hostedLink = settings?.payherePaymentLink || (course?.payherePaymentLink as string) || (course?.payhereButtonId as string);
    if (!hostedLink) {
      toast({
        variant: 'destructive',
        title: 'Payment Unavailable',
        description: 'No payment link is configured for this course. Please contact support.',
      });
      return;
    }
    // Optionally store a pending order
    await paymentService.createPaymentOrder({
      userId: user!.uid,
      courseId,
      orderId: `${user!.uid}__${courseId}__${values.batch || 'n/a'}`,
      paymentStatus: 'pending',
      paymentAmount: Number(course?.price || 0),
    });
    // Redirect to hosted PayHere link
    window.location.href = hostedLink;
  };

  return (
    <div className="container mx-auto py-12">
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{course?.name || courseId}</CardTitle>
              <CardDescription>{course?.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course?.duration && <div className="text-sm"><strong>Duration:</strong> {course.duration}</div>}
              {course?.days && <div className="text-sm"><strong>Days:</strong> {course.days}</div>}
              {course?.startTime && <div className="text-sm"><strong>Time:</strong> {course.startTime}</div>}
              <div className="text-sm"><strong>Price:</strong> LKR {(Number(course?.price) || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Enrollment</CardTitle>
            <CardDescription>Fill in your details and proceed to payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="John Doe" /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} placeholder="you@example.com" /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="tel" {...field} placeholder="+94 123 456 789" /></FormControl><FormMessage /></FormItem>
                )}/>
                {batches && batches.length > 0 && (
                  <FormField control={form.control} name="batch" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Batch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Choose a batch" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {batches.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>{b.name} {b.schedule ? `(${b.schedule})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                )}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" /> PayHere Hosted Payment</h3>
                  <p className="text-sm text-muted-foreground mt-2">You will be redirected to our secure PayHere page to complete payment.</p>
                </div>
                <Button type="submit" className="w-full">
                  Proceed to Payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 text-sm">
        <Link href="/courses" className="text-primary">Back to Courses</Link>
      </div>
    </div>
  );
}
