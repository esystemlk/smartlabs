'use client';

import { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, View, Trophy, Sparkles, ArrowRight, Zap, Clock, Calendar, ShieldCheck, Monitor, MapPin, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LMS_URL } from '@/lib/constants';

export default function CoursesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

  const enrollmentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments?.map(e => e.id) || []);
  }, [enrollments]);

  const isLoading = coursesLoading || enrollmentsLoading;

  return (
    <div className="w-full relative overflow-hidden">
      {/* Decorative Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-accent-2/5 rounded-full blur-[100px]" />
      </div>

      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/60 text-xs font-black uppercase tracking-[0.2em] mb-6">
                Academic Excellence
              </div>
              <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tighter mb-8 leading-[0.9]">
                Master Your <br />
                <span className="gradient-text italic">Success Path</span>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                Elite preparation programs for PTE. <br className="hidden md:block" />
                Engineered for results, delivered with excellence.
              </p>
            </motion.div>
          </div>


          {/* Intensive & Specialized Programs Section */}
          <div className="space-y-16">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-black uppercase tracking-widest"
              >
                <Sparkles className="h-4 w-4" />
                Premium Success Packages
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Choice of <span className="gradient-text italic">Champions</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Select the targeted preparation path that fits your schedule and goals. Professional guidance, AI feedback, and guaranteed support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Grammar Clinic Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                  <div className="bg-[#1E40AF] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BookOpen className="h-20 w-20 rotate-12" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 uppercase font-black tracking-widest text-[10px]">Step 1: Foundation</Badge>
                    <CardTitle className="text-2xl font-black font-headline leading-tight underline decoration-orange-500 decoration-4 underline-offset-4">Grammar Clinic</CardTitle>
                    <p className="text-white/80 text-sm mt-2 font-medium italic">Essential for PTE Success</p>
                  </div>
                  <CardContent className="flex-grow p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" /> Days
                        </span>
                        <span className="font-black">Sat & Sun</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" /> Duration
                        </span>
                        <span className="font-black">Weekend Program</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "Upgrade your grammar. Upgrade your score. Build the foundation required for professional English exams."
                    </p>

                    <div className="pt-6">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Investment</p>
                        <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR 5,000</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 gap-3">
                    <Button asChild variant="outline" className="flex-1 h-12 rounded-xl border-blue-600/30 hover:bg-blue-600/5">
                      <Link href="/courses/grammar-clinic">Details</Link>
                    </Button>
                    <Button asChild className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase shadow-xl shadow-orange-600/20">
                      <Link href={LMS_URL}>Register</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              {/* Package 02 - Boostify + Boost Foundation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-1/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500 hover:shadow-primary/20">
                  <div className="bg-primary p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Trophy className="h-20 w-20 rotate-12" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 uppercase font-black tracking-widest text-[10px]">Most Recommended</Badge>
                    <CardTitle className="text-2xl font-black font-headline leading-tight">Boostify + Foundation Package</CardTitle>
                    <p className="text-white/80 text-sm mt-2 font-medium italic">Essential for high writing scores</p>
                  </div>
                  <CardContent className="flex-grow p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" /> Start Time
                        </span>
                        <span className="font-black">2:30 PM - 4:30 PM SLT</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" /> Days
                        </span>
                        <span className="font-black">Monday - Friday</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" /> Duration
                        </span>
                        <span className="font-black">21 Days | 42 Hours</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                        <Check className="h-4 w-4" /> Grammar Clinic Included
                      </div>
                      <p className="text-xs text-muted-foreground italic">Sat & Sun (4pm - 6pm) for one full month</p>
                    </div>

                    <ul className="space-y-3">
                      {["Full live class recordings", "Full month fallback videos", "Essential writing grammar", "Personalized boost focus"].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium">
                          <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Course Fee</p>
                        <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR 35,000</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 group">
                      <Link href={LMS_URL}>
                        Register Now
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Package 01 - PTE Boostify */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-3/20 to-accent-2/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                  <div className="bg-accent-3 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Zap className="h-20 w-20 -rotate-12" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 uppercase font-black tracking-widest text-[10px]">High Intensity</Badge>
                    <CardTitle className="text-2xl font-black font-headline tracking-tight">PTE Boostify Package</CardTitle>
                    <p className="text-white/80 text-sm mt-2 font-medium italic">Exam-focused strategy mastery</p>
                  </div>
                  <CardContent className="flex-grow p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                        <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                          <span>Batch 02 (Mar 2nd)</span>
                          <span className="text-accent-3">2:30 PM - 4:30 PM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                          <span>Batch 01 (Mar 16th)</span>
                          <span className="text-accent-3">8:00 PM - 10:00 PM</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Duration</span>
                        <span className="font-black">13 Days | 20 Hours</span>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {["Exam focus Strategies", "Smart practice methods", "Individual feedback", "Complete class recordings", "AI Platform Access"].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium">
                          <Check className="h-4 w-4 text-accent-3 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Course Fee</p>
                        <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR 30,000</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild className="w-full h-14 rounded-2xl bg-accent-3 hover:bg-accent-3/90 text-white font-black text-lg shadow-xl shadow-accent-3/20 group">
                      <Link href={LMS_URL}>
                        Enroll Now
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>



              {/* Package 03 - Physical + Online Hybrid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                  <div className="bg-orange-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Users className="h-20 w-20" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 uppercase font-black tracking-widest text-[10px]">Premium Hybrid</Badge>
                    <CardTitle className="text-2xl font-black font-headline tracking-tight">Classic PTE Physical + Online</CardTitle>
                    <p className="text-white/80 text-sm mt-2 font-medium italic text-center">Physical Classes at Rajagiriya</p>
                  </div>
                  <CardContent className="flex-grow p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                        <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                          <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> Online (Mon-Fri)</span>
                          <span className="text-orange-600">8 PM - 10 PM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Physical (Sat-Sun)</span>
                          <span className="text-orange-600">8:30 AM - 10:30 AM</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Grammar Clinic</span>
                        <span className="font-black text-xs">Included (Sat & Sun 4pm)</span>
                      </div>
                    </div>

                    <div className="text-sm font-medium p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                      <span className="text-orange-500 font-black">Location:</span> Janajaya Building, Rajagiriya
                    </div>

                    <ul className="space-y-3">
                      {["20 hours Zoom Online Pro", "16 hours Physical Mastery", "One month Grammar Clinic", "One-on-one strategy review"].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium">
                          <Check className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Course Fee</p>
                        <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR 50,000</div>
                        <p className="text-[10px] text-red-500 font-bold">*One-time payment only</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 group">
                      <Link href={LMS_URL}>
                        Reserve Spot
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Package 04 - Physical Only */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                  <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <MapPin className="h-20 w-20" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 uppercase font-black tracking-widest text-[10px]">Physical Excellence</Badge>
                    <CardTitle className="text-2xl font-black font-headline tracking-tight">Classic PTE Physical Class</CardTitle>
                    <p className="text-white/80 text-sm mt-2 font-medium italic">Face-to-face coaching</p>
                  </div>
                  <CardContent className="flex-grow p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" /> Days
                        </span>
                        <span className="font-black">Sat & Sun</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" /> Time
                        </span>
                        <span className="font-black">8:30 AM - 10:30 AM</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/10">
                        <span className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2 text-blue-600 font-black">Bonus</span>
                        <span className="font-black text-xs">Grammar Clinic Included</span>
                      </div>
                    </div>

                    <div className="text-sm font-medium p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                      <span className="text-blue-600 font-black">Location:</span> Janajaya Building, Rajagiriya
                    </div>

                    <ul className="space-y-3">
                      {["16 hours Physical Mastery per month", "One month Grammar Clinic", "Focus on all 4 PTE modules", "Interactive face-to-face feedback"].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium">
                          <Check className="h-4 w-4 text-blue-600 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Course Fee</p>
                        <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR 40,000</div>
                        <p className="text-[10px] text-red-500 font-bold">*One-time payment only</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20 group">
                      <Link href={LMS_URL}>
                        Enroll Physically
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Refund Policy Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <Card className="h-full flex flex-col justify-center p-8 border-dashed border-2 border-red-500/30 bg-red-500/5 rounded-[40px] text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black font-headline uppercase text-red-500">Strict Policy Notice</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Smart Labs follows a <span className="text-red-600 font-bold">strict no-refund policy</span> for all courses and payments.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Once payment is made, it is considered final and cannot be refunded under any circumstances.
                  </p>
                </Card>
              </motion.div>
            </div>
            {/* Success Bundle Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-20 relative rounded-[40px] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 p-1 shadow-2xl"
            >
              <div className="bg-white/5 backdrop-blur-3xl rounded-[38px] p-8 lg:p-16 text-white text-center space-y-10">
                <div className="space-y-4">
                  <Badge className="bg-orange-500 text-white border-none py-1.5 px-4 font-black tracking-widest uppercase text-xs">Bundle Offer</Badge>
                  <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">Grammar Clinic <span className="text-orange-500">+</span> PTE Boostify</h2>
                  <p className="text-white/80 max-w-2xl mx-auto text-xl font-medium leading-relaxed">
                    The ultimate conversion path. Build the foundation in the Clinic, then master the strategies in Boostify.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16">
                  <div className="space-y-2">
                    <div className="text-sm font-black uppercase text-orange-500 tracking-widest">Step 01</div>
                    <div className="text-2xl font-black">Grammar Clinic</div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-white/30 rotate-90 md:rotate-0" />
                  <div className="space-y-2">
                    <div className="text-sm font-black uppercase text-orange-500 tracking-widest">Step 02</div>
                    <div className="text-2xl font-black">PTE Boostify</div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button asChild size="xl" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-black px-12 h-16 text-xl group shadow-2xl shadow-orange-600/40">
                    <Link href={`https://wa.me/94766914650?text=I'm interested in the Grammar Clinic + PTE Boostify Bundle Offer`}>
                      Claim Bundle Offer
                      <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
