
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { FileText, Video, Download, View, Lock, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ResourcesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const enrollmentsQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, `users/${user.uid}/enrollments`), where('enrollmentStatus', '==', 'active')) : null,
    [firestore, user]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const enrolledCourseIds = useMemo(() => enrollments?.map(e => e.courseId) || [], [enrollments]);

  const resourcesQuery = useMemoFirebase(() => 
    firestore && enrolledCourseIds.length > 0 ? query(collection(firestore, 'resources'), where('courseId', 'in', enrolledCourseIds)) : null,
    [firestore, enrolledCourseIds]
  );
  
  const { data: resourceLibrary, isLoading: resourcesLoading } = useCollection(resourcesQuery);

  const documents = resourceLibrary?.filter(r => r.resourceType === 'document' || r.resourceType === 'image' || r.resourceType === 'html');
  const videos = resourceLibrary?.filter(r => r.resourceType === 'video');

  const isLoading = enrollmentsLoading || resourcesLoading;

  const renderSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-3/4 mt-2" />
            <Skeleton className="h-4 w-1/4 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const renderNoAccess = () => (
    <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>No Resources Found</AlertTitle>
        <AlertDescription>
            You do not have any active course enrollments, or your courses do not have materials yet.
            Please <Link href="/courses" className="font-bold underline hover:text-primary">enroll in a course</Link> to access the resource library.
        </AlertDescription>
    </Alert>
  );

  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Resource Library</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              A curated collection of practice tests, documents, and video lessons for your enrolled courses.
            </p>
          </div>
          
           {isLoading ? renderSkeleton() : (
            !user || enrolledCourseIds.length === 0 ? renderNoAccess() : (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-xs sm:max-w-md mx-auto mb-10">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {resourceLibrary?.map((item) => (
                            <ResourceCard key={item.id} item={item} />
                            ))}
                        </div>
                        {resourceLibrary?.length === 0 && <p className="text-center text-muted-foreground">No resources available for your courses yet.</p>}
                    </TabsContent>
                    <TabsContent value="documents">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {documents?.map((item) => (
                            <ResourceCard key={item.id} item={item} />
                            ))}
                        </div>
                        {documents?.length === 0 && <p className="text-center text-muted-foreground">No documents available for your courses yet.</p>}
                    </TabsContent>
                    <TabsContent value="videos">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {videos?.map((item) => (
                            <ResourceCard key={item.id} item={item} />
                            ))}
                        </div>
                        {videos?.length === 0 && <p className="text-center text-muted-foreground">No videos available for your courses yet.</p>}
                    </TabsContent>
                </Tabs>
            )
           )}
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ item }: { item: any }) {
  const isHtml = item.resourceType === 'html';
  const isVideo = item.resourceType === 'video';

  const Icon = isVideo ? Video : FileText;
  const href = isHtml ? `/resources/${item.id}` : item.url || '#';
  const target = isHtml ? '_self' : '_blank';

  const getButtonProps = () => {
    if (isHtml) return { text: 'View Content', icon: View };
    if (isVideo) return { text: 'Watch Now', icon: Play };
    return { text: 'Download', icon: Download };
  };

  const { text: buttonText, icon: ButtonIcon } = getButtonProps();

  if (isVideo) {
    return (
      <Card className="overflow-hidden group shadow-lg hover:shadow-xl transition-shadow flex flex-col">
        <Link href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className="flex flex-col flex-grow">
          <div className="relative aspect-video">
            <Image 
              src={`https://picsum.photos/seed/${item.id}/400/225`}
              alt={item.title}
              data-ai-hint="lesson video"
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="h-12 w-12 text-white/80 transition-transform group-hover:scale-110" />
            </div>
          </div>
          <CardHeader className="flex-grow">
            <CardTitle className="font-headline">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <ButtonIcon className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex-grow">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
            <ButtonIcon className="mr-2 h-4 w-4" />
            {buttonText}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
