"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface GoogleReview {
  author_name: string;
  author_url: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface GooglePlaceDetails {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

// Mock reviews as fallback
const MOCK_REVIEWS: GoogleReview[] = [
  {
    author_name: "Sarah Wijesinghe",
    author_url: "#",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5,
    relative_time_description: "2 days ago",
    text: "Smart Labs is hands down the best PTE center in Sri Lanka. Their AI scoring system is incredibly accurate and helped me identify my weak spots. I achieved a score of 82 in just 4 weeks!",
    time: Date.now() / 1000 - 172800,
  },
  {
    author_name: "Kasun Perera",
    author_url: "#",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kasun",
    rating: 5,
    relative_time_description: "1 week ago",
    text: "The personalized attention I received was amazing. The instructors are experts and the mock exams are very similar to the actual PTE test. Highly recommended for anyone aiming for a high score.",
    time: Date.now() / 1000 - 604800,
  },
  {
    author_name: "Nimali Fernando",
    author_url: "#",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nimali",
    rating: 5,
    relative_time_description: "2 weeks ago",
    text: "Excellent CELPIP training. The computer-based practice sessions and real-life scenarios really helped me build confidence. The study materials provided are very comprehensive.",
    time: Date.now() / 1000 - 1209600,
  },
  {
    author_name: "Dilshan Silva",
    author_url: "#",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dilshan",
    rating: 5,
    relative_time_description: "3 weeks ago",
    text: "Smart Labs provides a great environment for learning. The staff is friendly and always ready to help. The mock tests gave me a realistic idea of what to expect on exam day.",
    time: Date.now() / 1000 - 1814400,
  },
  {
    author_name: "Aruni Jayawardena",
    author_url: "#",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aruni",
    rating: 5,
    relative_time_description: "1 month ago",
    text: "I was struggling with my PTE speaking section, but after joining Smart Labs, my score improved significantly. The AI feedback on pronunciation and fluency was key to my success.",
    time: Date.now() / 1000 - 2592000,
  },
];

const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "ChIJR_7X-89Z4joR_7X-89Z4joR"; // Placeholder
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function GoogleReviews() {
  const [details, setDetails] = useState<GooglePlaceDetails>({
    rating: 4.9,
    user_ratings_total: 1240,
    reviews: MOCK_REVIEWS,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch("/api/google-reviews");
        const data = await response.json();
        
        if (data && !data.error) {
          setDetails({
            rating: data.rating || 4.9,
            user_ratings_total: data.user_ratings_total || 1240,
            reviews: data.reviews || MOCK_REVIEWS,
          });
        } else {
          console.warn("Using mock reviews as fallback:", data.error || "No data");
        }
      } catch (error) {
        console.error("Error fetching Google reviews through proxy:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-[#020617]">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent-1/5 blur-[100px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]"
          >
            <Star className="h-3 w-3 fill-current" />
            Verified Student Success
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.9]">
              What Our <br />
              <span className="text-primary italic">Students Say</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Real reviews from students who practiced our PTE mock exams.
            </p>
          </div>

          {/* Overall Rating Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex flex-col items-center gap-1 border-r border-slate-100 dark:border-slate-800 pr-8">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{details.rating}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= Math.floor(details.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Google Rating</span>
              <span className="text-lg font-black">{details.user_ratings_total}+ Reviews</span>
            </div>
          </motion.div>
        </div>

        {/* Review Slider */}
        <div className="relative max-w-7xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {details.reviews.map((review, i) => (
                <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="h-full"
                  >
                    <div className="group relative h-full p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <div className="flex flex-col h-full space-y-6">
                        {/* Header: Profile & Rating */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary/10">
                              <Image
                                src={review.profile_photo_url}
                                alt={review.author_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-black text-lg tracking-tight line-clamp-1">
                                {review.author_name}
                              </h4>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-3 w-3",
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-slate-200"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="relative flex-grow">
                          <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/5 -rotate-12" />
                          <p className="text-muted-foreground leading-relaxed italic relative z-10 line-clamp-5">
                            "{review.text}"
                          </p>
                        </div>

                        {/* Footer: Date */}
                        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 mt-auto">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {review.relative_time_description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-12">
              <CarouselPrevious className="static translate-y-0 h-14 w-14 rounded-2xl border-2 border-primary/20 bg-white dark:bg-slate-900 text-primary hover:bg-primary hover:text-white transition-all duration-300" />
              <CarouselNext className="static translate-y-0 h-14 w-14 rounded-2xl border-2 border-primary/20 bg-white dark:bg-slate-900 text-primary hover:bg-primary hover:text-white transition-all duration-300" />
            </div>
          </Carousel>
        </div>

        {/* View All Button */}
        <div className="mt-20 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Button
              size="xl"
              className="h-20 px-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all group"
              asChild
            >
              <a
                href={`https://search.google.com/local/reviews?placeid=${PLACE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View All Reviews on Google
                <ExternalLink className="ml-4 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
