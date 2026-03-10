'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    MagnifyingGlass,
    DownloadSimple,
    Gear,
    FloppyDisk,
    ArrowLeft,
    CircleNotch,
    CalendarBlank,
    Clock,
    Link as LinkIcon,
    FileText,
    ToggleLeft,
    ToggleRight,
    CaretDown,
    ArrowsClockwise,
    Envelope,
    PaperPlaneTilt,
    Plus,
    Trash,
} from '@phosphor-icons/react';
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
    updateWebinarRegistrationStatus,
    deleteWebinarRegistration,
    getAdminEmails,
    addAdminEmail,
    removeAdminEmail,
    toggleAdminEmailStatus,
    exportRegistrationsToCSV,
    type WebinarRegistration,
    type WebinarSettings,
    type AdminEmail,
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

    // Bulk Email state
    const [lecturerName, setLecturerName] = useState('');
    const [zoomLink, setZoomLink] = useState('');
    const [resourcesLink, setResourcesLink] = useState('');
    const [additionalMessage, setAdditionalMessage] = useState('');
    const [isSendingEmails, setIsSendingEmails] = useState(false);
    const [isSendingConfirmations, setIsSendingConfirmations] = useState(false);

    // Admin Notification Emails state
    const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [isAddingAdminEmail, setIsAddingAdminEmail] = useState(false);
    const [isLoadingAdminEmails, setIsLoadingAdminEmails] = useState(false);

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

        // Load admin emails
        loadAdminEmails();
    };

    const loadAdminEmails = async () => {
        if (!firestore) return;
        setIsLoadingAdminEmails(true);
        const emails = await getAdminEmails(firestore);
        setAdminEmails(emails);
        setIsLoadingAdminEmails(false);
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

    const handleSendBulkEmail = async (mode: 'pending' | 'all' = 'pending', singleId?: string) => {
        if (!lecturerName || !zoomLink || !resourcesLink) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill in Lecturer Name, Zoom Link, and Resources Link.',
            });
            return;
        }

        const recipients = singleId
            ? registrations.filter(r => r.id === singleId)
            : mode === 'all'
                ? registrations
                : registrations.filter(r => !r.emailSent);

        if (recipients.length === 0) {
            toast({
                title: 'No Recipients',
                description: `No students found for the "${mode}" filter.`,
            });
            return;
        }

        if (!singleId && !confirm(`Send webinar links to ${recipients.length} students (${mode})?`)) {
            return;
        }

        setIsSendingEmails(true);

        try {
            const response = await fetch('/api/webinar/bulk-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: recipients,
                    lecturerName,
                    zoomLink,
                    resourcesLink,
                    additionalMessage,
                    webinarTitle: settings.title,
                    webinarDate: settings.date,
                    webinarTime: settings.time
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Update status in Firestore
                const updates = result.results.map((res: any) =>
                    updateWebinarRegistrationStatus(firestore!, res.id, {
                        emailSent: res.success,
                        emailError: res.error || null
                    })
                );
                await Promise.all(updates);

                toast({
                    title: 'Emails Processed',
                    description: `Successfully processed emails for ${recipients.length} students.`,
                });

                // Reload data to show updated status
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sending Failed',
                description: `Error: ${error.message}`,
            });
        } finally {
            setIsSendingEmails(false);
        }
    };

    const handleSendBulkConfirmation = async (mode: 'pending' | 'all' = 'pending', singleId?: string) => {
        const recipients = singleId
            ? registrations.filter(r => r.id === singleId)
            : mode === 'all'
                ? registrations
                : registrations.filter(r => !r.confirmationSent);

        if (recipients.length === 0) {
            toast({
                title: 'No Recipients',
                description: `No students found for the "${mode}" filter.`,
            });
            return;
        }

        if (!singleId && !confirm(`Send registration confirmation to ${recipients.length} students (${mode})?`)) {
            return;
        }

        setIsSendingConfirmations(true);

        try {
            const response = await fetch('/api/webinar/resend-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: recipients,
                    webinarTitle: settings.title,
                    webinarDate: settings.date,
                    webinarTime: settings.time
                }),
            });

            const result = await response.json();

            if (result.success) {
                const updates = result.results.map((res: any) =>
                    updateWebinarRegistrationStatus(firestore!, res.id, {
                        confirmationSent: res.success,
                        confirmationError: res.error || null
                    })
                );
                await Promise.all(updates);

                toast({
                    title: 'Confirmations Sent',
                    description: `Successfully sent confirmations for ${recipients.length} students.`,
                });
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sending Failed',
                description: `Error: ${error.message}`,
            });
        } finally {
            setIsSendingConfirmations(false);
        }
    };

    const handleAddAdminEmail = async () => {
        if (!newAdminEmail || !firestore || !currentUser) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newAdminEmail)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Email',
                description: 'Please enter a valid email address.',
            });
            return;
        }

        setIsAddingAdminEmail(true);
        const result = await addAdminEmail(firestore, newAdminEmail, currentUser.email || 'Admin');
        setIsAddingAdminEmail(false);

        if (result.success) {
            toast({
                title: 'Email Added',
                description: result.message,
            });
            setNewAdminEmail('');
            loadAdminEmails();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    };

    const handleRemoveAdminEmail = async (id: string) => {
        if (!firestore || !confirm('Are you sure you want to remove this email?')) return;

        const success = await removeAdminEmail(firestore, id);
        if (success) {
            toast({
                title: 'Email Removed',
                description: 'Admin email has been removed.',
            });
            loadAdminEmails();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove email.',
            });
        }
    };

    const handleToggleAdminStatus = async (id: string, currentStatus: boolean) => {
        if (!firestore) return;

        const success = await toggleAdminEmailStatus(firestore, id, !currentStatus);
        if (success) {
            loadAdminEmails();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update status.',
            });
        }
    };

    const handleDeleteRegistration = async (id: string) => {
        if (!firestore) return;
        if (!confirm('Are you sure you want to delete this registration? This action cannot be undone.')) return;

        const success = await deleteWebinarRegistration(firestore, id);
        if (success) {
            toast({
                title: 'Registration Deleted',
                description: 'The webinar registration has been removed.',
            });
            loadData();
        } else {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: 'Failed to delete registration. Please try again.',
            });
        }
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
                                <ArrowsClockwise weight="bold" className={`mr-2 h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
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
                                <Gear weight="bold" className="mr-2 h-4 w-4" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger value="emails" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Envelope weight="bold" className="mr-2 h-4 w-4" />
                                Send Emails
                            </TabsTrigger>
                        </TabsList>

                        {/* ─── Registrations Tab ─── */}
                        <TabsContent value="registrations" className="space-y-6">
                            {/* Search & Export Bar */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11 rounded-xl"
                                    />
                                </div>
                                <Button onClick={handleExport} variant="outline" className="h-11 rounded-xl">
                                    <DownloadSimple weight="bold" className="mr-2 h-4 w-4" />
                                    Export to CSV
                                </Button>
                            </div>

                            {/* Registrations Table */}
                            <Card className="rounded-2xl overflow-hidden">
                                <CardContent className="p-0">
                                    {isLoadingData ? (
                                        <div className="flex items-center justify-center py-20">
                                            <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-primary" />
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
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Email</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Webinar Link</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                                        <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                                                                <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                                                                    {reg.examType}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {reg.confirmationSent ? (
                                                                    <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                                                                        Confirmed
                                                                    </Badge>
                                                                ) : reg.confirmationError ? (
                                                                    <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20" title={reg.confirmationError}>
                                                                        Error
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                                        Pending
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {reg.emailSent ? (
                                                                    <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                                        Sent
                                                                    </Badge>
                                                                ) : reg.emailError ? (
                                                                    <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20" title={reg.emailError}>
                                                                        Error
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="text-[10px] bg-slate-500/10 text-slate-400 border-slate-500/20">
                                                                        Not Sent
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground">{formatDate(reg.registrationDate)}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        if (reg.id) {
                                                                            if (confirm(`Send webinar links and resources to ${reg.fullName}?`)) {
                                                                                handleSendBulkEmail('all', reg.id);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-100/10 rounded-lg"
                                                                    title="Send Webinar Link"
                                                                >
                                                                    <PaperPlaneTilt className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        if (reg.id) {
                                                                            if (confirm(`Resend confirmation email to ${reg.fullName}?`)) {
                                                                                handleSendBulkConfirmation('all', reg.id);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8 text-amber-600 hover:bg-amber-100/10 rounded-lg"
                                                                    title="Resend Confirmation"
                                                                >
                                                                    <ArrowsClockwise className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => reg.id && handleDeleteRegistration(reg.id)}
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
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
                                        <Gear weight="bold" className="h-5 w-5 text-primary" />
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
                                                <CalendarBlank weight="bold" className="h-4 w-4 text-primary" />
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
                                            <LinkIcon weight="bold" className="h-4 w-4 text-primary" />
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
                                                    <CircleNotch weight="bold" className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FloppyDisk weight="bold" className="mr-2 h-4 w-4" />
                                                    Save Settings
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Admin Notification Emails Section */}
                            <Card className="rounded-2xl mt-8">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Envelope weight="bold" className="h-5 w-5 text-primary" />
                                        Notification Email Recipients
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="new-admin-email" className="text-sm font-bold">Email Address</Label>
                                            <Input
                                                id="new-admin-email"
                                                placeholder="admin@example.com"
                                                value={newAdminEmail}
                                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                                className="h-11 rounded-xl"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddAdminEmail()}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddAdminEmail}
                                            disabled={isAddingAdminEmail || !newAdminEmail}
                                            className="sm:mt-8 h-11 rounded-xl bg-primary hover:bg-primary/90"
                                        >
                                            {isAddingAdminEmail ? <CircleNotch weight="bold" className="h-4 w-4 animate-spin" /> : <Plus weight="bold" className="mr-2 h-4 w-4" />}
                                            Add Email
                                        </Button>
                                    </div>

                                    <div className="border rounded-xl overflow-hidden mt-6">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-muted/30 border-b">
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Email Address</th>
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                                                    <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoadingAdminEmails ? (
                                                    <tr>
                                                        <td colSpan={3} className="py-10 text-center">
                                                            <CircleNotch weight="bold" className="h-6 w-6 animate-spin mx-auto text-primary" />
                                                        </td>
                                                    </tr>
                                                ) : adminEmails.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="py-10 text-center text-muted-foreground">
                                                            No admin emails added. Notifications will go to default addresses.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    adminEmails.map((admin) => (
                                                        <tr key={admin.id} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-medium">{admin.email}</td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleToggleAdminStatus(admin.id!, admin.isActive)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {admin.isActive ? (
                                                                        <ToggleRight weight="fill" className="h-6 w-6 text-primary" />
                                                                    ) : (
                                                                        <ToggleLeft weight="bold" className="h-6 w-6 text-muted-foreground" />
                                                                    )}
                                                                    <span className={`text-xs font-bold ${admin.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                        {admin.isActive ? 'Receiving' : 'Paused'}
                                                                    </span>
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveAdminEmail(admin.id!)}
                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        {/* ─── Emails Tab ─── */}
                        <TabsContent value="emails" className="space-y-6">
                            <Card className="rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Envelope weight="bold" className="h-5 w-5 text-primary" />
                                        Send Webinar Link & Resources
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold">Lecturer Name</Label>
                                            <Input
                                                value={lecturerName}
                                                onChange={(e) => setLecturerName(e.target.value)}
                                                placeholder="e.g. Lahiruka Weeraratne"
                                                className="h-11 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold">Zoom Link</Label>
                                            <Input
                                                value={zoomLink}
                                                onChange={(e) => setZoomLink(e.target.value)}
                                                placeholder="https://zoom.us/j/..."
                                                className="h-11 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold">Resources Link</Label>
                                        <Input
                                            value={resourcesLink}
                                            onChange={(e) => setResourcesLink(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold">Additional Message (Optional)</Label>
                                        <Textarea
                                            value={additionalMessage}
                                            onChange={(e) => setAdditionalMessage(e.target.value)}
                                            placeholder="Any extra instructions..."
                                            className="rounded-xl min-h-[100px]"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border/20">
                                        <div className="w-full mb-2">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Primary Link and Resources (Send Manual)</h4>
                                        </div>
                                        <Button
                                            onClick={() => handleSendBulkEmail('pending')}
                                            disabled={isSendingEmails || registrations.length === 0}
                                            className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90"
                                        >
                                            {isSendingEmails ? (
                                                <CircleNotch weight="bold" className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <PaperPlaneTilt weight="bold" className="mr-2 h-4 w-4" />
                                            )}
                                            Send Link to Pending ({registrations.filter(r => !r.emailSent).length})
                                        </Button>
                                        <Button
                                            onClick={() => handleSendBulkEmail('all')}
                                            disabled={isSendingEmails || registrations.length === 0}
                                            variant="outline"
                                            className="h-11 px-6 rounded-xl"
                                        >
                                            <ArrowsClockwise weight="bold" className="mr-2 h-4 w-4" />
                                            Resend Link to All ({registrations.length})
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border/20">
                                        <div className="w-full mb-2">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Confirmation Reminder (Registration Alert)</h4>
                                        </div>
                                        <Button
                                            onClick={() => handleSendBulkConfirmation('pending')}
                                            disabled={isSendingConfirmations || registrations.length === 0}
                                            variant="secondary"
                                            className="h-11 px-6 rounded-xl"
                                        >
                                            {isSendingConfirmations ? (
                                                <CircleNotch weight="bold" className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Envelope weight="bold" className="mr-2 h-4 w-4" />
                                            )}
                                            Send Confirmation to Pending ({registrations.filter(r => !r.confirmationSent).length})
                                        </Button>
                                        <Button
                                            onClick={() => handleSendBulkConfirmation('all')}
                                            disabled={isSendingConfirmations || registrations.length === 0}
                                            variant="ghost"
                                            className="h-11 px-6 rounded-xl border border-dashed hover:border-solid hover:bg-muted"
                                        >
                                            <ArrowsClockwise weight="bold" className="mr-2 h-4 w-4" />
                                            Force Send Confirmation to All
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
