'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Monitor,
  Smartphone,
  Download,
  CheckCircle,
  Apple,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const desktopFeatures = [
  "Full-sized interface for immersive learning",
  "AI-powered mock tests with detailed analytics",
  "Access to all course materials and recordings",
  "Distraction-free study environment",
];

const mobileFeatures = [
  "Learn on-the-go, anytime, anywhere",
  "Practice speaking questions with instant AI feedback",
  "Download lessons for offline access",
  "Track your progress and get daily reminders",
];

const WindowsIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 fill-current"><title>Windows</title><path d="M0 3.528h11.233v7.695H0V3.528zM12.767 3.528H24v7.695H12.767V3.528zM0 12.767h11.233v7.707H0v-7.707zm12.767 0H24v7.707H12.767v-7.707z"/></svg>
);


export default function AppsPage() {
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
              <Download className="h-4 w-4" />
              <span>Download Our Apps</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Learn Anytime, Anywhere with the{" "}
              <span className="gradient-text">Smart Labs Apps</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Take your learning to the next level with our dedicated desktop and mobile applications, designed for a seamless and powerful study experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Desktop App Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Monitor className="h-4 w-4" />
                <span>Desktop Power</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                The Ultimate Study Environment
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our desktop application provides a focused, distraction-free environment for serious study. Take full-length mock tests, dive deep into analytics, and access all your materials on a larger screen.
              </p>

              <ul className="space-y-4 mb-8">
                {desktopFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" variant="accent">
                        <Apple className="mr-2 h-5 w-5" /> Download for macOS
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <a href="https://mega.nz/file/utJzGKKD#7xtY6f4bjXDDPHdVkLoJ0B1WGhFllmfSmG9twSC3-Pg" target="_blank" rel="noopener noreferrer">
                           <WindowsIcon /> Download for Windows
                        </a>
                    </Button>
              </div>
            </motion.div>
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative aspect-video"
            >
                 <Image src="https://picsum.photos/seed/desktopapp/800/600" alt="Desktop App Screenshot" fill className="rounded-xl object-cover shadow-2xl" data-ai-hint="desktop application learning" />
            </motion.div>
          </div>
        </div>
      </section>

       {/* Mobile App Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative aspect-[9/16] lg:aspect-video"
            >
                 <Image src="https://picsum.photos/seed/mobileapp/600/800" alt="Mobile App Screenshot" fill className="rounded-xl object-cover shadow-2xl" data-ai-hint="mobile application learning" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Smartphone className="h-4 w-4" />
                <span>Learning on the Go</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Practice Anytime, Anywhere
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Never miss a chance to study with the Smart Labs mobile app. Practice speaking questions on your commute, review vocabulary during your lunch break, and stay on top of your study plan no matter where you are.
              </p>

              <ul className="space-y-4 mb-8">
                {mobileFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                     <Button size="lg" variant="hero">
                        <Play className="mr-2 h-5 w-5" /> Get it on Google Play
                    </Button>
                    <Button size="lg" variant="outline">
                       <Apple className="mr-2 h-5 w-5" /> Download on the App Store
                    </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
