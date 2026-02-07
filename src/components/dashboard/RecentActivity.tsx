'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useUser } from '@/firebase';
import { useUserActivity } from '@/hooks/use-user-activity';
import {
    Activity,
    CheckCircle2,
    Video,
    FileText,
    Award,
    UserPlus,
    LogIn,
    BookOpen,
    Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
    test: CheckCircle2,
    lesson: BookOpen,
    achievement: Award,
    enrollment: UserPlus,
    login: LogIn,
    video: Video,
};

const colorMap: Record<string, string> = {
    test: 'text-green-500',
    lesson: 'text-blue-500',
    achievement: 'text-amber-500',
    enrollment: 'text-purple-500',
    login: 'text-cyan-500',
    video: 'text-red-500',
};

const bgMap: Record<string, string> = {
    test: 'bg-green-500/10',
    lesson: 'bg-blue-500/10',
    achievement: 'bg-amber-500/10',
    enrollment: 'bg-purple-500/10',
    login: 'bg-cyan-500/10',
    video: 'bg-red-500/10',
};

export function RecentActivity() {
    const { user } = useUser();
    const { activities, loading } = useUserActivity(user?.uid);

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return 'just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

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
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                ) : activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((item: any, idx) => {
                            const Icon = iconMap[item.activityType] || Activity;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group"
                                >
                                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl ${bgMap[item.activityType] || 'bg-primary/10'} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <Icon className={`h-5 w-5 ${colorMap[item.activityType] || 'text-primary'}`} />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold truncate pr-4">{item.title}</h4>
                                            {item.metadata?.score && (
                                                <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">
                                                    {item.metadata.score}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                                            {getTimeAgo(item.timestamp)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground italic">No recent activity found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
