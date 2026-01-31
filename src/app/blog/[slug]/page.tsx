
'use client';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { firestore } = useFirebase();

  const postQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'blog_posts'), where('slug', '==', params.slug))
        : null,
    [firestore, params.slug]
  );
  
  const { data: posts, isLoading } = useCollection(postQuery);
  const post = posts?.[0];

  if (isLoading) {
    return (
        <div className="w-full">
            <section className="py-12 md:py-20">
                <div className="container mx-auto">
                    <div className="max-w-3xl mx-auto">
                        <Skeleton className="h-10 w-40 mb-8" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-10 w-1/2" />
                        </div>
                        <Skeleton className="w-full aspect-video my-8" />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
  }

  if (!post && !isLoading) {
    notFound();
  }

  return (
    <div className="w-full bg-secondary/30">
        <section className="py-12 md:py-20">
            <div className="container mx-auto">
                <div className="max-w-3xl mx-auto glass-card rounded-2xl p-6 sm:p-8 lg:p-12">
                    <Button variant="ghost" asChild className="mb-4 md:mb-8 -ml-4">
                        <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
                    </Button>
                    
                    {post && (
                    <article>
                        <header className="space-y-4">
                            <Badge variant="secondary" className="w-fit">{post.category}</Badge>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">{post.title}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://picsum.photos/100/100?random=${post.authorId}`} alt={post.authorId} />
                                        <AvatarFallback>{post.authorId?.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                    <span>{post.authorId || 'Smart Labs Admin'}</span>
                                </div>
                                <span className="hidden sm:inline">&bull;</span>
                                <time dateTime={post.publishDate?.toDate().toISOString()}>
                                    {post.publishDate?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </time>
                            </div>
                        </header>

                        <div className="relative w-full aspect-video my-6 md:my-8 rounded-xl overflow-hidden shadow-lg">
                            <Image
                                src={post.image}
                                alt={post.title}
                                data-ai-hint="blog post image"
                                fill
                                className="object-cover"
                            />
                        </div>
                        
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none prose-h2:font-display prose-p:text-muted-foreground prose-a:text-primary"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </article>
                    )}
                </div>
            </div>
        </section>
    </div>
  );
}
