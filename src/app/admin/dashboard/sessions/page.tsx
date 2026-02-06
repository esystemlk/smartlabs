'use client';

import { useState } from 'react';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Video,
    Users,
    ArrowLeft,
    Search,
    Loader2,
    ExternalLink,
    Trash2,
    Save,
    CheckCircle2,
    Calendar,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function SessionManagerPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const eventsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'events'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: events, isLoading } = useCollection(eventsQuery);

    const filteredEvents = events?.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateLink = async (eventId: string, newLink: string) => {
        if (!firestore) return;
        setIsUpdating(eventId);
        try {
            await updateDoc(doc(firestore, 'events', eventId), {
                zoomLink: newLink
            });
            toast({
                title: "Link Updated",
                description: "The session link has been pushed live.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update link.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const removeAttendee = async (eventId: string, registration: any) => {
        if (!firestore || !confirm(`Remove ${registration.name} from attendee list?`)) return;
        try {
            await updateDoc(doc(firestore, 'events', eventId), {
                registrations: arrayRemove(registration)
            });
            toast({
                title: "Attendee Removed",
                description: "The student has been removed from the session list.",
            });
            // Update local state if needed (useCollection handles this usually)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove attendee.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#020617] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            Session & Zoom Manager
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Active</Badge>
                        </h1>
                        <p className="text-muted-foreground font-medium">Manage Zoom links and student registrations for your events.</p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            className="rounded-xl pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table View */}
                <Card className="rounded-[32px] border-border/50 shadow-xl overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                                <TableHead className="py-6 font-black uppercase tracking-widest text-[10px]">Event Details</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px]">Registration Page</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px]">Attendees</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px]">Zoom / Access Link</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents?.map((event: any) => (
                                <TableRow key={event.id} className="group hover:bg-primary/5 transition-colors border-b border-border/50">
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 relative border border-border/50">
                                                {event.image && (
                                                    <img
                                                        src={event.image}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm tracking-tight">{event.title}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[11px] text-muted-foreground font-bold">{event.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {event.bindRegistration ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase tracking-tighter text-[10px]">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Bound
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground border-border/50 font-black uppercase tracking-tighter text-[10px]">
                                                Direct Link
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all group/btn"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span className="font-black text-xs">{event.registrations?.length || 0} Learners</span>
                                        </button>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    defaultValue={event.zoomLink || ''}
                                                    placeholder="Zoom Link..."
                                                    className="h-8 rounded-lg pl-9 text-xs font-medium focus:ring-1"
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (event.zoomLink || '')) {
                                                            handleUpdateLink(event.id, e.target.value);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {isUpdating === event.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                            ) : (
                                                <Save className="h-4 w-4 text-muted-foreground opacity-20" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" asChild>
                                                <Link href={event.bindRegistration ? `/smreg?id=${event.id}` : event.link} target="_blank">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {(!filteredEvents || filteredEvents.length === 0) && (
                        <div className="p-20 text-center">
                            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground font-bold">No events found matching your search.</p>
                        </div>
                    )}
                </Card>

                {/* Attendee List Dialog */}
                <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                    <DialogContent className="max-w-2xl rounded-[32px] border-border/50 shadow-2xl p-0 overflow-hidden bg-card">
                        <DialogHeader className="p-8 pb-0">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight">Attendee List</DialogTitle>
                                    <DialogDescription className="font-bold flex items-center gap-2">
                                        {selectedEvent?.title}
                                        <Badge variant="outline" className="h-5 text-[10px]">{selectedEvent?.registrations?.length || 0} Total</Badge>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-8 pt-6">
                            <div className="border border-border/50 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto no-scrollbar">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow className="border-b">
                                            <TableHead className="font-black uppercase tracking-widest text-[9px]">Student</TableHead>
                                            <TableHead className="font-black uppercase tracking-widest text-[9px]">Contact Info</TableHead>
                                            <TableHead className="font-black uppercase tracking-widest text-[9px]">Registered On</TableHead>
                                            <TableHead className="text-right font-black uppercase tracking-widest text-[9px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedEvent?.registrations?.map((reg: any, i: number) => (
                                            <TableRow key={reg.uid || i} className="hover:bg-muted/30 border-b last:border-0 border-border/30">
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary">
                                                            {reg.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-sm tracking-tight">{reg.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium text-muted-foreground">{reg.email}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(reg.timestamp).toLocaleDateString()}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                        onClick={() => removeAttendee(selectedEvent.id, reg)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!selectedEvent?.registrations || selectedEvent?.registrations.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground font-bold text-xs">
                                                    No students have registered for this session yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-6 border-t border-border/50 flex justify-end">
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold px-8 border-border/50"
                                onClick={() => setSelectedEvent(null)}
                            >
                                Close Manager
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
