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
    Calendar,
    Clock,
    User,
    ArrowLeft,
    Loader2,
    Pencil,
    Youtube,
    MessageCircle,
    Users,
    MessageSquare,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workshop, StudentProblem } from '@/lib/services/workshop.service';

export default function AdminWorkshopsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [problems, setProblems] = useState<StudentProblem[]>([]);
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<Workshop, 'id' | 'createdAt'>>({
        title: '',
        description: '',
        date: new Date(),
        time: '',
        instructor: '',
        seatsAvailable: 100,
        youtubeLink: 'https://www.youtube.com/@SmartLabs-Official',
        whatsappLink: '',
        whatsappQR: '',
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
                toast({ title: "Updated", description: "Workshop updated successfully." });
            } else {
                await addDoc(collection(firestore, 'workshops'), {
                    ...workshopData,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Workshop created successfully." });
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
            seatsAvailable: 100,
            youtubeLink: 'https://www.youtube.com/@SmartLabs-Official',
            whatsappLink: '',
            whatsappQR: '',
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
            youtubeLink: workshop.youtubeLink || 'https://www.youtube.com/@SmartLabs-Official',
            whatsappLink: workshop.whatsappLink || '',
            whatsappQR: workshop.whatsappQR || '',
            benefits: workshop.benefits || [],
            isActive: workshop.isActive ?? true,
        });
        setEditingId(workshop.id);
        setIsAdding(true);
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

    const viewProblems = async (workshopId: string) => {
        if (!firestore) return;
        setSelectedWorkshopId(workshopId);
        try {
            const q = query(collection(firestore, 'workshop_problems'), where('workshopId', '==', workshopId), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const probs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProblem));
            setProblems(probs);
        } catch (error) {
            console.error("Error fetching problems:", error);
        }
    };

    if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-primary">
                        <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                    </Button>
                    <h1 className="text-4xl font-black font-headline tracking-tight">Workshop Management</h1>
                    <p className="text-muted-foreground">Manage your monthly live sessions and student queries.</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingId(null); setIsAdding(true); }} className="rounded-2xl h-12 px-6 font-bold shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Create Workshop
                </Button>
            </header>

            <Tabs defaultValue="workshops" className="space-y-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <TabsTrigger value="workshops" className="rounded-xl font-bold px-8">Workshops</TabsTrigger>
                    <TabsTrigger value="problems" className="rounded-xl font-bold px-8" disabled={!selectedWorkshopId}>
                        Student Problems {selectedWorkshopId && `(${problems.length})`}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workshops" className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workshopsLoading ? (
                            [1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-[32px]" />)
                        ) : workshops?.map((workshop: any) => (
                            <Card key={workshop.id} className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white dark:bg-slate-900 group hover:shadow-2xl transition-all">
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-primary" />
                                        </div>
                                        <Badge variant={workshop.isActive ? "default" : "secondary"} className="rounded-full">
                                            {workshop.isActive ? "Active" : "Draft"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black font-headline line-clamp-1 group-hover:text-primary transition-colors">
                                            {workshop.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-bold flex items-center gap-2">
                                            <Clock className="h-4 w-4" /> {new Date(workshop.date?.toDate()).toLocaleDateString()} at {workshop.time}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => startEdit(workshop)} className="flex-1 rounded-xl font-bold"><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                                        <Button variant="outline" size="sm" onClick={() => viewProblems(workshop.id)} className="flex-1 rounded-xl font-bold bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white"><MessageSquare className="h-4 w-4 mr-2" /> Queries</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(workshop.id)} className="rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="problems">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">Student Problems Analysis</h2>
                            <Badge className="bg-primary px-4 py-1 rounded-full">{problems.length} Total Queries</Badge>
                        </div>
                        
                        <div className="grid gap-4">
                            {problems.length === 0 ? (
                                <Card className="p-12 text-center rounded-[32px] border-dashed">
                                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <p className="text-muted-foreground font-medium">No problems submitted yet for this workshop.</p>
                                </Card>
                            ) : problems.map(prob => (
                                <Card key={prob.id} className="p-6 rounded-[32px] border-none shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <User className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="space-y-2 flex-grow">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-black text-lg">{prob.studentName}</h4>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    {new Date(prob.createdAt?.toDate()).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed font-medium">
                                                {prob.problem}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[40px] border-none shadow-2xl p-0">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black">{editingId ? 'Update Workshop' : 'Create Workshop'}</DialogTitle>
                            <DialogDescription className="text-white/70 font-medium">Configure this month's live session details.</DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white dark:bg-slate-900">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Workshop Title</Label>
                                <Input name="title" value={formData.title} onChange={handleInputChange} className="rounded-2xl h-12" placeholder="e.g. Master PTE Speaking in 2 Hours" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Instructor</Label>
                                <Input name="instructor" value={formData.instructor} onChange={handleInputChange} className="rounded-2xl h-12" placeholder="e.g. Dr. Laheer" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                                <Input name="date" type="date" value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''} onChange={handleInputChange} className="rounded-2xl h-12" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Time</Label>
                                <Input name="time" value={formData.time} onChange={handleInputChange} className="rounded-2xl h-12" placeholder="e.g. 6:00 PM - 8:00 PM" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Seats</Label>
                                <Input name="seatsAvailable" type="number" value={formData.seatsAvailable} onChange={handleInputChange} className="rounded-2xl h-12" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">YouTube Channel URL</Label>
                                <div className="relative">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                                    <Input name="youtubeLink" value={formData.youtubeLink} onChange={handleInputChange} className="rounded-2xl h-12 pl-12" placeholder="Channel URL" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} className="rounded-[24px] h-32" placeholder="Workshop overview..." required />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">WhatsApp Group Link</Label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                                    <Input name="whatsappLink" value={formData.whatsappLink} onChange={handleInputChange} className="rounded-2xl h-12 pl-12" placeholder="https://chat.whatsapp.com/..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">WhatsApp QR Image URL</Label>
                                <Input name="whatsappQR" value={formData.whatsappQR} onChange={handleInputChange} className="rounded-2xl h-12" placeholder="Direct link to QR image" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Benefits</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-bold"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                            </div>
                            <div className="grid gap-3">
                                {formData.benefits.map((benefit, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={benefit} onChange={(e) => handleBenefitChange(i, e.target.value)} className="rounded-xl" placeholder="e.g. Free Templates" />
                                        <Button type="button" variant="ghost" onClick={() => removeBenefit(i)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl px-10 font-black h-12 shadow-lg shadow-primary/20">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                {editingId ? 'Update Session' : 'Create Session'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
