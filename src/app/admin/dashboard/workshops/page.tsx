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
import { motion, AnimatePresence } from 'framer-motion';
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
    CheckCircle2,
    ChevronRight,
    Search,
    Filter,
    LayoutGrid,
    List,
    Sparkles,
    ExternalLink
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
import { cn } from '@/lib/utils';

export default function AdminWorkshopsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [problems, setProblems] = useState<StudentProblem[]>([]);
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState<Omit<Workshop, 'id' | 'createdAt'>>({
        title: '',
        description: '',
        date: new Date(),
        time: '',
        instructor: '',
        seatsAvailable: 100,
        youtubeLink: 'https://www.youtube.com/@SmartLabs-Official',
        whatsappLink: 'https://chat.whatsapp.com/IUrSQ6Hh6mBEXk3k5ivBOD?mode=gi_t',
        whatsappQR: '',
        benefits: [],
        isActive: true,
    });

    const workshopsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'workshops'), orderBy('date', 'desc')) : null,
        [firestore]
    );
    const { data: workshops, isLoading: workshopsLoading } = useCollection(workshopsQuery);

    const filteredWorkshops = workshops?.filter(w => 
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            whatsappLink: 'https://chat.whatsapp.com/IUrSQ6Hh6mBEXk3k5ivBOD?mode=gi_t',
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

    if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#020617]"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pb-20">
            {/* Advanced Header */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-10 pb-12 px-4">
                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]"
                            >
                                <Sparkles className="h-4 w-4" />
                                Workshop Control Center
                            </motion.div>
                            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter leading-tight">
                                Monthly <span className="gradient-text italic">Live Training</span>
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg max-w-md">
                                Empowering students through real-time interaction and problem analysis.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <Button 
                                variant="ghost" 
                                asChild 
                                className="w-full sm:w-auto h-14 px-6 rounded-2xl font-bold text-muted-foreground hover:text-primary transition-all"
                            >
                                <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
                            </Button>
                            <Button 
                                onClick={() => { resetForm(); setEditingId(null); setIsAdding(true); }} 
                                className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                            >
                                <Plus className="mr-2 h-6 w-6" /> Create Session
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            </div>

            <div className="container mx-auto px-4 mt-10">
                <Tabs defaultValue="workshops" className="space-y-10">
                    {/* Responsive Tabs Navigation */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 z-20 py-4 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md">
                        <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto">
                            <TabsTrigger value="workshops" className="rounded-xl font-black px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex-1 sm:flex-none">Workshops</TabsTrigger>
                            <TabsTrigger 
                                value="problems" 
                                className="rounded-xl font-black px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex-1 sm:flex-none"
                                disabled={!selectedWorkshopId}
                            >
                                Problems {selectedWorkshopId && <Badge className="ml-2 bg-white/20 text-current border-none h-5 px-1.5 min-w-[20px]">{problems.length}</Badge>}
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-full sm:w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Search workshops..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <TabsContent value="workshops" className="space-y-8 m-0 outline-none">
                        <AnimatePresence mode="popLayout">
                            {workshopsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-80 animate-pulse bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800" />
                                    ))}
                                </div>
                            ) : filteredWorkshops?.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-32 space-y-6"
                                >
                                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto opacity-50">
                                        <Calendar className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-2xl font-black">No workshops found</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your search or create a new session.</p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {filteredWorkshops?.map((workshop: any, idx) => (
                                        <motion.div
                                            key={workshop.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white dark:bg-slate-900 group hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                                <div className="p-8 flex-grow space-y-8">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-14 h-14 rounded-[22px] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                            <Calendar className="h-7 w-7 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge variant={workshop.isActive ? "default" : "secondary"} className="rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest">
                                                                {workshop.isActive ? "Active" : "Draft"}
                                                            </Badge>
                                                            <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest">
                                                                <Users className="h-3 w-3 text-primary" />
                                                                {workshop.seatsAvailable} Seats
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <h3 className="text-3xl font-black font-headline tracking-tight line-clamp-2 leading-[1.1] group-hover:text-primary transition-colors">
                                                            {workshop.title}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-4 pt-2">
                                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                                <Clock className="h-4 w-4 text-primary" />
                                                                <span className="text-sm font-black italic">{new Date(workshop.date?.toDate()).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                                <User className="h-4 w-4 text-primary" />
                                                                <span className="text-sm font-black italic">{workshop.instructor}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-8 pt-0 mt-auto">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={() => startEdit(workshop)} 
                                                            className="rounded-2xl h-14 font-black border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-1"
                                                        >
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={() => {
                                                                viewProblems(workshop.id);
                                                                // Switch to problems tab
                                                                const tabBtn = document.querySelector('[value="problems"]') as HTMLElement;
                                                                tabBtn?.click();
                                                            }} 
                                                            className="rounded-2xl h-14 font-black bg-primary/5 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex-1 group/btn"
                                                        >
                                                            <MessageSquare className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" /> Queries
                                                        </Button>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => handleDelete(workshop.id)} 
                                                        className="w-full mt-3 h-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold opacity-40 hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Remove Session
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="problems" className="space-y-8 m-0 outline-none">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black font-headline tracking-tight">Student Problems Analysis</h2>
                                    <p className="text-muted-foreground font-medium">Analyzing feedback for: <span className="text-primary font-black italic">{workshops?.find(w => w.id === selectedWorkshopId)?.title}</span></p>
                                </div>
                                <Badge className="bg-primary px-6 py-2 rounded-2xl font-black text-sm h-auto shadow-lg shadow-primary/20">
                                    {problems.length} Total Queries
                                </Badge>
                            </div>
                            
                            <div className="grid gap-6">
                                {problems.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-20 text-center rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                    >
                                        <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                                        <p className="text-xl text-muted-foreground font-black italic">No problems submitted yet for this session.</p>
                                    </motion.div>
                                ) : (
                                    problems.map((prob, i) => (
                                        <motion.div
                                            key={prob.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Card className="p-8 rounded-[32px] border-none shadow-xl hover:shadow-2xl transition-all bg-white dark:bg-slate-900 group">
                                                <div className="flex flex-col sm:flex-row gap-6">
                                                    <div className="w-16 h-16 rounded-[22px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                        <User className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="space-y-4 flex-grow">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                            <h4 className="font-black text-2xl tracking-tight">{prob.studentName}</h4>
                                                            <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-slate-200 dark:border-slate-800 text-muted-foreground">
                                                                {new Date(prob.createdAt?.toDate()).toLocaleString()}
                                                            </Badge>
                                                        </div>
                                                        <div className="relative">
                                                            <MessageSquare className="absolute -left-2 -top-2 h-10 w-10 text-primary/5 -rotate-12 pointer-events-none" />
                                                            <p className="text-muted-foreground leading-relaxed font-medium text-lg relative z-10 italic">
                                                                "{prob.problem}"
                                                            </p>
                                                        </div>
                                                        <div className="pt-4 flex items-center gap-4">
                                                            <div className="h-[2px] grow bg-slate-100 dark:bg-slate-800 rounded-full" />
                                                            <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-primary/5">
                                                                Discuss in Live <ChevronRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Premium Create/Edit Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-[48px] border-none shadow-[0_40px_100px_rgba(0,0,0,0.3)] p-0 bg-white dark:bg-slate-900">
                    <div className="bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 p-12 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <DialogHeader>
                                <DialogTitle className="text-4xl md:text-5xl font-black font-headline tracking-tighter italic">
                                    {editingId ? 'Update Session' : 'New Workshop'}
                                </DialogTitle>
                                <DialogDescription className="text-white/70 font-medium text-lg mt-2">
                                    Design this month's expert-led training experience.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        {/* Decorative Background Icon */}
                        <Sparkles className="absolute top-1/2 right-10 -translate-y-1/2 h-64 w-64 text-white/10 rotate-12 pointer-events-none" />
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-10 space-y-10">
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Workshop Title</Label>
                                <Input name="title" value={formData.title} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" placeholder="Master PTE Speaking" required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Expert Instructor</Label>
                                <Input name="instructor" value={formData.instructor} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" placeholder="Dr. Laheer" required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Live Session Date</Label>
                                <Input name="date" type="date" value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Time Slot</Label>
                                <Input name="time" value={formData.time} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" placeholder="6:00 PM - 8:00 PM" required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Total Capacity</Label>
                                <Input name="seatsAvailable" type="number" value={formData.seatsAvailable} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">YouTube Channel URL</Label>
                                <div className="relative">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-red-500" />
                                    <Input name="youtubeLink" value={formData.youtubeLink} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold pl-14" placeholder="YouTube URL" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Detailed Description</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} className="rounded-[32px] min-h-[150px] bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-medium p-6" placeholder="What will students learn in this session?" required />
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">WhatsApp Group Link</Label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500" />
                                    <Input name="whatsappLink" value={formData.whatsappLink} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold pl-14" placeholder="chat.whatsapp.com/..." />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">WhatsApp QR URL</Label>
                                <Input name="whatsappQR" value={formData.whatsappQR} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 text-lg font-bold" placeholder="URL to QR image" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Session Highlights & Benefits</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-black uppercase text-[10px] tracking-widest h-10 px-4 transition-all"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {formData.benefits.map((benefit, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex gap-2"
                                    >
                                        <Input value={benefit} onChange={(e) => handleBenefitChange(i, e.target.value)} className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary/20 font-bold" placeholder="e.g. Free PTE Study Pack" />
                                        <Button type="button" variant="ghost" onClick={() => removeBenefit(i)} className="text-red-500 hover:bg-red-50 rounded-2xl h-12 w-12 shrink-0 transition-colors"><Trash2 className="h-5 w-5" /></Button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-10 flex flex-col sm:flex-row gap-4 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-2xl h-16 px-8 font-black text-muted-foreground text-lg flex-1">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-16 px-12 font-black text-xl shadow-2xl shadow-primary/30 flex-[2] group/submit">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : (
                                    <>{editingId ? 'Update Session' : 'Launch Session'} <ChevronRight className="ml-2 h-6 w-6 group-hover/submit:translate-x-1 transition-transform" /></>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
