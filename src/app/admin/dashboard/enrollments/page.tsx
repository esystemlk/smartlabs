
'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, writeBatch, query, collectionGroup } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified interface for the row component props
interface Enrollment {
  id: string; // This will be the unique enrollmentId (payment_id)
  userId: string;
  courseId: string;
  batchName?: string;
  enrollmentStatus: 'pending' | 'active';
  enrollmentDate: any;
  [key: string]: any; // Allow other properties
}

function EnrollmentRow({ enrollment: initialEnrollment }: { enrollment: Enrollment }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [enrollment, setEnrollment] = useState(initialEnrollment);

  const userQuery = useMemoFirebase(() =>
    firestore ? doc(firestore, 'users', enrollment.userId) : null,
    [firestore, enrollment.userId]
  );
  const { data: user, isLoading: userLoading } = useDoc(userQuery);

  const handleApprove = async () => {
    if (!firestore || !user) return;
    
    try {
      const batch = writeBatch(firestore);

      const enrollmentRef = doc(firestore, 'users', enrollment.userId, 'enrollments', enrollment.id);
      batch.update(enrollmentRef, { enrollmentStatus: 'active' });

      const activeCourseRef = doc(firestore, 'users', enrollment.userId, 'active_courses', enrollment.courseId);
      batch.set(activeCourseRef, { enrolledAt: new Date() });
      
      if (user.role === 'user') {
          const userRef = doc(firestore, 'users', enrollment.userId);
          batch.update(userRef, { role: 'student' });
      }
      
      await batch.commit();

      toast({
        title: 'Enrollment Approved!',
        description: `${user.displayName} now has access to ${enrollment.courseId}.`,
      });
      
      // Optimistically update local state
      setEnrollment(prev => ({ ...prev, enrollmentStatus: 'active' }));

    } catch (error) {
      console.error('Error approving enrollment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not approve the enrollment.',
      });
    }
  };

  if (userLoading) {
    return (
        <TableRow>
            <TableCell colSpan={6}>
                <Skeleton className="h-10 w-full" />
            </TableCell>
        </TableRow>
    );
  }

  return (
    <TableRow key={enrollment.id}>
        <TableCell>
            <div className="flex items-center gap-3">
                <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={user?.photoURL} alt="Avatar" />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
            </div>
        </TableCell>
        <TableCell><Badge variant="outline">{enrollment.courseId}</Badge></TableCell>
        <TableCell><Badge variant="secondary">{enrollment.batchName || 'N/A'}</Badge></TableCell>
        <TableCell>
            <Badge variant={enrollment.enrollmentStatus === 'active' ? 'default' : 'destructive'} className="capitalize">
                {enrollment.enrollmentStatus}
            </Badge>
        </TableCell>
        <TableCell>{enrollment.enrollmentDate?.toDate().toLocaleDateString()}</TableCell>
        <TableCell className="text-right">
            {enrollment.enrollmentStatus === 'pending' ? (
                <Button onClick={handleApprove} size="sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </Button>
            ) : (
                <span className="text-sm text-muted-foreground">Approved</span>
            )}
        </TableCell>
    </TableRow>
  );
}


export default function EnrollmentManagementPage() {
  const { firestore } = useFirebase();
  
  const enrollmentsQuery = useMemoFirebase(() => 
      firestore 
        ? query(collectionGroup(firestore, 'enrollments')) 
        : null, 
      [firestore]
  );
  const { data: enrollments, isLoading } = useCollection(enrollmentsQuery);
  
  const sortedEnrollments = useMemo(() => {
    if (!enrollments) return null;
    return [...enrollments].sort((a, b) => {
        const dateA = a.enrollmentDate?.toDate() || 0;
        const dateB = b.enrollmentDate?.toDate() || 0;
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return 0;
    });
  }, [enrollments]);

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
        <TableCell><Skeleton className="h-10 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto">
          <Button asChild variant="ghost" className="mb-4">
             <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <UserCheck className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Enrollment Management</CardTitle>
                    <CardDescription>View and approve new student course enrollments.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? renderSkeleton() : (
                        sortedEnrollments?.map((enrollment) => (
                            <EnrollmentRow key={enrollment.id} enrollment={enrollment as Enrollment} />
                        ))
                    )}
                  </TableBody>
                </Table>
                { !isLoading && sortedEnrollments?.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No pending or active enrollments found.
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
