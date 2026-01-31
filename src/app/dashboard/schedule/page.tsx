
'use client';
import { useFirebase, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, ArrowLeft, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

function BatchCard({ enrollment }: { enrollment: any }) {
    const { firestore } = useFirebase();
    
    const batchQuery = useMemoFirebase(
        () => (firestore ? doc(firestore, `courses/${enrollment.courseId}/batches`, enrollment.batchId) : null),
        [firestore, enrollment]
    );
    const { data: batch, isLoading } = useDoc(batchQuery);

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!batch) {
        return (
             <Alert variant="destructive">
                <AlertTitle>Batch Not Found</AlertTitle>
                <AlertDescription>The details for batch '{enrollment.batchName}' could not be loaded. Please contact support.</AlertDescription>
            </Alert>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{batch.name}</CardTitle>
                <CardDescription>{enrollment.courseId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="text-muted-foreground"><strong>Schedule:</strong> {batch.schedule || 'To be announced'}</p>
                </div>
                {batch.zoomLink ? (
                    <Button asChild className="w-full">
                        <a href={batch.zoomLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Live Class
                        </a>
                    </Button>
                ) : (
                    <p className="text-center text-sm text-muted-foreground font-semibold pt-4">Zoom link will be updated soon.</p>
                )}
            </CardContent>
        </Card>
    )
}

export default function SchedulePage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const enrollmentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading } = useCollection(enrollmentsQuery);

  const activeEnrollments = enrollments?.filter(e => e.enrollmentStatus === 'active');

  return (
    <div className="space-y-4">
        <Button asChild variant="ghost">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>My Class Schedule</CardTitle>
                    <CardDescription>Here are the schedules and links for your active classes.</CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : activeEnrollments && activeEnrollments.length > 0 ? (
                     <div className="grid md:grid-cols-2 gap-6">
                        {activeEnrollments.map(enrollment => (
                            <BatchCard key={enrollment.id} enrollment={enrollment} />
                        ))}
                    </div>
                ) : (
                    <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertTitle>No Active Classes</AlertTitle>
                        <AlertDescription>
                            You don't have any active class schedules right now. Once your enrollment is approved, your schedule will appear here.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
