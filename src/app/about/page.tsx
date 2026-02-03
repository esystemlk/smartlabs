'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Target,
  Users,
  Award,
  ArrowRight,
  CheckCircle,
  Heart,
  Sparkles,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for the highest standards in everything we do, from curriculum design to student support.",
  },
  {
    icon: Heart,
    title: "Student-First",
    description: "Our students' success is our success. Every decision we make puts their learning journey first.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We foster a supportive learning community where students help each other succeed.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "We continuously evolve our teaching methods and leverage technology to enhance learning.",
  },
];



export default function About() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              <span>About Smart Labs</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Empowering Learners to{" "}
              <span className="gradient-text">Achieve Their Dreams</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to make quality exam preparation accessible to everyone, using innovative teaching methods and cutting-edge technology.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Globe className="h-4 w-4" />
                <span>Our Story</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                From a Small Classroom to a Leading Institution
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Smart Labs was founded with a simple belief: everyone deserves access to quality education that can transform their lives. What started as a small PTE preparation center has grown into a comprehensive learning platform serving thousands of students.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Today, we offer expert-led courses for PTE, IELTS, CELPIP, and corporate training, combining traditional teaching excellence with modern AI-powered learning tools.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" asChild>
                  <Link href="/contact">
                    Get in Touch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-sm text-muted-foreground">Students Trained</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">95%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">50+</div>
                <p className="text-sm text-muted-foreground">Expert Instructors</p>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-500 mb-2">6+</div>
                <p className="text-sm text-muted-foreground">Years Experience</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Award className="h-4 w-4" />
              <span>Our Values</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Drives Us
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-6 mx-auto">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
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
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of successful students who achieved their dreams with Smart Labs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
