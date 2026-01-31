'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Building2, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Users,
  Target,
  BarChart3,
  MessageSquare,
  Bot,
  Award,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

const trainingAreas = [
  {
    icon: MessageSquare,
    title: "Workplace English",
    description: "Upgrade English for professional communication and presentations",
  },
  {
    icon: Award,
    title: "Professional Etiquette",
    description: "Confidence development and corporate communication skills",
  },
  {
    icon: Bot,
    title: "AI Productivity Tools",
    description: "Practical use of AI tools to boost workplace productivity",
  },
  {
    icon: FileText,
    title: "Evaluation & Reports",
    description: "Post-training evaluation with detailed feedback reports",
  },
];

const benefits = [
  "Customized curriculum based on skill gap analysis",
  "Training aligned with organizational culture and goals",
  "Flexible scheduling for minimal work disruption",
  "Progress tracking and performance metrics",
  "Certified instructors with corporate training experience",
  "Post-training support and resources",
];

export default function CorporateTraining() {
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
              <Building2 className="h-4 w-4" />
              <span>For Organizations</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Corporate{" "}
              <span className="gradient-text">Training</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Empowering Teams, Elevating Organizations
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link href="/contact">
                  Request Proposal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link href="/contact">Schedule a Call</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
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
                <Target className="h-4 w-4" />
                <span>Customized Solutions</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Your Goals, Our Expertise — Custom Workshops for Your Team
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our corporate training programs are customized based on skill gap analysis, organizational culture, and business goals to ensure impactful training that delivers measurable results.
              </p>

              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">50+</div>
                <p className="text-sm text-muted-foreground">Companies Trained</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-7 w-7 text-accent" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">2,000+</div>
                <p className="text-sm text-muted-foreground">Employees Upskilled</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                  <BarChart3 className="h-7 w-7 text-accent" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">95%</div>
                <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 mx-auto">
                  <Award className="h-7 w-7 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">100+</div>
                <p className="text-sm text-muted-foreground">Workshops Delivered</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Training Areas */}
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
              <span>What We Offer</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Key Training Areas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive training solutions designed to address your organization's unique needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trainingAreas.map((area, index) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-6 mx-auto">
                  <area.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3">
                  {area.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {area.description}
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
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-primary p-12 lg:p-16 text-center"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Building2 className="h-4 w-4" />
                <span>Partner With Us</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Partner with Smart Labs
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Investing in your team's skills is an investment in your company's future. Let us help you build a more capable, confident workforce.
              </p>
              <Button 
                size="xl" 
                className="bg-white text-primary hover:bg-white/90 shadow-xl"
                asChild
              >
                <Link href="/contact">
                  Request Corporate Training Proposal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
