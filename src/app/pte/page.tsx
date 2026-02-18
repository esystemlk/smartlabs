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
  BookOpen
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
                <Link href={LMS_URL} target="_blank" rel="noopener noreferrer">
                  Enroll Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link href="/contact">Book Free Consultation</Link>
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
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Course Options</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Choose Your Learning Path
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Boostify Session Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 border-2 border-primary/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">PTE Online – Boostify Session</h3>
                  <p className="text-muted-foreground">Comprehensive online preparation</p>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {boostifyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 p-4 rounded-xl bg-secondary/50 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span><strong>Batch 01:</strong> 8:00 PM – 10:00/11:00 PM (LK), Mon – Fri</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span><strong>Batch 02:</strong> 2:30 PM – 4:30 PM (LK) / 7:00 PM – 9:00 PM (AU), Wed – Sun</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span><strong>Duration:</strong> 2 Weeks (25 Hours)</span>
                </div>
              </div>

              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link href="/enroll">Enroll in Boostify Session</Link>
              </Button>
            </motion.div>

            {/* Physical Session Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 border-2 border-accent-2/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-accent-2/10">
                  <Users className="h-8 w-8 text-accent-2" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">PTE Physical Session</h3>
                  <p className="text-muted-foreground">Hybrid learning experience in Rajagiriya</p>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {physicalFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 p-4 rounded-xl bg-secondary/50 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-accent-2" />
                  <span><strong>Location:</strong> Janajaya Building, Rajagiriya</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-accent-2" />
                  <span><strong>Total Duration:</strong> 41 Hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-accent-2" />
                  <span>Includes online Boostify + physical classes</span>
                </div>
              </div>

              <Button variant="accent" size="lg" className="w-full bg-accent-2 hover:bg-accent-2/90" asChild>
                <Link href="/enroll">Enroll in Physical Session</Link>
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
