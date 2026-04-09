'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowRight, CreditCard, Loader2, CheckCircle2, Phone, AlertCircle, Calendar, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/lib/services/payment.service';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Valid phone required'),
  batch: z.string().min(1, 'Please select a batch'),
  confirmTimetable: z.boolean().refine(val => val === true, {
    message: 'You must confirm the timetable before proceeding',
  }),
  paymentMethod: z.enum(['website', 'manual']),
});

type Values = z.infer<typeof schema>;

export default function EnrollCoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;
  const { firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);

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
      confirmTimetable: false,
      paymentMethod: 'website',
    },
  });

  const selectedBatchId = form.watch('batch');
  const paymentMethod = form.watch('paymentMethod');
  const selectedBatch = batches?.find((b: any) => b.id === selectedBatchId);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/enroll/${courseId}`)}`);
    }
  }, [user, router, courseId]);

  const onSubmit = async (values: Values) => {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    try {
      if (values.paymentMethod === 'website') {
        // Prefer PayHere hosted link from Admin Payment Settings; fallback to course doc
        const settings = await paymentService.getCoursePaymentSetting(courseId);
        const hostedLink = settings?.payherePaymentLink || (course?.payherePaymentLink as string) || (course?.payhereButtonId as string);
        if (!hostedLink) {
          toast({
            variant: 'destructive',
            title: 'Payment Unavailable',
            description: 'No payment link is configured for this course. Please contact support.',
          });
          setIsSubmitting(false);
          return;
        }
        // Store a pending order
        await paymentService.createPaymentOrder({
          userId: user.uid,
          courseId,
          orderId: `${user.uid}__${courseId}__${values.batch}`,
          paymentStatus: 'pending',
          paymentAmount: Number(course?.price || 0),
        });
        // Redirect to hosted PayHere link
        window.location.href = hostedLink;
      } else {
        // Manual Payment Flow
        const enrollmentId = `manual_${Date.now()}_${user.uid}`;
        await addDoc(collection(firestore, 'enrollments'), {
          id: enrollmentId,
          userId: user.uid,
          userName: values.fullName,
          userEmail: values.email,
          userPhone: values.phone,
          courseId,
          courseName: course?.name || courseId,
          batchId: values.batch,
          batchName: selectedBatch?.name || 'Default Batch',
          enrollmentDate: serverTimestamp(),
          paymentStatus: 'pending_manual',
          enrollmentStatus: 'pending',
          price: Number(course?.price || 0),
        });

        // Also add to user's enrollments for visibility
        await setDoc(doc(firestore, 'users', user.uid, 'enrollments', enrollmentId), {
          id: enrollmentId,
          courseId,
          courseName: course?.name || courseId,
          batchId: values.batch,
          batchName: selectedBatch?.name || 'Default Batch',
          enrollmentDate: serverTimestamp(),
          paymentStatus: 'pending_manual',
          enrollmentStatus: 'pending',
        });

        setShowManualSuccess(true);
        toast({
          title: 'Enrollment Initiated',
          description: 'Please contact admin to complete your payment.',
        });
      }
    } catch (error) {
      console.error('Error during enrollment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showManualSuccess) {
    return (
      <div className="container mx-auto py-20 px-4">
        <Card className="max-w-2xl mx-auto text-center p-8 rounded-[32px] shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-black mb-4">Enrollment Pending!</CardTitle>
          <CardDescription className="text-lg mb-8">
            Your manual enrollment request has been received. To complete your enrollment, please contact our administrator for payment details.
          </CardDescription>
          
          <div className="bg-muted/50 rounded-2xl p-6 text-left space-y-4 mb-8">
            <h4 className="font-bold flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Admin Contact Details</h4>
            <div className="grid grid-cols-1 gap-3">
              <p className="flex items-center justify-between p-3 bg-white rounded-xl border">
                <span className="font-medium">Primary Contact</span>
                <span className="font-bold text-primary">076 691 4650</span>
              </p>
              <p className="flex items-center justify-between p-3 bg-white rounded-xl border">
                <span className="font-medium">Secondary Contact</span>
                <span className="font-bold text-primary">077 453 3233</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground italic mt-4">
              * Please mention your Name and Course Name when contacting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl" asChild>
              <a href="https://wa.me/94766914650" target="_blank" rel="noopener noreferrer">WhatsApp Support</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
                      <FormLabel className="text-base font-bold">Select Batch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choose a batch" /></SelectTrigger></FormControl>
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

                {selectedBatch && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-primary"><Calendar className="w-5 h-5" /> Batch Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground font-medium">Batch Name</p>
                          <p className="font-bold">{selectedBatch.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Schedule</p>
                          <p className="font-bold">{selectedBatch.schedule || 'Not announced'}</p>
                        </div>
                      </div>
                      
                      {selectedBatch.timetableImageUrl && (
                        <div className="mt-4 space-y-2">
                          <p className="text-muted-foreground font-medium text-sm flex items-center gap-2"><Info className="w-4 h-4" /> Timetable Image</p>
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden border shadow-sm bg-white">
                            <img src={selectedBatch.timetableImageUrl} alt="Timetable" className="object-contain w-full h-full" />
                          </div>
                        </div>
                      )}

                      {selectedBatch.timetableDetails && (
                        <div className="mt-2 p-3 bg-white rounded-xl border text-sm italic text-muted-foreground">
                          {selectedBatch.timetableDetails}
                        </div>
                      )}

                      <FormField control={form.control} name="confirmTimetable" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-white mt-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-bold cursor-pointer">I have reviewed and confirm the timetable</FormLabel>
                            <p className="text-xs text-muted-foreground">Please make sure you are comfortable with the batch timings before proceeding.</p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <FormLabel className="text-base font-bold">Payment Method</FormLabel>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 gap-3"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 rounded-2xl border bg-white cursor-pointer hover:border-primary/50 transition-colors">
                            <FormControl><RadioGroupItem value="website" /></FormControl>
                            <div className="flex-1">
                              <FormLabel className="font-bold cursor-pointer flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-primary" /> Pay through Website
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">Secure payment via PayHere (LKR)</p>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 rounded-2xl border bg-white cursor-pointer hover:border-primary/50 transition-colors">
                            <FormControl><RadioGroupItem value="manual" /></FormControl>
                            <div className="flex-1">
                              <FormLabel className="font-bold cursor-pointer flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" /> Pay Manually
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">Bank transfer or cash (Contact Admin)</p>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    paymentMethod === 'website' ? (
                      <><CreditCard className="mr-2 h-5 w-5" /> Proceed to Secure Payment</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-5 w-5" /> Confirm Enrollment Request</>
                    )
                  )}
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
