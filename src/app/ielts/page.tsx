
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
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
                <Link href="/enroll">
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
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Course Details</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              IELTS Weekend Group Class
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto glass-card rounded-3xl p-8 border-2 border-accent/20"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-accent/10">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">Weekend Classes</h3>
                <p className="text-muted-foreground">Perfect for working professionals</p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {courseFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-4 p-6 rounded-xl bg-secondary/50 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-accent" />
                <span><strong>Schedule:</strong> Every Saturday & Sunday</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent" />
                <span><strong>Time:</strong> 11:30 AM – 1:30 PM</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                <span><strong>Location:</strong> Rajagiriya</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="text-2xl font-bold text-foreground">LKR 30,000</div>
                <p className="text-sm text-muted-foreground">Full course fee</p>
              </div>
            </div>

            <Button variant="accent" size="lg" className="w-full" asChild>
              <Link href="/enroll">Enroll in IELTS Class</Link>
            </Button>
          </motion.div>
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
