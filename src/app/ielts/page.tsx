
'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  BookOpen,
  Headphones,
  PenTool,
  MessageSquare,
  Target,
  Monitor,
  Users,
  Check,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LMS_URL } from "@/lib/constants";

const ieltsSkills = [
  { icon: Headphones, title: "Listening", description: "Understand spoken English in various accents and contexts" },
  { icon: BookOpen, title: "Reading", description: "Comprehend academic and general reading passages" },
  { icon: PenTool, title: "Writing", description: "Task 1 descriptions and Task 2 essays" },
  { icon: MessageSquare, title: "Speaking", description: "Face-to-face interview with an examiner" },
];

const courseFeatures = [
  "AI scoring practice with detailed feedback",
  "Individual attention on weak areas",
  "Speaking practice sessions included",
  "Vocabulary development support",
  "Mock tests with real exam conditions",
  "Expert instructors with proven track record",
];

export default function IELTS() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              <span>IELTS Preparation</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              IELTS Preparation{" "}
              <span className="text-accent">Course</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Achieve your target band score with our comprehensive IELTS training.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" asChild>
                <Link href="#courses">
                  View Study Packages
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="backdrop-blur-sm bg-white/5 border-white/20">
                <Link href="https://wa.me/94766914650?text=I'd like a free consultation for IELTS">WhatsApp Consultation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About IELTS Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" />
                <span>About the Exam</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                About IELTS Preparation
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The International English Language Testing System (IELTS) is the world's most popular English language proficiency test for higher education and global migration. It assesses your abilities across all four language skills.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our program focuses on strategy development, time management techniques, and intensive practice with mock tests to help you achieve your target band score.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-video"
            >
              <video
                src="/ielts.mp4"
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

      {/* Course Details */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-muted/5" id="courses">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-black uppercase tracking-widest mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Choice of Champions</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-black text-foreground mb-4">
              IELTS Success <span className="text-accent italic">Packages</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium italic">
              Strategic pathways to target Band 7+. All programs include full month access to the Grammar Clinic.
            </p>
          </motion.div>

          {/* Core Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-20">
            {/* Package 01 - Online Mastery */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl rounded-[40px] overflow-hidden hover:translate-y-[-10px] transition-all duration-500 border border-white/10">
                <div className="bg-accent p-8 text-white relative">
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Online Only</div>
                  <h3 className="text-3xl font-black font-headline">IELTS Mastery (Online)</h3>
                  <p className="text-white/80 font-medium italic mt-2">Limited to 10 Students per batch</p>
                </div>
                <div className="p-8 flex-grow space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs py-2 border-b border-white/10">
                      <span className="font-black uppercase text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" /> Start Date
                      </span>
                      <span className="font-black">12th March, Thursday</span>
                    </div>
                    <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground font-headline">
                        <span>Main Sessions (Thu & Fri)</span>
                        <span className="text-accent">8PM - 10PM SLT</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-secondary-foreground/60 font-headline">
                        <span>Mastery Sessions (Mon & Fri)</span>
                        <span className="text-secondary-foreground">8PM - 10PM (2 Weeks)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-secondary-foreground/60 font-headline">
                        <span>Grammar clinic (Sat & Sun)</span>
                        <span className="text-secondary-foreground">4PM - 6PM</span>
                      </div>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-3">
                    {["Full class recordings", "AI practice platform access", "Strategies for all 4 modules", "Writing templates + samples", "Speaking practice + feedback", "Progress monitoring"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total investment</p>
                      <div className="text-4xl font-black text-foreground font-headline">LKR 40,000</div>
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0">
                  <Button asChild variant="accent" size="xl" className="w-full rounded-2xl h-16 font-black shadow-xl shadow-accent/20 group">
                    <Link href={LMS_URL}>
                      Enroll in Online Mastery
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Package 01 - Physical Excellence */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-blue-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl rounded-[40px] overflow-hidden hover:translate-y-[-10px] transition-all duration-500 border border-white/10">
                <div className="bg-blue-600 p-8 text-white relative">
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Physical Access Only</div>
                  <h3 className="text-3xl font-black font-headline">IELTS Physical Only</h3>
                  <p className="text-white/80 font-medium italic mt-2">Available Only 12 Seats</p>
                </div>
                <div className="p-8 flex-grow space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs py-2 border-b border-white/10">
                      <span className="font-black uppercase text-muted-foreground">Start Date</span>
                      <span className="font-black">14th March, Saturday</span>
                    </div>
                    <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                        <span>Sessions (Sat & Sun)</span>
                        <span className="text-blue-600">11.30AM - 1.30PM</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-accent font-black">
                        <span>Grammar clinic (Sat & Sun)</span>
                        <span>4PM - 6PM</span>
                      </div>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-3">
                    {["Small group class (12 students)", "Free Campus WiFi", "Practice with laptops/headsets", "All notes & materials provided", "Face-to-face feedback", "Speaking & writing drills"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Tuition Fee</p>
                      <div className="text-4xl font-black text-foreground font-headline">LKR 40,000</div>
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0">
                  <Button asChild className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg group">
                    <Link href={LMS_URL}>
                      Reserve Physical Seat
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Package 02 - Online + Physical Standard Hybrid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-orange-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl rounded-[40px] overflow-hidden hover:translate-y-[-10px] transition-all duration-500 border border-white/10">
                <div className="bg-orange-500 p-8 text-white relative">
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Standard Hybrid</div>
                  <h3 className="text-3xl font-black font-headline">Online + Physical</h3>
                  <p className="text-white/80 font-medium italic mt-2">Maximum flexibility & hands-on prep</p>
                </div>
                <div className="p-8 flex-grow space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                        <span>Online (Thu & Fri)</span>
                        <span className="text-orange-600">8PM - 10PM</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground">
                        <span>Physical (Sat & Sun)</span>
                        <span className="text-orange-600">11.30AM - 1.30PM</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 text-accent font-black">
                      <span>GRAMMAR CLINIC BONUS</span>
                      <span>INCLUDED</span>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-3">
                    {["Online session access", "Small group physical class", "Free Campus WiFi Usage", "Practice with laptops/headsets", "All notes & materials provided", "Hands-on Band 7+ learning"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 text-orange-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Standard Hybrid Fee</p>
                      <div className="text-4xl font-black text-foreground font-headline">LKR 50,000</div>
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0">
                  <Button asChild className="w-full h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg group">
                    <Link href={LMS_URL}>
                      Enroll Standard Hybrid
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Package 02 - Physical + Online Mastery Supreme Hybrid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group relative lg:col-span-1"
            >
              <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col glass-card border-none bg-white/5 backdrop-blur-xl shadow-2xl rounded-[40px] overflow-hidden hover:translate-y-[-10px] transition-all duration-500 border-2 border-primary/20">
                <div className="bg-primary p-8 text-white relative">
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Most Intensive</div>
                  <h3 className="text-3xl font-black font-headline">Physical + Mastery Online</h3>
                  <p className="text-white/80 font-medium italic mt-2">The complete high-score guarantee path</p>
                </div>
                <div className="p-8 flex-grow space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center text-xs font-black uppercase text-primary">
                        <span>Physical Mastery (Sat & Sun)</span>
                        <span>11.30AM - 1.30PM</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground font-headline">
                        <span>Online Intensive (Thu & Fri)</span>
                        <span>8PM - 10PM</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black uppercase text-secondary-foreground font-headline">
                        <span>Special Addition (Mon & Fri)</span>
                        <span className="italic">8PM - 10PM (2 Weeks)</span>
                      </div>
                    </div>
                  </div>

                  <ul className="grid md:grid-cols-2 gap-y-3 gap-x-6">
                    {["Full class recordings (Online)", "AI practice platform access", "Strategies for all 4 modules", "Writing templates + samples", "Speaking feedback sessions", "Grammar clinic for one month", "Physical class laptop practice", "Notes & Materials provided"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Elite Mastery Fee</p>
                      <div className="text-4xl font-black text-foreground font-headline">LKR 55,000</div>
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0">
                  <Button asChild className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg group">
                    <Link href={LMS_URL}>
                      Secure Elite Mastery Slot
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Policy Notice */}
          <div className="max-w-4xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-8 rounded-[40px] bg-red-500/5 border-2 border-dashed border-red-500/20 text-center space-y-4"
            >
              <ShieldCheck className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="text-xl font-black font-headline uppercase text-red-500">Strict No-Refund Policy</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                SmartLabs follows a strict no-refund policy for all courses and payments. Once payment is made, it is considered final and cannot be refunded under any circumstances.
              </p>
            </motion.div>
          </div>

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Button variant="outline" size="xl" className="rounded-full border-2 border-accent/20 hover:bg-accent/5 hover:border-accent/50 text-foreground font-black group transition-all h-16 px-12" asChild>
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
              Ready to Start Your IELTS Journey?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn more about our IELTS preparation and find the perfect study plan for your goals.
            </p>
            <Button variant="hero" size="xl" asChild>
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
