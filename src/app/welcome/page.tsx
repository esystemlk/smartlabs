'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, CircleNotch, CalendarBlank as CalendarIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const TOTAL_STEPS = 5;

export default function WelcomePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 2
  const [targetExam, setTargetExam] = useState<string>('');
  const [targetScore, setTargetScore] = useState<string>('');
  const [examDate, setExamDate] = useState<Date>();

  // Step 3
  const [phone, setPhone] = useState<string>('');
  const [homeContact, setHomeContact] = useState<string>('');

  // Step 4
  const [address, setAddress] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  // Step 5
  const [aboutSelf, setAboutSelf] = useState<string>('');


  const handleNextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'User session not found.' });
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
        // Step 2
        targetExam: targetExam || null,
        targetScore: targetScore || null,
        examDate: examDate ? format(examDate, 'yyyy-MM-dd') : null,
        // Step 3
        phone: phone || user.phoneNumber || null,
        homeContact: homeContact || null,
        // Step 4
        address: address || null,
        country: country || null,
        // Step 5
        aboutSelf: aboutSelf || null,
      });

      toast({
        title: 'Setup Complete!',
        description: 'Your dashboard is now personalized for you.',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your preferences. Please try again.',
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <Image src="/logo.png" alt="Smart Labs Logo" width={80} height={80} className="animate-pulse-glow" />
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="w-full bg-muted/30">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader>
            <div className="text-center">
              <Image src="/logo.png" alt="Smart Labs Logo" width={64} height={64} className="mx-auto mb-4" />
              <CardTitle className="font-headline text-3xl">Welcome, {user.displayName}!</CardTitle>
              <CardDescription className="mt-2 text-lg">Let's complete your profile.</CardDescription>
            </div>
            <Progress value={progress} className="mt-6" />
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col justify-center">
            {step === 1 && (
              <div className="text-center animate-fade-in">
                <h3 className="font-semibold text-2xl mb-4">Your Path to Success Starts Here</h3>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">In the next few steps, we'll ask a few questions to create a personalized experience just for you.</p>
                <Button onClick={handleNextStep} size="lg">
                  Let's Go <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <Label className="text-xl font-semibold">Which exam are you preparing for?</Label>
                  <Select onValueChange={setTargetExam} value={targetExam}>
                    <SelectTrigger className="h-12 text-lg mt-2">
                      <SelectValue placeholder="Select your exam..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PTE">PTE (Pearson Test of English)</SelectItem>
                      <SelectItem value="IELTS">IELTS (International English Language Testing System)</SelectItem>
                      <SelectItem value="CELPIP">CELPIP (Canadian English Language Proficiency Index Program)</SelectItem>
                      <SelectItem value="Other">Other / Not decided yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target-score" className="text-lg font-semibold">What's your target score?</Label>
                  <p className="text-sm text-muted-foreground">e.g., "79+" for PTE, "Band 8.0" for IELTS.</p>
                  <Input id="target-score" value={targetScore} onChange={(e) => setTargetScore(e.target.value)} placeholder="Enter target score" className="h-12 text-lg mt-2" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">When is your exam date?</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 text-lg mt-2", !examDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {examDate ? format(examDate, "PPP") : <span>Pick a date (Optional)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={examDate} onSelect={setExamDate} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleNextStep} className="mt-4 w-full" size="lg">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <Label htmlFor="phone" className="text-xl font-semibold">Contact Information</Label>
                  <p className="text-sm text-muted-foreground mb-2">How can we reach you?</p>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-lg font-semibold">Your Mobile Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +94 77 123 4567" className="h-12 text-lg mt-2" />
                </div>
                <div>
                  <Label htmlFor="homeContact" className="text-lg font-semibold">Home Contact Number</Label>
                  <Input id="homeContact" value={homeContact} onChange={(e) => setHomeContact(e.target.value)} placeholder="(Optional)" className="h-12 text-lg mt-2" />
                </div>
                <Button onClick={handleNextStep} className="mt-4 w-full" size="lg">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <Label className="text-xl font-semibold">Where are you from?</Label>
                </div>
                <div>
                  <Label htmlFor="address" className="text-lg font-semibold">Your Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 123 Main St, Colombo" className="h-12 text-lg mt-2" />
                </div>
                <div>
                  <Label htmlFor="country" className="text-lg font-semibold">Country</Label>
                  <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Sri Lanka" className="h-12 text-lg mt-2" />
                </div>
                <Button onClick={handleNextStep} className="mt-4 w-full" size="lg">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            )}

            {step === 5 && (
              <div className="animate-fade-in space-y-4">
                <Label className="text-xl font-semibold" htmlFor="about-self">Tell us a bit about yourself</Label>
                <p className="text-sm text-muted-foreground">What are your goals? What do you hope to achieve? (Optional)</p>
                <Textarea id="about-self" value={aboutSelf} onChange={(e) => setAboutSelf(e.target.value)} className="min-h-32 text-base" />
                <Button onClick={handleFinish} className="mt-4 w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <CircleNotch weight="bold" className="mr-2 h-4 w-4 animate-spin" /> : <Check weight="bold" className="mr-2 h-4 w-4" />}
                  Finish Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
