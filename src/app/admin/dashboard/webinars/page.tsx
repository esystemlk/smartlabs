'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Search,
    Download,
    Settings,
    Save,
    ArrowLeft,
    Loader2,
    Calendar,
    Clock,
    Link2,
    FileText,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import {
    getWebinarRegistrations,
    getWebinarSettings,
    updateWebinarSettings,
    exportRegistrationsToCSV,
    type WebinarRegistration,
    type WebinarSettings,
    DEFAULT_WEBINAR_SETTINGS,
} from '@/lib/services/webinar.service';

export default function AdminWebinarsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading } = useUser();

    const [isAdmin, setIsAdmin] = useState(false);
    const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<WebinarRegistration[]>([]);
    const [settings, setSettings] = useState<WebinarSettings>(DEFAULT_WEBINAR_SETTINGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Settings form state
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editMeetingLink, setEditMeetingLink] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    // Admin check
    useEffect(() => {
        if (!isUserLoading && currentUser && firestore) {
            const userRef = doc(firestore, 'users', currentUser.uid);
            getDoc(userRef).then(userDoc => {
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    if (role === 'admin' || role === 'developer' || role === 'teacher') {
                        setIsAdmin(true);
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

    // Load data
    useEffect(() => {
        if (isAdmin && firestore) {
            loadData();
        }
    }, [isAdmin, firestore]);

    const loadData = async () => {
        if (!firestore) return;
        setIsLoadingData(true);

        // Load registrations
        const regs = await getWebinarRegistrations(firestore);
        setRegistrations(regs);
        setFilteredRegistrations(regs);

        // Load settings
        const webinarSettings = await getWebinarSettings(firestore);
        setSettings(webinarSettings);
        setEditTitle(webinarSettings.title);
        setEditDescription(webinarSettings.description);
        setEditDate(webinarSettings.date);
        setEditTime(webinarSettings.time);
        setEditMeetingLink(webinarSettings.meetingLink);
        setEditIsActive(webinarSettings.isActive);

        setIsLoadingData(false);
    };

    // Search functionality
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredRegistrations(registrations);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = registrations.filter(
            (reg) =>
                reg.fullName.toLowerCase().includes(query) ||
                reg.email.toLowerCase().includes(query) ||
                reg.phone.toLowerCase().includes(query)
        );
        setFilteredRegistrations(filtered);
    }, [searchQuery, registrations]);

    const handleSaveSettings = async () => {
        if (!firestore) return;
        setIsSavingSettings(true);

        const success = await updateWebinarSettings(firestore, {
            title: editTitle,
            description: editDescription,
            date: editDate,
            time: editTime,
            meetingLink: editMeetingLink,
            isActive: editIsActive,
        });

        setIsSavingSettings(false);

        if (success) {
            toast({
                title: 'Settings Updated',
                description: 'Webinar settings have been saved successfully.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Failed to save settings. Please try again.',
            });
        }
    };

    const handleExport = () => {
        if (registrations.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data',
                description: 'There are no registrations to export.',
            });
            return;
        }
        exportRegistrationsToCSV(registrations);
        toast({
            title: 'Export Complete',
            description: `Exported ${registrations.length} registrations to CSV.`,
        });
    };

    const formatDate = (timestamp: any) => {
        try {
            if (timestamp?.toDate) {
                return timestamp.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            }
            if (timestamp?.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            }
            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    // Loading state
    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center flex flex-col items-center gap-4">
                    <Image src="/logo.png" alt="Smart Labs Logo" width={80} height={80} className="animate-pulse-glow" />
                    <p className="text-lg font-semibold">Verifying Access...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we check your credentials.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen">
            <section className="py-8 md:py-12">
                <div className="container mx-auto">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/dashboard" className="p-2 rounded-xl hover:bg-muted transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-headline font-bold">Webinar Management</h1>
                                <p className="text-md text-muted-foreground mt-1">Manage webinar registrations and settings</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={loadData} disabled={isLoadingData}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Badge variant="secondary" className="text-sm px-4 py-1.5">
                                {registrations.length} Registrations
                            </Badge>
                        </div>
                    </header>

                    {/* Tabs */}
                    <Tabs defaultValue="registrations" className="space-y-6">
                        <TabsList className="bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="registrations" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Users className="mr-2 h-4 w-4" />
                                Registrations
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        {/* ─── Registrations Tab ─── */}
                        <TabsContent value="registrations" className="space-y-6">
                            {/* Search & Export Bar */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11 rounded-xl"
                                    />
                                </div>
                                <Button onClick={handleExport} variant="outline" className="h-11 rounded-xl">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to CSV
                                </Button>
                            </div>

                            {/* Registrations Table */}
                            <Card className="rounded-2xl overflow-hidden">
                                <CardContent className="p-0">
                                    {isLoadingData ? (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : filteredRegistrations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                            <p className="text-lg font-semibold text-muted-foreground">No registrations found</p>
                                            <p className="text-sm text-muted-foreground/60 mt-1">
                                                {searchQuery ? 'Try a different search term.' : 'Registrations will appear here.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b bg-muted/30">
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">#</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Exam</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Level</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRegistrations.map((reg, idx) => (
                                                        <tr key={reg.id || idx} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                                                            <td className="px-6 py-4 text-sm text-muted-foreground">{idx + 1}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-semibold">{reg.fullName}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground">{reg.email}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground">{reg.phone}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant={reg.examType === 'IELTS' ? 'default' : 'secondary'} className="text-xs">
                                                                    {reg.examType}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                    {reg.level}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground">{formatDate(reg.registrationDate)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ─── Settings Tab ─── */}
                        <TabsContent value="settings" className="space-y-6">
                            <Card className="rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-primary" />
                                        Webinar Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Active toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
                                        <div>
                                            <Label className="text-sm font-bold">Webinar Active</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">Show or hide the webinar banner and page</p>
                                        </div>
                                        <button
                                            onClick={() => setEditIsActive(!editIsActive)}
                                            className="flex items-center gap-2"
                                        >
                                            {editIsActive ? (
                                                <ToggleRight className="h-8 w-8 text-primary" />
                                            ) : (
                                                <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                                            )}
                                            <span className={`text-sm font-bold ${editIsActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {editIsActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="webinar-title" className="text-sm font-bold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Webinar Title
                                        </Label>
                                        <Input
                                            id="webinar-title"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="h-11 rounded-xl"
                                            placeholder="Enter webinar title"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="webinar-desc" className="text-sm font-bold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Description
                                        </Label>
                                        <Textarea
                                            id="webinar-desc"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            className="rounded-xl min-h-[100px]"
                                            placeholder="Enter webinar description"
                                        />
                                    </div>

                                    {/* Date & Time */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="webinar-date" className="text-sm font-bold flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                Date
                                            </Label>
                                            <Input
                                                id="webinar-date"
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="h-11 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="webinar-time" className="text-sm font-bold flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                Time
                                            </Label>
                                            <Input
                                                id="webinar-time"
                                                type="text"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="h-11 rounded-xl"
                                                placeholder="e.g. 9:00 AM"
                                            />
                                        </div>
                                    </div>

                                    {/* Meeting Link */}
                                    <div className="space-y-2">
                                        <Label htmlFor="webinar-link" className="text-sm font-bold flex items-center gap-2">
                                            <Link2 className="h-4 w-4 text-primary" />
                                            Meeting Link
                                        </Label>
                                        <Input
                                            id="webinar-link"
                                            type="url"
                                            value={editMeetingLink}
                                            onChange={(e) => setEditMeetingLink(e.target.value)}
                                            className="h-11 rounded-xl"
                                            placeholder="https://zoom.us/j/..."
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-4">
                                        <Button
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90"
                                        >
                                            {isSavingSettings ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Settings
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
        </div>
    );
}
