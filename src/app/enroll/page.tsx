
'use client';

import { useEffect, useActionState, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, UserPlus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { payhereUrls } from '@/lib/payhere';
import { enrollAction, type ServerActionState } from './actions';
import { collection } from 'firebase/firestore';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }).optional().or(z.literal('')),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  course: z.string({ required_error: 'Please select a course.' }),
  batch: z.string().optional(),
  freeDemo: z.boolean().default(false),
}).refine(data => data.freeDemo || data.batch, {
    message: "Please select a batch.",
    path: ["batch"],
});


type FormValues = z.infer<typeof formSchema>;


export default function EnrollPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [state, formAction, isPending] = useActionState(enrollAction, { success: false, message: '' });
  
  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      freeDemo: false,
    },
  });

  const selectedCourseId = form.watch("course");
  const isFreeDemo = form.watch("freeDemo");

  const batchesQuery = useMemoFirebase(
    () => (firestore && selectedCourseId ? collection(firestore, 'courses', selectedCourseId, 'batches') : null),
    [firestore, selectedCourseId]
  );
  const { data: batches, isLoading: batchesLoading } = useCollection(batchesQuery);


  useEffect(() => {
    if (state.message && !isPending) {
        if (state.success && state.payload) {
            // This is the payment redirection case, the form will submit automatically
        } else if (state.success) {
            // This is for non-payment cases like free demo
            toast({ title: 'Success!', description: state.message });
            form.reset();
        } else {
            // This is for errors
            toast({ variant: 'destructive', title: 'Error', description: state.message });
        }
    }
  }, [state, isPending, toast, form]);

  useEffect(() => {
    if (user) {
        form.reset({
            fullName: user.displayName || '',
            email: user.email || '',
            phone: '', // Keep phone empty for user to fill
            freeDemo: false,
        });
    }
  }, [user, form]);
  
  // Dynamic form submission
  useEffect(() => {
    if (state.success && state.payload) {
      const form = document.getElementById('payhere-form') as HTMLFormElement;
      if (form) {
        form.submit();
      }
    }
  }, [state.success, state.payload]);

  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Enroll Now</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Begin your journey to success. Secure your spot in one of our expert-led courses.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
            <div className="relative aspect-[4/3] lg:aspect-auto h-64 lg:h-full w-full max-w-lg mx-auto lg:max-w-none">
                <Image 
                    src="/enr.png"
                    alt="Students enrolling in Smart Labs courses"
                    fill
                    className="rounded-xl object-cover"
                />
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Application Form</CardTitle>
                <CardDescription>Complete the form to enroll.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form action={formAction} className="space-y-6">
                    {user?.uid && <input type="hidden" name="userId" value={user.uid} />}
                    {user?.email && <input type="hidden" name="email" value={user.email} />}
                    
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} disabled={!!user?.email}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+94 123 456 789" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="course" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Course</FormLabel>
                          <Select onValueChange={(value) => { field.onChange(value); form.setValue('batch', ''); }} defaultValue={field.value} name={field.name}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Choose your desired course" /></SelectTrigger></FormControl>
                            <SelectContent>
                               {coursesLoading ? <SelectItem value="loading" disabled>Loading courses...</SelectItem> : 
                                courses?.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>{course.name} - LKR {course.price?.toLocaleString() || 'N/A'}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )}/>

                    {selectedCourseId && !isFreeDemo && (
                         <FormField control={form.control} name="batch" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Select Batch</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a batch for your course" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {batchesLoading ? <SelectItem value="loading" disabled>Loading batches...</SelectItem> :
                                 batches && batches.length > 0 ? batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.name} ({batch.schedule || 'Schedule TBD'})</SelectItem>
                                 )) : <SelectItem value="no-batch" disabled>No batches available for this course.</SelectItem>
                                }
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}/>
                    )}

                    <FormField control={form.control} name="freeDemo" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} name={field.name} /></FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Request a Free Demo Class</FormLabel>
                            <p className="text-sm text-muted-foreground">Check this box to schedule a free trial class. No payment required.</p>
                          </div>
                        </FormItem>
                    )}/>
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" /> Secure Payment</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            After submitting, you will be redirected to our secure payment gateway. For free demos, no payment is required.
                        </p>
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isPending || coursesLoading}>
                      {isPending ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> ) : (
                        <><UserPlus className="mr-2 h-4 w-4" />
                        {isFreeDemo ? 'Request Free Demo' : 'Submit & Proceed to Payment'}</>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {state.success && state.payload && (
        <form id="payhere-form" method="post" action={payhereUrls.checkout} className="hidden">
            {Object.entries(state.payload).map(([key, value]) => (
                <input type="hidden" name={key} value={value as string} key={key} />
            ))}
        </form>
      )}
    </div>
  );
}
