'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
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
    Clock,
    User,
    ArrowLeft,
    Search,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Pencil,
    Upload,
    Video,
    FileText,
    Download,
    Users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workshop, WorkshopRegistration } from '@/lib/services/workshop.service';

export default function AdminWorkshopsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingNotes, setIsUploadingNotes] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<Workshop, 'id' | 'createdAt'>>({
        title: '',
        description: '',
        date: new Date(),
        time: '',
        instructor: '',
        seatsAvailable: 50,
        thumbnailUrl: '',
        youtubeLink: '',
        notesFileUrl: '',
        notesFileName: '',
        benefits: [],
        isActive: true,
    });

    const workshopsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'workshops'), orderBy('date', 'desc')) : null,
        [firestore]
    );
    const { data: workshops, isLoading: workshopsLoading } = useCollection(workshopsQuery);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            setFormData(prev => ({ ...prev, [name]: new Date(value) }));
        } else if (name === 'seatsAvailable') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBenefitChange = (index: number, value: string) => {
        const newBenefits = [...formData.benefits];
        newBenefits[index] = value;
        setFormData(prev => ({ ...prev, benefits: newBenefits }));
    };

    const addBenefit = () => {
        setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
    };

    const removeBenefit = (index: number) => {
        const newBenefits = formData.benefits.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, benefits: newBenefits }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setIsSubmitting(true);
        try {
            const workshopData = {
                ...formData,
                date: Timestamp.fromDate(new Date(formData.date instanceof Date ? formData.date : (formData.date as any).toDate ? (formData.date as any).toDate() : formData.date)),
            };

            if (editingId) {
                await updateDoc(doc(firestore, 'workshops', editingId), {
                    ...workshopData,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Updated", description: "Workshop has been updated successfully." });
            } else {
                await addDoc(collection(firestore, 'workshops'), {
                    ...workshopData,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Workshop has been added successfully." });
            }

            setIsAdding(false);
            setEditingId(null);
            resetForm();
        } catch (error) {
            console.error("Error saving workshop:", error);
            toast({ title: "Error", description: "Failed to save workshop.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            date: new Date(),
            time: '',
            instructor: '',
            seatsAvailable: 50,
            thumbnailUrl: '',
            youtubeLink: '',
            notesFileUrl: '',
            notesFileName: '',
            benefits: [],
            isActive: true,
        });
    };

    const startEdit = (workshop: any) => {
        setFormData({
            title: workshop.title,
            description: workshop.description,
            date: workshop.date instanceof Date ? workshop.date : (workshop.date as any).toDate(),
            time: workshop.time,
            instructor: workshop.instructor,
            seatsAvailable: workshop.seatsAvailable,
            thumbnailUrl: workshop.thumbnailUrl || '',
            youtubeLink: workshop.youtubeLink || '',
            notesFileUrl: workshop.notesFileUrl || '',
            notesFileName: workshop.notesFileName || '',
            benefits: workshop.benefits || [],
            isActive: workshop.isActive ?? true,
        });
        setEditingId(workshop.id);
        setIsAdding(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'notes') => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        if (type === 'thumbnail') setIsUploading(true);
        else setIsUploadingNotes(true);

        try {
            const path = type === 'thumbnail' ? `workshops/thumbnails/${Date.now()}-${file.name}` : `workshops/notes/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            if (type === 'thumbnail') {
                setFormData(prev => ({ ...prev, thumbnailUrl: downloadURL }));
            } else {
                setFormData(prev => ({ ...prev, notesFileUrl: downloadURL, notesFileName: file.name }));
            }
            
            toast({ title: "File Uploaded", description: "File is ready." });
        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Upload Failed", description: "Failed to upload file.", variant: "destructive" });
        } finally {
            if (type === 'thumbnail') setIsUploading(false);
            else setIsUploadingNotes(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(firestore, 'workshops', id));
            toast({ title: "Deleted", description: "Workshop removed." });
        } catch (error) {
            console.error("Error deleting workshop:", error);
        }
    };

    const viewRegistrations = async (workshopId: string) => {
        if (!firestore) return;
        setSelectedWorkshopId(workshopId);
        try {
            const q = query(collection(firestore, 'registrations'), where('workshopId', '==', workshopId));
            const snapshot = await getDocs(q);
            const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkshopRegistration));
            setRegistrations(regs);
        } catch (error) {
            console.error("Error fetching registrations:", error);
        }
    };

    const exportToCSV = () => {
        if (registrations.length === 0) return;
        const headers = ['Full Name', 'Email', 'Phone', 'Registration Date', 'Reviewed'];
        const csvContent = [
            headers.join(','),
            ...registrations.map(r => [
                `"${r.fullName}"`,
                `"${r.email}"`,
                `"${r.phone}"`,
                `"${new Date(r.registrationDate?.toDate()).toLocaleString()}"`,
                r.hasReviewed ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `registrations-${selectedWorkshopId}.csv`;
        link.click();
    };

    if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-4 -ml-4">
                        <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                    </Button>
                    <h1 className="text-4xl font-black font-headline tracking-tight">Workshop Management</h1>
                    <p className="text-muted-foreground">Create and manage your free monthly workshops.</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingId(null); setIsAdding(true); }} className="rounded-2xl h-12 px-6 font-bold shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Create Workshop
                </Button>
            </header>

            <Tabs defaultValue="workshops" className="space-y-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <TabsTrigger value="workshops" className="rounded-xl font-bold">Workshops</TabsTrigger>
                    <TabsTrigger value="registrations" className="rounded-xl font-bold" disabled={!selectedWorkshopId}>
                        Registrations {selectedWorkshopId && `(${registrations.length})`}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workshops" className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workshopsLoading ? (
                            [1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />)
                        ) : workshops?.map((workshop: any) => (
                            <Card key={workshop.id} className="overflow-hidden border-none shadow-xl rounded-[32px] group">
                                <div className="relative h-48 bg-slate-200">
                                    {workshop.thumbnailUrl ? (
                                        <Image src={workshop.thumbnailUrl} alt={workshop.title} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full"><ImageIcon className="h-12 w-12 text-slate-400" /></div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Badge variant={workshop.isActive ? "default" : "secondary"}>{workshop.isActive ? "Active" : "Draft"}</Badge>
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">{workshop.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> {new Date(workshop.date?.toDate()).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(workshop)} className="flex-1 rounded-xl"><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                                    <Button variant="outline" size="sm" onClick={() => viewRegistrations(workshop.id)} className="flex-1 rounded-xl"><Users className="h-4 w-4 mr-2" /> Users</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(workshop.id)} className="rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="registrations">
                    <Card className="rounded-[32px] border-none shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Student Registrations</CardTitle>
                                <CardDescription>Managing students for {workshops?.find(w => w.id === selectedWorkshopId)?.title}</CardDescription>
                            </div>
                            <Button onClick={exportToCSV} variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-4 px-2">Name</th>
                                            <th className="text-left py-4 px-2">Email</th>
                                            <th className="text-left py-4 px-2">Phone</th>
                                            <th className="text-left py-4 px-2">Date</th>
                                            <th className="text-left py-4 px-2">Review</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map(reg => (
                                            <tr key={reg.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-2 font-bold">{reg.fullName}</td>
                                                <td className="py-4 px-2">{reg.email}</td>
                                                <td className="py-4 px-2">{reg.phone}</td>
                                                <td className="py-4 px-2 text-muted-foreground">{new Date(reg.registrationDate?.toDate()).toLocaleDateString()}</td>
                                                <td className="py-4 px-2">
                                                    {reg.hasReviewed ? (
                                                        <Badge className="bg-green-500">Yes</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Workshop' : 'Create New Workshop'}</DialogTitle>
                        <DialogDescription>Fill in the details for your free monthly workshop.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Workshop Title</Label>
                                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Mastering PTE Speaking" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Instructor Name</Label>
                                <Input name="instructor" value={formData.instructor} onChange={handleInputChange} placeholder="Dr. Smith" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input name="date" type="date" value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input name="time" value={formData.time} onChange={handleInputChange} placeholder="10:00 AM - 12:00 PM" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Seats Available</Label>
                                <Input name="seatsAvailable" type="number" value={formData.seatsAvailable} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label>YouTube Live Link</Label>
                                <Input name="youtubeLink" value={formData.youtubeLink} onChange={handleInputChange} placeholder="https://youtube.com/live/..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Tell students what they will learn..." className="h-32" required />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label>Thumbnail Image</Label>
                                <div className="flex flex-col gap-4">
                                    {formData.thumbnailUrl && (
                                        <div className="relative h-40 w-full rounded-2xl overflow-hidden border">
                                            <Image src={formData.thumbnailUrl} alt="Thumbnail" fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumbnail')} className="flex-1" />
                                        {isUploading && <Loader2 className="animate-spin h-5 w-5 mt-2" />}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label>Workshop Notes (PDF/PPT)</Label>
                                <div className="flex flex-col gap-4">
                                    {formData.notesFileName && (
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <span className="text-sm font-medium truncate">{formData.notesFileName}</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => handleFileUpload(e, 'notes')} className="flex-1" />
                                        {isUploadingNotes && <Loader2 className="animate-spin h-5 w-5 mt-2" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Workshop Benefits</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="rounded-xl"><Plus className="h-4 w-4 mr-2" /> Add Benefit</Button>
                            </div>
                            <div className="grid gap-3">
                                {formData.benefits.map((benefit, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={benefit} onChange={(e) => handleBenefitChange(i, e.target.value)} placeholder="e.g. Free exam templates" />
                                        <Button type="button" variant="ghost" onClick={() => removeBenefit(i)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || isUploading || isUploadingNotes}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                {editingId ? 'Update Workshop' : 'Create Workshop'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
