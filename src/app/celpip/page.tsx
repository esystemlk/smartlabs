'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Headphones,
  PenTool,
  MessageSquare,
  Video,
  Lightbulb,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";

const celpipSkills = [
  { icon: Headphones, title: "Listening", description: "Understand everyday conversations and discussions" },
  { icon: BookOpen, title: "Reading", description: "Comprehend various text types and formats" },
  { icon: PenTool, title: "Writing", description: "Compose emails and respond to survey questions" },
  { icon: MessageSquare, title: "Speaking", description: "Respond to prompts in everyday scenarios" },
];

const programFeatures = [
  "Introductory guidance video covering all sections",
  "Writing component training video with examples",
  "Self-paced learning flexibility",
  "Comprehensive study materials",
];

const preparationTips = [
  "Practice daily with official CELPIP materials",
  "Focus on time management during practice tests",
  "Record yourself speaking and review for improvements",
  "Build vocabulary relevant to Canadian contexts",
  "Take full-length practice tests under exam conditions",
  "Review your weak areas systematically",
];

export default function CELPIP() {
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
              <Flag className="h-4 w-4" />
              <span>Canadian Immigration</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              CELPIP Preparation{" "}
              <span className="text-accent">Course</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your key to Canadian immigration, PR, and citizenship applications.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" asChild>
                <Link href="/enroll">
                  Get Started
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

      {/* About CELPIP Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" />
                <span>About the Test</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                About the CELPIP Test
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The Canadian English Language Proficiency Index Program (CELPIP) is a general English language proficiency test designated by Immigration, Refugees and Citizenship Canada (IRCC) for permanent residency and citizenship applications.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The test focuses on everyday English communication skills that you'll need in Canada, making it an excellent choice for those planning to immigrate or become Canadian citizens.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {celpipSkills.map((skill, index) => (
                <motion.div
                  key={skill.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <skill.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{skill.title}</h3>
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Self-Paced Program */}
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
              <span>Self-Paced Learning</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              CELPIP Self-Paced Program
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Program Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 border-2 border-accent/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-accent/10">
                  <Video className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Program Features</h3>
                  <p className="text-muted-foreground">What's included</p>
                </div>
              </div>

              <ul className="space-y-4">
                {programFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button variant="accent" size="lg" className="w-full" asChild>
                  <Link href="/enroll">Get CELPIP Resources</Link>
                </Button>
              </div>
            </motion.div>

            {/* Preparation Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Preparation Tips</h3>
                  <p className="text-muted-foreground">Expert recommendations</p>
                </div>
              </div>

              <ul className="space-y-4">
                {preparationTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Flag className="h-4 w-4" />
              <span>Start Your Journey</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Pathway to Canada Starts Here
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Our resources are designed to improve your confidence and fluency for the CELPIP test.
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
