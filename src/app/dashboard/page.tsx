'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ListVideo, FileText, BookOpen, BarChart3, Calendar, MessageSquare, Briefcase, GraduationCap, Clock, Home, BookCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const lmsFeatures = [
    { title: 'Class Recordings', description: 'Access recordings of all your past classes.', href: '/dashboard/recordings', icon: ListVideo },
    { title: 'Templates & Study Materials', description: 'Find course materials, templates, and notes.', href: '/resources', icon: FileText },
    { title: 'Practice Test Area', description: 'Take mock exams to prepare for the real test.', href: '/dashboard/practice-tests', icon: BookOpen },
    { title: 'Progress & Feedback', description: 'View your assignment feedback and track your progress.', href: '/dashboard/progress', icon: BarChart3 },
    { title: 'Class Schedule', description: 'Check your upcoming class timetable and links.', href: '/dashboard/schedule', icon: Calendar },
    { title: 'Support Chat', description: 'Get help from your teacher or our support team.', href: '/dashboard/support', icon: MessageSquare },
    { title: 'Enroll in New Course', description: 'Explore our courses and register for another one.', href: '/enroll', icon: GraduationCap },
    { title: 'Back to Homepage', description: 'Return to the main website.', href: '/', icon: Home },
];


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  
  const enrollmentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const activeEnrollments = useMemo(() => {
    return enrollments?.filter(e => e.enrollmentStatus === 'active') || [];
  }, [enrollments]);

  const pendingEnrollments = useMemo(() => {
    return enrollments?.filter(e => e.enrollmentStatus === 'pending') || [];
  }, [enrollments]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    } else if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        getDoc(userRef).then(userDoc => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserRole(userData.role);
                if(userData.role === 'user' && !userData.hasCompletedOnboarding) {
                    router.push('/welcome');
                }
            } else {
                 router.push('/login');
            }
        });
    }
  }, [user, isUserLoading, router, firestore]);
  
  const isLoading = isUserLoading || enrollmentsLoading || !userRole;

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-40 w-full" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  const isAdminOrDev = userRole === 'admin' || userRole === 'developer' || userRole === 'teacher';

  return (
    <>
        <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Dashboard</h1>
            <p className="text-md text-muted-foreground mt-1">Welcome back, {user?.displayName}!</p>
        </header>
        
        {isAdminOrDev && (
            <Card className="mb-8 border-amber-500 bg-amber-500/10">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Admin Access</CardTitle>
                        <CardDescription>Manage users and content from the admin panel.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <Briefcase /> Go to Admin
                        </Link>
                    </Button>
                </CardHeader>
            </Card>
        )}

         <div className="mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GraduationCap />My Enrollment Status</CardTitle>
                    <CardDescription>Here are your current course enrollments and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    {enrollments && enrollments.length > 0 ? (
                        <div className="space-y-4">
                            {enrollments.map(e => (
                                <div key={e.id}>
                                    {e.enrollmentStatus === 'pending' ? (
                                        <Alert variant="default" className="border-amber-500 bg-amber-500/10">
                                            <Clock className="h-4 w-4" />
                                            <AlertTitle>
                                                {e.courseId} ({e.batchName}) - Pending Verification
                                            </AlertTitle>
                                            <AlertDescription>
                                                We're confirming your payment. Access to course materials will be granted shortly. Please be patient.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Alert variant="default" className="border-green-500 bg-green-500/10 text-green-900 dark:text-green-100">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <AlertTitle>
                                                {e.courseId} ({e.batchName}) - Active
                                            </AlertTitle>
                                            <AlertDescription>
                                                You have full access to this course.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">You are not enrolled in any courses yet. <Link href="/courses" className="font-semibold text-primary hover:underline">Explore courses</Link></p>
                    )}
                </CardContent>
            </Card>
        </div>
        
        {activeEnrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {lmsFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                    <Card key={feature.title} className="group shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                                <Link href={feature.href}>
                                    Go to {feature.title} <ChevronRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
            </div>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Your Learning Hub is Almost Ready!</CardTitle>
                    <CardDescription>
                        {pendingEnrollments.length > 0 
                            ? "Once your enrollment is approved, all your learning materials and tools will appear here."
                            : "Enroll in a course to unlock your personalized learning dashboard."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground pt-6">
                     <BookCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p>
                        {pendingEnrollments.length > 0 
                            ? "We are currently verifying your enrollment. Please check back shortly." 
                            : "You don't have any active courses yet."}
                    </p>
                    {pendingEnrollments.length === 0 && (
                        <Button asChild className="mt-4">
                            <Link href="/courses">Explore Courses</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        )}
    </>
  );
}
