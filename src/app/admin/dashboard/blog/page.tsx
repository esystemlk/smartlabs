'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, Trash, Edit, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const postSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(3, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens.'),
  content: z.string().min(10, 'Content is required'),
  excerpt: z.string().min(10, 'Excerpt is required'),
  image: z.string().url('Must be a valid URL'),
  authorId: z.string().default('Smart Labs Admin'),
  category: z.string().min(2, 'Category is required'),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function BlogManagementPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const postsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'blog_posts') : null),
    [firestore]
  );
  const { data: posts, isLoading } = useCollection(postsQuery);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
  });

  const handleDialogOpen = (post: any = null) => {
    setSelectedPost(post);
    if (post) {
      form.reset(post);
    } else {
      form.reset({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        image: '',
        authorId: 'Smart Labs Admin',
        category: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PostFormValues) => {
    if (!firestore) return;

    try {
      if (selectedPost) {
        // Update existing post
        const postRef = doc(firestore, 'blog_posts', selectedPost.id);
        await updateDoc(postRef, data);
        toast({ title: 'Success', description: 'Blog post updated successfully.' });
      } else {
        // Add new post with publishDate
        await addDoc(collection(firestore, 'blog_posts'), {
          ...data,
          publishDate: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Blog post created successfully.' });
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the blog post.' });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteDoc(doc(firestore, 'blog_posts', postId));
        toast({ title: 'Success', description: 'Blog post deleted successfully.' });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the blog post.' });
      }
    }
  };

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto">
          <Button asChild variant="ghost" className="mb-4">
             <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Blog Post Management</CardTitle>
                  <CardDescription>Create, edit, or delete blog posts.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Post
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading posts...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Published Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts?.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium max-w-sm truncate">{post.title}</TableCell>
                          <TableCell>{post.category}</TableCell>
                          <TableCell>{post.publishDate?.toDate().toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDialogOpen(post)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="excerpt" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (HTML)</FormLabel>
                        <FormControl><Textarea className="min-h-48" {...field} /></FormControl><FormMessage />
                      </FormItem>
                  )} />
                  
                  <DialogFooter className="mt-8">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Post'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
