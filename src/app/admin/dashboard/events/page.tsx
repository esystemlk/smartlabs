'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Image as ImageIcon,
    Link as LinkIcon,
    Calendar,
    Tag,
    ArrowLeft,
    Search,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Sparkles,
    Pencil,
    Upload,
    HelpCircle
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminEventsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        category: 'Workshop',
        date: '',
        link: '/signup',
        buttonText: 'Register Now',
        bindRegistration: false
    });

    const eventsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'events'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateDoc(doc(firestore, 'events', editingId), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
                toast({
                    title: "Updated",
                    description: "Event has been updated successfully.",
                });
            } else {
                await addDoc(collection(firestore, 'events'), {
                    ...formData,
                    createdAt: serverTimestamp(),
                });
                toast({
                    title: "Success",
                    description: "Event has been added successfully.",
                });
            }

            setIsAdding(false);
            setEditingId(null);
            setFormData({
                title: '',
                description: '',
                image: '',
                category: 'Workshop',
                date: '',
                link: '/signup',
                buttonText: 'Register Now',
                bindRegistration: false
            });
        } catch (error) {
            console.error("Error saving event:", error);
            toast({
                title: "Error",
                description: "Failed to save event. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (event: any) => {
        setFormData({
            title: event.title,
            description: event.description,
            image: event.image,
            category: event.category,
            date: event.date,
            link: event.link,
            buttonText: event.buttonText,
            bindRegistration: event.bindRegistration || false
        });
        setEditingId(event.id);
        setIsAdding(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `events/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setFormData(prev => ({ ...prev, image: downloadURL }));
            toast({
                title: "Image Uploaded",
                description: "Your local image is now hosted and ready.",
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload image. Please check your connection.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm("Are you sure you want to delete this event?")) return;

        try {
            await deleteDoc(doc(firestore, 'events', id));
            toast({
                title: "Deleted",
                description: "Event has been removed.",
            });
        } catch (error) {
            console.error("Error deleting event:", error);
            toast({
                title: "Error",
                description: "Failed to delete event.",
                variant: "destructive"
            });
        }
    };

    if (isUserLoading || eventsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#020617] p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
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
                            Event Management
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Admin</Badge>
                        </h1>
                        <p className="text-muted-foreground font-medium">Manage your website's events, popups, and announcements.</p>
                    </div>

                    <Dialog open={isAdding} onOpenChange={(open) => {
                        setIsAdding(open);
                        if (!open) {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                description: '',
                                image: '',
                                category: 'Workshop',
                                date: '',
                                link: '/signup',
                                buttonText: 'Register Now',
                                bindRegistration: false
                            });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-[32px] border-border/50 shadow-2xl overflow-hidden p-0 bg-card">
                            <DialogHeader className="p-8 pb-0">
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    {editingId ? 'Edit Event' : 'Create New Event'}
                                </DialogTitle>
                                <DialogDescription className="font-medium">
                                    {editingId ? 'Modify the details of your existing event.' : 'Fill in the details below to add a new event to the landing page and popup.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g. PTE Mastery Workshop"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                        <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Workshop">Workshop</SelectItem>
                                                <SelectItem value="Seminar">Seminar</SelectItem>
                                                <SelectItem value="Live Class">Live Class</SelectItem>
                                                <SelectItem value="Special Offer">Special Offer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Short description for the event..."
                                        required
                                        className="rounded-xl min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="image" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Image Resource</Label>
                                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold cursor-help group/tip relative">
                                            <HelpCircle className="h-3 w-3" />
                                            Local Path Info
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-card border rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50">
                                                Place images in <code>public/</code> folder. Ex: <code>/bs.png</code>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="image"
                                                name="image"
                                                value={formData.image}
                                                onChange={handleInputChange}
                                                placeholder="https://... or /local-img.png"
                                                required
                                                className="rounded-xl pl-10"
                                            />
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-xl border-dashed border-2 px-3"
                                                asChild
                                            >
                                                <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    <span className="hidden sm:inline">Upload</span>
                                                </label>
                                            </Button>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="rounded-xl font-bold transition-all hover:bg-secondary/80 active:scale-95 px-4 h-10 flex items-center gap-2 shrink-0"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '/pst.jpeg' }))}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            Use Default
                                        </Button>
                                    </div>

                                    {/* Preview Small */}
                                    {formData.image && (
                                        <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-border/50 bg-muted">
                                            <Image
                                                src={formData.image}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                                unoptimized={formData.image.startsWith('/')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date / Time</Label>
                                        <div className="relative">
                                            <Input
                                                id="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Feb 25, 6:00 PM"
                                                required
                                                className="rounded-xl pl-10"
                                            />
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="link" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Redirect Link</Label>
                                        <div className="relative">
                                            <Input
                                                id="link"
                                                name="link"
                                                value={formData.link}
                                                onChange={handleInputChange}
                                                placeholder="/signup"
                                                required
                                                className="rounded-xl pl-10"
                                            />
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="buttonText" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Button Text</Label>
                                    <Input
                                        id="buttonText"
                                        name="buttonText"
                                        value={formData.buttonText}
                                        onChange={handleInputChange}
                                        placeholder="Register Now"
                                        required
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Bind Registration Page</Label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Redirects to /smreg with zoom access</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.bindRegistration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bindRegistration: e.target.checked }))}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>

                                <DialogFooter className="bg-muted/30 p-8 pt-6 border-t border-border/50">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 rounded-2xl bg-primary text-white font-bold transition-all hover:scale-[1.02]"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />)}
                                        {editingId ? 'Update Event' : 'Create Event'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Info Banner */}
                <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-black tracking-tight">Post Display Guidelines</h3>
                        <p className="text-sm text-muted-foreground font-medium">
                            For the best visual experience in the home screen popup, ensure your images are in **9:16 Portrait aspect ratio** (e.g., 1080x1920). All events added here will automatically appear on the /events page and the main home screen.
                        </p>
                    </div>
                </div>

                {/* Events List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {events?.map((event: any) => (
                        <Card key={event.id} className="group relative bg-card border-border/50 rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            {/* Image Preview - 9:16 forced aspect ratio */}
                            <div className="relative aspect-[9/16] overflow-hidden">
                                <Image
                                    src={event.image}
                                    alt={event.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-white font-black uppercase tracking-widest px-3 py-1">
                                        {event.category}
                                    </Badge>
                                </div>

                                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {event.date}
                                    </div>
                                    <h3 className="text-xl font-black text-white leading-tight line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-[11px] text-white/70 font-medium line-clamp-2">
                                        {event.description}
                                    </p>
                                </div>

                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => startEdit(event)}
                                        className="h-10 w-10 flex items-center justify-center bg-primary/20 hover:bg-primary backdrop-blur-md border border-primary/30 rounded-full text-white transition-all scale-90 hover:scale-105"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="h-10 w-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500 backdrop-blur-md border border-red-500/30 rounded-full text-white transition-all scale-90 hover:scale-105"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Status/Footer info */}
                            <CardContent className="p-5 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Button Text</span>
                                        <span className="text-xs font-black">{event.buttonText}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" asChild>
                                        <Link href={event.link} target="_blank"><ChevronRight className="h-4 w-4" /></Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* New Event Placeholder Card */}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="group relative aspect-[9/16] rounded-[32px] border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 text-center p-8"
                    >
                        <div className="h-16 w-16 rounded-full bg-muted group-hover:bg-primary/10 group-hover:scale-110 transition-all flex items-center justify-center">
                            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-black tracking-tight">Add New Post</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">Setup your next event or announcement</p>
                        </div>
                    </button>
                </div>

                {(!events || events.length === 0) && !eventsLoading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">No Events Found</h3>
                            <p className="text-muted-foreground">Click the "Add New Event" button to get started.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
