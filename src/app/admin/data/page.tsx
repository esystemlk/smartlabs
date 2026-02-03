'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { initializeDatabase } from '@/lib/init-database';
import { updateSiteStats } from '@/lib/services/stats.service';
import { useSiteStats } from '@/hooks/use-site-stats';
import { Loader2, Database, TrendingUp, Users, Award, Clock } from 'lucide-react';

export default function AdminDataPage() {
    const { toast } = useToast();
    const { stats, loading: statsLoading } = useSiteStats();
    const [initializing, setInitializing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [formData, setFormData] = useState({
        studentsCount: 5000,
        successRate: 95,
        targetWeeks: '6–8',
        reviewsCount: 1200,
        rating: 5.0,
    });

    // Update form when stats load
    useState(() => {
        if (stats) {
            setFormData({
                studentsCount: stats.studentsCount,
                successRate: stats.successRate,
                targetWeeks: stats.targetWeeks,
                reviewsCount: stats.reviewsCount,
                rating: stats.rating,
            });
        }
    });

    const handleInitialize = async () => {
        setInitializing(true);
        try {
            const result = await initializeDatabase();
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Database initialized with default data',
                });
            } else {
                throw new Error('Initialization failed');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to initialize database',
                variant: 'destructive',
            });
        } finally {
            setInitializing(false);
        }
    };

    const handleUpdateStats = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await updateSiteStats(formData);
            toast({
                title: 'Success',
                description: 'Site statistics updated successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update statistics',
                variant: 'destructive',
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Data Management</h1>
                <p className="text-muted-foreground">
                    Manage site statistics, testimonials, and other dynamic content
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Initialize Database Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Initialize Database
                        </CardTitle>
                        <CardDescription>
                            Populate the database with default data. Only run this once when setting up.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleInitialize}
                            disabled={initializing}
                            className="w-full"
                        >
                            {initializing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initializing ? 'Initializing...' : 'Initialize Database'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                            This will create:
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                            <li>Site statistics document</li>
                            <li>5 default testimonials</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Current Stats Display */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Current Statistics
                        </CardTitle>
                        <CardDescription>
                            Live data from Firebase
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : stats ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-accent-1" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.studentsCount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Students</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-accent-2" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.successRate}%</p>
                                        <p className="text-xs text-muted-foreground">Success Rate</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-accent-3" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.targetWeeks}</p>
                                        <p className="text-xs text-muted-foreground">Weeks</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-accent-4" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.rating}</p>
                                        <p className="text-xs text-muted-foreground">Rating</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Update Stats Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Update Site Statistics</CardTitle>
                        <CardDescription>
                            Modify the statistics displayed on the homepage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateStats} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="studentsCount">Students Trained</Label>
                                    <Input
                                        id="studentsCount"
                                        type="number"
                                        value={formData.studentsCount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, studentsCount: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="successRate">Success Rate (%)</Label>
                                    <Input
                                        id="successRate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.successRate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, successRate: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetWeeks">Target Achievement (Weeks)</Label>
                                    <Input
                                        id="targetWeeks"
                                        type="text"
                                        value={formData.targetWeeks}
                                        onChange={(e) =>
                                            setFormData({ ...formData, targetWeeks: e.target.value })
                                        }
                                        placeholder="e.g., 6–8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reviewsCount">Reviews Count</Label>
                                    <Input
                                        id="reviewsCount"
                                        type="number"
                                        value={formData.reviewsCount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, reviewsCount: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Rating (0-5)</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rating: parseFloat(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={updating} className="w-full md:w-auto">
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {updating ? 'Updating...' : 'Update Statistics'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
