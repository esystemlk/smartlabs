'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Target, CalendarDays, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  const actions = [
    {
      title: 'Start AI Tutor',
      description: 'Personalized guidance for PTE, IELTS, CELPIP',
      href: '/dashboard/ai-tutor',
      icon: Bot,
      color: 'from-accent-1/30 to-accent-1/10',
    },
    {
      title: 'AI Score Test',
      description: 'Practice with instant scoring and feedback',
      href: '/dashboard/ai-score-test',
      icon: Target,
      color: 'from-primary/30 to-primary/10',
    },
    {
      title: 'View Schedule',
      description: 'Upcoming classes and sessions',
      href: '/dashboard/schedule',
      icon: CalendarDays,
      color: 'from-accent-3/30 to-accent-3/10',
    },
    {
      title: 'Browse Resources',
      description: 'Materials, videos, and guides',
      href: '/resources',
      icon: BookOpen,
      color: 'from-emerald-400/30 to-emerald-400/10',
    },
  ];

  return (
    <Card className="col-span-1 overflow-hidden border-none shadow-xl bg-card/30 backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <Button asChild variant="ghost" className="rounded-xl text-[11px] font-black uppercase tracking-wider">
            <Link href="/dashboard">Customize</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <Link key={a.title} href={a.href} className="block group">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative p-5 rounded-2xl border border-white/10 bg-gradient-to-br hover:border-primary/40 hover:shadow-xl transition-all"
                style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-20`} />
                <div className="relative z-10 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black">{a.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">{a.description}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
