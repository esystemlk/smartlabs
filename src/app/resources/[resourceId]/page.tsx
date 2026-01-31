'use client';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function ResourceContentPage({ params }: { params: { resourceId: string } }) {
  const { firestore } = useFirebase();

  const resourceQuery = useMemoFirebase(
    () =>
      firestore && params.resourceId
        ? doc(firestore, 'resources', params.resourceId)
        : null,
    [firestore, params]
  );
  
  const { data: resource, isLoading } = useDoc(resourceQuery);

  if (isLoading) {
    return (
        <div className="w-full">
            <section className="py-12 md:py-20">
                <div className="container mx-auto max-w-4xl">
                     <Skeleton className="h-10 w-48 mb-8" />
                     <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                     </div>
                     <div className="mt-8 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                </div>
            </section>
        </div>
    );
  }

  if (!resource && !isLoading) {
    notFound();
  }

  if (resource?.resourceType !== 'html') {
      return (
         <div className="container mx-auto py-20 text-center">
            <h1 className="text-2xl font-bold">Invalid Resource Type</h1>
            <p className="text-muted-foreground">This resource is not viewable content.</p>
             <Button asChild className="mt-8">
                <Link href="/resources"><ArrowLeft className="mr-2 h-4 w-4" />Back to Resources</Link>
            </Button>
         </div>
      )
  }

  return (
    <div className="w-full bg-secondary/30">
        <section className="py-12 md:py-20">
            <div className="container mx-auto max-w-4xl">
                 <Button variant="ghost" asChild className="mb-8">
                    <Link href="/resources"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-3xl">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: resource.htmlContent || '' }}
                        />
                    </CardContent>
                </Card>
            </div>
        </section>
    </div>
  );
}
