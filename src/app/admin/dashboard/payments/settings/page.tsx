'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    ChevronLeft,
    Save,
    CreditCard,
    AlertCircle,
    Loader2,
    ExternalLink,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { homepageContentService, Course } from '@/lib/services/homepage-content.service';
import { paymentService, CoursePaymentSettings } from '@/lib/services/payment.service';

export default function CoursePaymentSettingsPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();

    const [isAdmin, setIsAdmin] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<Record<string, CoursePaymentSettings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!isUserLoading && currentUser && firestore) {
            const userRef = doc(firestore, 'users', currentUser.uid);
            getDoc(userRef).then(userDoc => {
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    if (role === 'admin' || role === 'developer' || role === 'teacher') {
                        setIsAdmin(true);
                        loadData();
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    router.push('/login');
                }
            });
        } else if (!isUserLoading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, isUserLoading, router, firestore]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedCourses = await homepageContentService.getCourses();
            const fetchedSettings = await paymentService.getPaymentSettings();

            const settingsMap: Record<string, CoursePaymentSettings> = {};
            fetchedSettings.forEach(s => {
                settingsMap[s.courseId] = s;
            });

            setCourses(fetchedCourses);
            setPaymentSettings(settingsMap);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load course payment settings.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSetting = (courseId: string, field: keyof CoursePaymentSettings, value: any) => {
        setPaymentSettings(prev => ({
            ...prev,
            [courseId]: {
                ...(prev[courseId] || {
                    courseId,
                    courseName: courses.find(c => c.id === courseId)?.title || '',
                    payherePaymentLink: '',
                    price: 0,
                    status: 'disabled'
                }),
                [field]: value
            }
        }));
    };

    const handleSave = async (courseId: string) => {
        const settings = paymentSettings[courseId];
        if (!settings) return;

        if (!settings.payherePaymentLink && settings.status === 'active') {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Payment link is required to activate payments.',
            });
            return;
        }

        setIsSaving(courseId);
        try {
            const success = await paymentService.updatePaymentSettings(settings);
            if (success) {
                toast({
                    title: 'Settings Saved',
                    description: `Payment configurations for ${settings.courseName} updated.`,
                });
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save payment settings.',
            });
        } finally {
            setIsSaving(null);
        }
    };

    if (isLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-0">
            <header className="mb-10">
                <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Course Payment Settings</h1>
                        <p className="text-muted-foreground mt-1 text-lg">Manage PayHere payment links and pricing for your courses.</p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6">
                {courses.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Courses Found</h3>
                            <p className="text-muted-foreground max-w-sm">
                                You need to create courses first in the Course Management section.
                            </p>
                            <Button asChild variant="outline" className="mt-6">
                                <Link href="/admin/dashboard/courses">Go to Course Management</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map(course => {
                        const settings = paymentSettings[course.id] || {
                            courseId: course.id,
                            courseName: course.title,
                            payherePaymentLink: '',
                            price: 0,
                            status: 'disabled'
                        };
                        const saving = isSaving === course.id;

                        return (
                            <Card key={course.id} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300">
                                <CardHeader className="bg-muted/30 border-b border-border/10 flex flex-row items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${course.bgGradient}`}>
                                            <CreditCard className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{course.title}</CardTitle>
                                            <CardDescription>Configure payment link and price</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={settings.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                            {settings.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                            {settings.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-6">
                                    <div className="grid md:grid-cols-12 gap-6 items-end">
                                        <div className="md:col-span-12 lg:col-span-6 space-y-2">
                                            <Label htmlFor={`link-${course.id}`} className="font-bold flex items-center justify-between">
                                                PayHere Item Pay ID (Button Code)
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <CreditCard className="h-4 w-4 " />
                                                </div>
                                                <Input
                                                    id={`link-${course.id}`}
                                                    value={settings.payherePaymentLink}
                                                    onChange={(e) => handleUpdateSetting(course.id, 'payherePaymentLink', e.target.value)}
                                                    placeholder="e.g., o88dfe6fd"
                                                    className="pl-10 h-11 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-6 lg:col-span-2 space-y-2">
                                            <Label htmlFor={`price-${course.id}`} className="font-bold">Price (LKR)</Label>
                                            <Input
                                                id={`price-${course.id}`}
                                                type="number"
                                                value={settings.price}
                                                onChange={(e) => handleUpdateSetting(course.id, 'price', Number(e.target.value))}
                                                placeholder="0.00"
                                                className="h-11 rounded-xl"
                                            />
                                        </div>

                                        <div className="md:col-span-6 lg:col-span-2 flex flex-col justify-center gap-2">
                                            <Label className="font-bold">Payment Status</Label>
                                            <div className="flex items-center space-x-2 h-11 bg-muted/40 rounded-xl px-4 border border-border/10">
                                                <Switch
                                                    id={`status-${course.id}`}
                                                    checked={settings.status === 'active'}
                                                    onCheckedChange={(checked) => handleUpdateSetting(course.id, 'status', checked ? 'active' : 'disabled')}
                                                />
                                                <Label htmlFor={`status-${course.id}`} className="text-xs font-semibold cursor-pointer">
                                                    {settings.status === 'active' ? 'ENABLED' : 'DISABLED'}
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 lg:col-span-2">
                                            <Button
                                                className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
                                                onClick={() => handleSave(course.id)}
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
