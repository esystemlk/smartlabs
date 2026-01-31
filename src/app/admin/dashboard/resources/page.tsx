
'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, Trash, Edit, ArrowLeft, Video, FileText, Upload, Loader2, Image as ImageIcon, Code, View } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// Schema for the form validation
const resourceFormSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  resourceType: z.enum(['html', 'video', 'document', 'image'], { required_error: 'Resource type is required' }),
  courseId: z.string({ required_error: 'Course is required' }),
  htmlContent: z.string().optional(),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

export default function ResourceManagementPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<any>(null);

  const resourcesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'resources') : null),
    [firestore]
  );
  const { data: resources, isLoading: resourcesLoading } = useCollection(resourcesQuery);
  
  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const { data: courses } = useCollection(coursesQuery);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
  });

  const resourceType = form.watch("resourceType");

  const handleDialogOpen = (resource: any = null) => {
    setSelectedResource(resource);
    setFileToUpload(null);
    if (resource) {
      form.reset(resource);
    } else {
      form.reset({ title: '', description: '', resourceType: undefined, courseId: undefined, htmlContent: '' });
    }
    setIsDialogOpen(true);
  };
  
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onSubmit = async (data: ResourceFormValues) => {
    if (!firestore) return;
    
    setIsUploading(true);
    let resourcePayload: any = { ...data };

    try {
        if (data.resourceType !== 'html') {
            if (!selectedResource && !fileToUpload) {
                toast({ variant: 'destructive', title: 'File Required', description: 'Please select a file to upload for this resource type.' });
                setIsUploading(false);
                return;
            }

            let fileUrl = selectedResource?.url;
            if (fileToUpload) {
                const fileDataUrl = await fileToBase64(fileToUpload);
                const fileBase64 = fileDataUrl.split(',')[1];
                const folder = data.resourceType === 'video' ? 'videos' : data.resourceType === 'image' ? 'images' : 'documents';

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileBase64, fileName: fileToUpload.name, folder }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'File upload failed');
                fileUrl = result.url;
            }
            resourcePayload.url = fileUrl;
            delete resourcePayload.htmlContent;
        } else {
            if (!data.htmlContent) {
                toast({ variant: 'destructive', title: 'Content Required', description: 'Please enter HTML content.' });
                setIsUploading(false);
                return;
            }
            resourcePayload.url = null;
        }

        if (selectedResource) {
            const resourceRef = doc(firestore, 'resources', selectedResource.id);
            await updateDoc(resourceRef, resourcePayload);
            toast({ title: 'Success', description: 'Resource updated successfully.' });
        } else {
            await addDoc(collection(firestore, 'resources'), resourcePayload);
            toast({ title: 'Success', description: 'Resource added successfully.' });
        }

        setIsDialogOpen(false);
        form.reset();
        setFileToUpload(null);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error saving resource:', error);
        toast({ variant: 'destructive', title: 'Error Saving Resource', description: errorMessage });
    } finally {
        setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !resourceToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'resources', resourceToDelete.id));
      toast({ title: 'Success', description: 'Resource deleted successfully.' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the resource.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setResourceToDelete(null);
    }
  };

  const getCourseName = (courseId: string) => {
    return courses?.find(c => c.id === courseId)?.name || 'N/A';
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'html': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto">
          <Button asChild variant="ghost" className="mb-4">
             <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resource Management</CardTitle>
                <CardDescription>Add, edit, or delete course materials.</CardDescription>
              </div>
              <Button onClick={() => handleDialogOpen()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </CardHeader>
            <CardContent>
              {resourcesLoading ? (
                <p>Loading resources...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources?.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell className="capitalize flex items-center gap-2">
                          {getIconForType(resource.resourceType)}
                          {resource.resourceType}
                        </TableCell>
                        <TableCell>{getCourseName(resource.courseId)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {
                                const isHtml = resource.resourceType === 'html';
                                const href = isHtml ? `/resources/${resource.id}` : resource.url;
                                if (href) {
                                    window.open(href, isHtml ? '_self' : '_blank', 'noopener,noreferrer');
                                } else {
                                    toast({
                                        variant: 'destructive',
                                        title: 'Not Viewable',
                                        description: 'This resource has no content or URL to view.',
                                    });
                                }
                              }}>
                                <View className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDialogOpen(resource)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setResourceToDelete(resource);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input placeholder="e.g., IELTS Writing Task 1 Guide" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="A short description of the resource." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="resourceType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resource Type</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="html">HTML Content</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="document">Document (PDF)</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                </SelectContent>
                             </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="courseId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Course</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {courses?.map(course => (
                                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                 </div>

                 {resourceType === 'html' ? (
                    <FormField control={form.control} name="htmlContent" render={({ field }) => (
                        <FormItem>
                          <FormLabel>HTML Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="<div>Your HTML code here...</div>" className="min-h-64 font-mono" {...field} />
                          </FormControl>
                           <FormDescription>Paste your full HTML and CSS code here.</FormDescription>
                          <FormMessage />
                        </FormItem>
                    )} />
                 ) : (
                    <FormItem>
                        <FormLabel>File Upload</FormLabel>
                        <FormControl>
                            <Input type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} />
                        </FormControl>
                        <FormDescription>
                        {fileToUpload ? `New file: ${fileToUpload.name}` : selectedResource?.url ? `Current file: ${selectedResource.url.split('/').pop()?.split('?')[0]}`: "Upload a file for this resource."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                 )}
                  
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {isUploading ? 'Saving...' : 'Save Resource'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the resource{' '}
                  <span className="font-bold">{resourceToDelete?.title}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResourceToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </section>
    </div>
  );
}
