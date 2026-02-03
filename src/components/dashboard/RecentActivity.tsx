'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, CheckCircle2, Video, FileText, Share2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const activities = [
    {
        id: 1,
        type: 'test',
        title: 'PTE Read Aloud Completed',
        time: '2 hours ago',
        score: '84/90',
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10'
    },
    {
        id: 2,
        type: 'video',
        title: 'Watched: Essay Template Mastery',
        time: '5 hours ago',
        icon: Video,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 3,
        type: 'award',
        title: 'Milestone Reached: 10 Practice Tests',
        time: 'Yesterday',
        icon: Award,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10'
    },
    {
        id: 4,
        type: 'reading',
        title: 'Reading Mock Test #4',
        time: '2 days ago',
        score: '72/90',
        icon: FileText,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    }
];

export function RecentActivity() {
    return (
        <Card className="col-span-1 border-none shadow-xl bg-card/30 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Your latest learning achievements</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
                <div className="space-y-4">
                    {activities.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group"
                        >
                            <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold truncate pr-4">{item.title}</h4>
                                    {item.score && (
                                        <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">
                                            {item.score}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{item.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
