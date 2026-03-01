'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Video,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LMS_URL } from "@/lib/constants";

const boostifyFeatures = [
  "AI scoring practice with instant feedback",
  "Full Google Drive access with updated materials",
  "Live class recordings available for 2 months",
  "Individual feedback on difficult question types",
];

const physicalFeatures = [
  "16 hours physical class sessions",
  "25 hours online Boostify session included",
  "Total 41 hours of comprehensive training",
  "Direct interaction with instructors",
];

export default function PTE() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-1/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              <span>PTE Academic Preparation</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              PTE Preparation{" "}
              <span className="gradient-text">Course</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Master the Pearson Test of English with expert strategies and personalized feedback.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link href="#courses">
                  View Study Packages
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="backdrop-blur-sm bg-white/5 border-white/20">
                <Link href="https://wa.me/94766914650?text=I'd like a free consultation for PTE">WhatsApp Consultation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About PTE Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-1/10 text-accent-1 text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" />
                <span>About the Exam</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                About the PTE Exam
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                PTE (Pearson Test of English) Academic is an English language test used for study, work, and migration purposes. Preparing for PTE focuses on building strong communication skills and understanding the exam format. The test covers four main areas: Speaking, Writing, Reading, and Listening.
              </p>
              <h3 className="font-semibold text-lg mb-4">PTE preparation helps students improve:</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                  <span>Fluency and pronunciation for speaking clearly and confidently</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                  <span>Grammar and structure for writing well-organized responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                  <span>Reading skills to understand texts quickly and accurately</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                  <span>Listening skills to follow different accents and speech patterns</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Training includes practice with real exam-style questions, time management techniques, and regular feedback to help students improve where needed. With proper guidance and consistent practice, students can achieve their target scores.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-video"
            >
              <video
                src="/pte.mp4"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                className="w-full h-full rounded-2xl shadow-2xl object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Course Offerings */}
      <section className="py-20 lg:py-28 relative overflow-hidden" id="courses">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              <span>Investment in Your Future</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Strategic PTE <span className="gradient-text italic">Paths</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you need a foundation or physical coaching, we have the specialized package to guarantee your success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Package 02 - Boostify + Boost Foundation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[40px] p-8 lg:p-12 border-2 border-primary/20 flex flex-col"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black font-headline mb-2">Package 02: Boostify + Foundation</h3>
                  <p className="text-primary font-bold italic">The ultimate writing score booster</p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                  <span className="text-2xl font-black text-primary">LKR 35,000</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>Time:</strong> 2:30 PM - 4:30 PM SLT</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span><strong>Days:</strong> Monday - Friday</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-green-600 font-bold">
                    <CheckCircle className="h-4 w-4" />
                    <span><strong>Duration:</strong> 21 Days | 42 Hours</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-accent-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Grammar Clinic Included</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                {["Starting March 2nd (Batch 02)", "All live class recordings", "Full one-month fallback videos", "Focus on essential writing grammar", "Grammar: Sat/Sun 4pm-6pm"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="xl" className="w-full rounded-2xl shadow-xl" asChild>
                <Link href={LMS_URL}>Secure Slot Now</Link>
              </Button>
            </motion.div>

            {/* Package 01 - PTE Boostify */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[40px] p-8 lg:p-12 border-2 border-accent-3/20 flex flex-col"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black font-headline mb-2">Package 01: PTE Boostify</h3>
                  <p className="text-accent-3 font-bold italic">Focused exam strategies</p>
                </div>
                <div className="bg-accent-3/10 px-4 py-2 rounded-2xl border border-accent-3/20">
                  <span className="text-2xl font-black text-accent-3">LKR 30,000</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-accent-3/5 border border-accent-3/10 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-accent-3 mb-1">Batch 02 (Mar 2nd)</p>
                    <p className="text-xs font-bold font-headline">2:30 PM - 4:30 PM SLT</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-accent-3 mb-1">Batch 01 (Mar 16th)</p>
                    <p className="text-xs font-bold font-headline">8:00 PM - 10:00 PM SLT</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                {["Duration: 13 Days | 20 Hours", "Exam focus Strategies", "Smart practice methods", "Individual feedback (Hard tasks)", "Complete recordings access"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full rounded-2xl bg-accent-3 hover:bg-accent-3/90 text-white shadow-xl h-14 font-black" asChild>
                <Link href={LMS_URL}>Enroll Now</Link>
              </Button>
            </motion.div>

            {/* Package 03 - Hybrid Physical */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[40px] p-8 lg:p-12 border-2 border-orange-500/20 bg-orange-500/5 flex flex-col"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500 rounded-2xl text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-headline">Classic Physical + Online</h3>
                    <p className="text-orange-600 font-bold text-sm">The Premium Hybrid Experience</p>
                  </div>
                </div>
                <div className="bg-orange-500 text-white px-4 py-2 rounded-2xl shadow-lg">
                  <span className="text-xl font-black">LKR 50,000</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-6 rounded-3xl bg-white/50 dark:bg-black/20 border border-orange-200">
                  <div className="flex items-center gap-2 mb-4 text-orange-600 font-black uppercase text-xs">
                    <MapPin className="h-4 w-4" /> Rajagiriya Campus
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Online (M-F)</p>
                      <p className="text-sm font-bold font-headline">8 PM - 10 PM</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Physical (S-S)</p>
                      <p className="text-sm font-bold font-headline">8:30 AM - 10:30 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                {["20 Hours Online Pro Classes", "16 Hours Physical Face-to-Face", "Starts: 14th of March", "One Month Grammar Clinic Included", "Strict No-Refund Policy"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-xl h-14 font-black" asChild>
                <Link href={LMS_URL}>Secure Spot</Link>
              </Button>
            </motion.div>

            {/* Package 04 - Physical Mastery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-[40px] p-8 lg:p-12 border-2 border-blue-500/20 bg-blue-500/5 flex flex-col"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-headline">PTE Physical Class</h3>
                    <p className="text-blue-600 font-bold text-sm">Face-to-face coaching</p>
                  </div>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                  <span className="text-xl font-black">LKR 40,000</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-6 rounded-3xl bg-white/50 dark:bg-black/20 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4 text-blue-600 font-black uppercase text-xs">
                    <Calendar className="h-4 w-4" /> Weekend Intense
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Sat & Sun Only</p>
                    <p className="text-sm font-bold font-headline">8:30 AM - 10:30 AM @ Rajagiriya</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-grow">
                {["16 Hours Physical per month", "Starts: 14th of March", "Full Grammar Clinic Included", "Individual attention guaranteed", "One-time payment only"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl h-14 font-black" asChild>
                <Link href={LMS_URL}>Enroll Physically</Link>
              </Button>
            </motion.div>
          </div>

          <div className="mt-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Button variant="outline" size="xl" className="rounded-full border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground font-black group transition-all" asChild>
                <Link href="/courses">
                  Explore All Study Programs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card rounded-3xl p-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Ace Your PTE Exam?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Book a free consultation to discuss your goals and find the perfect course for you.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link href="/contact">
                Book a Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
