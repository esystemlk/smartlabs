'use client';

import { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, View, Trophy, Sparkles, ArrowRight, Zap, Clock, Calendar, ShieldCheck, Monitor, MapPin, Users, BookOpen, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RegisterButton } from '@/components/courses/register-button';

export default function CoursesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const catalog = [
    {
      id: 'pte-boostify',
      name: 'PTE Boostify Package',
      subtitle: 'Exam-focused strategies with AI practice',
      themeColor: 'accent-3',
      duration: '13 Days | 20 Hours',
      days: 'Monday – Friday',
      startTime: '2.30 PM – 4.30 PM',
      features: [
        'All live class recordings',
        'Exam focused strategies',
        'Smart practice methods',
        'Individual feedback for difficult questions',
        '8.00 PM batch available',
        'Next Intake: 16 March (8.00 PM), 23 March (2.30 PM)'
      ].join(', '),
      price: 30000
    },
    {
      id: 'pte-boostify-grammar',
      name: 'PTE Boostify + Grammar Clinic Program',
      subtitle: 'Full strategy + grammar foundation',
      themeColor: 'primary',
      duration: '21 Days | 42 Hours',
      days: 'Monday – Friday',
      startTime: '2.30 PM – 4.30 PM',
      features: [
        'All live class recordings available',
        'Grammar Clinic: Saturday & Sunday',
        'Grammar Clinic Time: 4.00 PM – 6.00 PM',
        'Grammar Clinic Duration: 1 Month'
      ].join(', '),
      price: 35000
    },
    {
      id: 'pte-hybrid',
      name: 'PTE Hybrid (Online + Physical)',
      subtitle: 'Zoom + Rajagiriya campus weekend',
      themeColor: 'accent-2',
      duration: 'Online 20 Hours + Physical 16 Hours/month',
      days: 'Online: Mon–Fri | Physical: Sat & Sun',
      startTime: 'Online: 8.00–10.00 PM or 2.30–4.30 PM',
      features: [
        'Online via Zoom',
        'Grammar Clinic: Sat & Sun 4.00 – 6.00 PM (1 Month)',
        'Physical: Sat & Sun 8.30 – 10.30 AM',
        'Starting Date: 14th March',
        'Location: Rajagiriya – Janajaya Building'
      ].join(', '),
      price: 50000
    },
    {
      id: 'pte-physical',
      name: 'PTE Physical Classes',
      subtitle: 'Face-to-face coaching at Rajagiriya',
      themeColor: 'accent',
      duration: '16 Hours per month',
      days: 'Saturday & Sunday',
      startTime: '8.30 AM – 10.30 AM',
      features: [
        'Location: Rajagiriya – Janajaya Building',
        'Bonus: Complimentary Grammar Online Sessions'
      ].join(', '),
      price: 40000
    },
    {
      id: 'pte-recorded',
      name: 'PTE Recorded Sessions Program',
      subtitle: 'Self-Paced Learning Program',
      themeColor: 'orange',
      duration: 'Flexible',
      days: 'Self-paced',
      features: [
        'Access to latest live class recordings',
        'Class materials',
        'Extra practice materials',
        'Flexible learning schedule',
        'Note: Live classes provide direct lecturer feedback',
        'Note: Recorded program is fully self-study based'
      ].join(', '),
      price: 0
    },
    {
      id: 'ielts-boostify',
      name: 'IELTS Boostify Package',
      subtitle: 'Online via Zoom',
      themeColor: 'accent-3',
      duration: '1 Month | 16 Hours',
      days: 'Tuesday & Saturday',
      startTime: '8.00 PM – 10.00 PM',
      features: [
        'Complete IELTS exam strategies',
        'Speaking mock exams',
        'Real exam style practice platform',
        '2 months class recordings',
        'Structured lessons for all modules'
      ].join(', '),
      price: 25000
    },
    {
      id: 'ielts-mastery',
      name: 'IELTS Mastery Package',
      subtitle: 'Advanced training and difficult questions focus',
      themeColor: 'primary',
      duration: '1 Month | 24 Hours',
      days: 'Tuesday, Wednesday, Saturday',
      startTime: '8.00 PM – 10.00 PM',
      features: [
        'Everything in Boostify package',
        'Extra 8 hours advanced training',
        'Special focus on difficult questions',
        'Speaking mock tests',
        '2 months recordings access'
      ].join(', '),
      price: 35000
    },
    {
      id: 'ielts-hybrid',
      name: 'IELTS Hybrid (Online + Physical)',
      subtitle: 'Online + weekend campus sessions',
      themeColor: 'accent-2',
      duration: '32 Hours (Online 16 + Physical 16)',
      days: 'Online: Tue & Sat | Physical: Sat & Sun',
      startTime: 'Online: 8.00 PM – 10.00 PM | Physical: 11.30 AM – 1.30 PM',
      features: [
        'Full IELTS strategies',
        'Speaking mock exams',
        'Practice platforms with scoring',
        '2 months recordings',
        'Extra physical practice sessions'
      ].join(', '),
      price: 50000
    },
    {
      id: 'ielts-physical',
      name: 'IELTS Physical Class Package',
      subtitle: 'On-site learning with feedback',
      themeColor: 'accent',
      duration: '1 Month | 16 Hours',
      days: 'Saturday & Sunday',
      startTime: '11.30 AM – 1.30 PM',
      features: [
        'Face-to-face IELTS training',
        'Strategies for high band score',
        'Speaking practice with feedback',
        'Structured lessons for all modules',
        'Seats: Only 12 students per batch'
      ].join(', '),
      price: 40000
    }
  ];
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
                Elite preparation programs for PTE & IELTS. <br className="hidden md:block" />
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

            {coursesLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {catalog.map((course, idx) => {
                  let themeConfig = {
                    gradient: "from-blue-600/20 to-indigo-600/20",
                    bg: "bg-[#1E40AF]",
                    text: "text-blue-600",
                    border: "border-blue-600/30",
                    icon: BookOpen
                  };

                  if (course.themeColor === 'orange') {
                    themeConfig = { gradient: "from-orange-500/20 to-red-500/20", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/30", icon: Users };
                  } else if (course.themeColor === 'primary') {
                    themeConfig = { gradient: "from-primary/20 to-accent-1/20", bg: "bg-primary", text: "text-primary", border: "border-primary/20", icon: Trophy };
                  } else if (course.themeColor === 'accent') {
                    themeConfig = { gradient: "from-accent/20 to-accent-2/20", bg: "bg-accent", text: "text-accent", border: "border-accent/30", icon: Globe };
                  } else if (course.themeColor === 'accent-2') {
                    themeConfig = { gradient: "from-accent-2/20 to-accent/20", bg: "bg-accent-2", text: "text-accent-2", border: "border-accent-2/30", icon: Sparkles };
                  } else if (course.themeColor === 'accent-3') {
                    themeConfig = { gradient: "from-accent-3/20 to-accent-2/20", bg: "bg-accent-3", text: "text-accent-3", border: "border-accent-3/30", icon: Zap };
                  }

                  const Icon = themeConfig.icon;
                  const featureList = (course.features || "").split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${themeConfig.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <Card className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500 hover:shadow-primary/20">
                        <div className={`${themeConfig.bg} p-6 text-white relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Icon className="h-20 w-20 rotate-12" />
                          </div>
                          <CardTitle className="text-2xl font-black font-headline leading-tight">{course.name}</CardTitle>
                          {course.subtitle && <p className="text-white/80 text-sm mt-2 font-medium italic">{course.subtitle}</p>}
                        </div>
                        <CardContent className="flex-grow p-8 space-y-6">
                          <div className="space-y-4">
                            {course.startTime && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className={`text-sm font-bold uppercase flex items-center gap-2 text-muted-foreground`}>
                                  <Clock className={`h-4 w-4 ${themeConfig.text}`} /> Start Time
                                </span>
                                <span className="font-black text-right">{course.startTime}</span>
                              </div>
                            )}
                            {course.days && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className={`text-sm font-bold uppercase flex items-center gap-2 text-muted-foreground`}>
                                  <Calendar className={`h-4 w-4 ${themeConfig.text}`} /> Days
                                </span>
                                <span className="font-black text-right">{course.days}</span>
                              </div>
                            )}
                            {course.duration && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className={`text-sm font-bold uppercase flex items-center gap-2 text-muted-foreground`}>
                                  <Clock className={`h-4 w-4 ${themeConfig.text}`} /> Duration
                                </span>
                                <span className="font-black text-right">{course.duration}</span>
                              </div>
                            )}
                          </div>

                          {false && (
                            <div className={`p-4 rounded-2xl bg-muted/50 border ${themeConfig.border} space-y-2`}>
                              <div className={`flex items-center gap-2 ${themeConfig.text} font-black text-sm uppercase`}>
                                <Check className="h-4 w-4" /> 
                              </div>
                            </div>
                          )}

                          {featureList.length > 0 && (
                            <ul className="space-y-3">
                              {featureList.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium">
                                  <Check className={`h-4 w-4 ${themeConfig.text} mt-1 shrink-0`} />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          

                          <div className="pt-6">
                            <div className="text-center space-y-1">
                              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Investment</p>
                              <div className="text-4xl font-black text-foreground font-headline tracking-tighter">LKR {course.price?.toLocaleString() || 0}</div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-8 pt-0 gap-3">
                          <RegisterButton
                            courseId={course.id}
                            courseName={course.name}
                            price={course.price || 0}
                            payhereButtonId={undefined}
                            className={`w-full h-14 rounded-2xl ${themeConfig.bg} hover:opacity-90 text-white font-black text-lg shadow-xl group`}
                          >
                            Register Now
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </RegisterButton>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Refund Policy Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
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
            )}
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
      </section>
    </div>
  );
}
