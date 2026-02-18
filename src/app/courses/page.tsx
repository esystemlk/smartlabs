'use client';

import { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, View } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { LMS_URL } from '@/lib/constants';

export default function CoursesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

  const enrollmentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments?.map(e => e.id) || []);
  }, [enrollments]);

  const isLoading = coursesLoading || enrollmentsLoading;

  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Explore Our Courses</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Find the perfect course to help you achieve your language proficiency goals.
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="flex flex-col">
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses?.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                return (
                  <Card key={course.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl">{course.name}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="font-semibold text-sm mb-2">Target Audience: {course.targetAudience}</p>
                        <p className="font-semibold text-sm mb-4">Syllabus Highlights:</p>
                        <ul className="space-y-2 text-muted-foreground">
                            {course.syllabus?.split(',').map((item: string, index: number) => (
                                <li key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{item.trim()}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 font-semibold">Duration: {course.duration}</p>
                    </CardContent>
                    <CardFooter>
                      {isEnrolled ? (
                        <Button asChild className="w-full" variant="secondary">
                           <Link href="/resources">
                            <View className="mr-2 h-4 w-4" />
                            View Course Materials
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild className="w-full">
                          <Link href={LMS_URL} target="_blank" rel="noopener noreferrer">Enroll Now</Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
            })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
