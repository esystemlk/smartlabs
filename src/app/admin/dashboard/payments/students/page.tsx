'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, where, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ArrowLeft, User, GraduationCap, Calendar, Mail, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentAccess {
    id: string;
    userId: string;
    courseId: string;
    paymentOrderId: string;
    accessStatus: string;
    activatedAt: any;
    userData?: any;
    batchId?: string;
    batchName?: string;
    schedule?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export default function StudentManagementPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentAccess[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;

        const checkAdmin = async () => {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists() || userSnap.data().role !== 'admin') {
                router.push('/');
            } else {
                fetchStudents();
            }
        };

        checkAdmin();
    }, [user]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'user_course_access'), orderBy('activatedAt', 'desc'));
            const snapshot = await getDocs(q);
            const studentList: StudentAccess[] = [];

            for (const accessDoc of snapshot.docs) {
                const data = accessDoc.data();
                // Fetch user details for each access record
                const userRef = doc(db, 'users', data.userId);
                const userSnap = await getDoc(userRef);

                studentList.push({
                    id: accessDoc.id,
                    ...data,
                    userData: userSnap.exists() ? userSnap.data() : null
                } as StudentAccess);
            }

            setStudents(studentList);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch student details.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccess = async (accessId: string) => {
        if (!confirm('Are you sure you want to remove this course access?')) return;

        try {
            await deleteDoc(doc(db, 'user_course_access', accessId));
            setStudents(prev => prev.filter(s => s.id !== accessId));
            toast({ title: 'Success', description: 'Access removed successfully.' });
        } catch (error) {
            console.error('Error deleting access:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove access.'
            });
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.userData?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.userData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.courseId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" asChild className="mb-2">
                        <Link href="/admin/dashboard/payments">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payments
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-black font-headline flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        Student Access Details
                    </h1>
                    <p className="text-muted-foreground">Manage students with active course access through PayHere.</p>
                </div>
            </div>

            <Card className="rounded-3xl border-border/40 shadow-xl overflow-hidden glass-card">
                <CardHeader className="bg-muted/30 pb-6 border-b">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students, emails, or courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground font-medium animate-pulse">Loading student data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 pl-8 text-foreground uppercase tracking-wider text-xs">Student details</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Course Name</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Batch</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Schedule</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Contact</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Activation Date</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs">Payment Order</TableHead>
                                        <TableHead className="font-bold py-5 text-foreground uppercase tracking-wider text-xs text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                                                No students found with course access.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <TableRow key={student.id} className="hover:bg-muted/10">
                                                <TableCell className="py-5 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                                                            <AvatarImage src={student.userData?.photoURL} />
                                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                {student.userData?.displayName?.charAt(0) || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground leading-none mb-1">{student.userData?.displayName || 'Unknown Student'}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1 opacity-70">
                                                                <Mail className="h-3 w-3" />
                                                                {student.userData?.email || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="rounded-lg border-primary/30 text-primary bg-primary/5 font-bold py-1 px-3">
                                                        {student.courseId}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-bold">{student.batchName || student.batchId || '—'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground font-medium">{student.schedule || '—'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground font-medium space-y-1">
                                                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {student.contactEmail || student.userData?.email || '—'}</div>
                                                        <div className="flex items-center gap-1"><User className="h-3 w-3" /> {student.contactPhone || '—'}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium opacity-80">
                                                        <Calendar className="h-4 w-4 text-primary/60" />
                                                        {student.activatedAt?.toDate().toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href="/admin/dashboard/payments" className="text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors">
                                                        {student.paymentOrderId}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        onClick={() => handleDeleteAccess(student.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
