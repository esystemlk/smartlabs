'use client';

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/firebase';
import { usePerformanceData } from '@/hooks/use-performance-data';

export function PerformanceOverview() {
    const { user } = useUser();
    const { radarData, trendData, loading } = usePerformanceData(user?.uid);

    return (
        <Card className="col-span-1 lg:col-span-2 overflow-hidden border-none shadow-xl bg-card/30 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        AI Performance Analytics
                    </CardTitle>
                    <CardDescription>
                        Deep insights into your English proficiency matrix
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Updates</span>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="bg-background/50 backdrop-blur-sm p-1 rounded-xl">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Skill Matrix</TabsTrigger>
                            <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Score Trends</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="h-[350px] mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
                                <div className="h-full min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="hsla(var(--primary) / 0.2)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 90]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Current Proficiency"
                                                dataKey="A"
                                                stroke="hsl(var(--primary))"
                                                fill="hsl(var(--primary))"
                                                fillOpacity={0.4}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '12px',
                                                }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                                            <Target className="h-4 w-4 text-accent-1" />
                                            Key Strengths
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-accent-2/10 text-accent-2 rounded-full text-xs font-bold border border-accent-2/20">Active Listening</span>
                                            <span className="px-3 py-1 bg-accent-1/10 text-accent-1 rounded-full text-xs font-bold border border-accent-1/20">Vocabulary Range</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                                            <Zap className="h-4 w-4 text-accent-4" />
                                            Growth areas
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Focus on <span className="text-foreground font-bold italic">Complex Sentence Structures</span> and
                                            <span className="text-foreground font-bold italic"> Phonetic Fluency</span> to reach your target score of 79+.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase text-primary/70">Overall Progress</span>
                                            <span className="text-sm font-black">76%</span>
                                        </div>
                                        <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '76%' }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="trends" className="h-[350px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--foreground) / 0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }}
                                        domain={[0, 90]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}
