
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, MoreHorizontal, PlusCircle, Trash, Edit, ArrowLeft, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const courseSchema = z.object({
  name: z.string().min(3, 'Course name is required'),
  description: z.string().min(10, 'Description is required'),
  duration: z.string().min(1, 'Duration is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  syllabus: z.string().optional(),
  targetAudience: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const batchSchema = z.object({
    name: z.string().min(3, 'Batch name is required'),
    schedule: z.string().optional(),
    teacherId: z.string().optional(),
});

type BatchFormValues = z.infer<typeof batchSchema>;

export default function CourseManagementPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  // State for Course Dialog
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // State for Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'course' | 'batch' | null>(null);

  // State for Batch Dialog
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [courseForBatches, setCourseForBatches] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  
  const batchesQuery = useMemoFirebase(
    () => (firestore && courseForBatches ? collection(firestore, `courses/${courseForBatches.id}/batches`) : null),
    [firestore, courseForBatches]
  );
  const { data: batches, isLoading: batchesLoading } = useCollection(batchesQuery);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
  });

  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
  });

  // Course Dialog Handlers
  const handleCourseDialogOpen = (course: any = null) => {
    setSelectedCourse(course);
    if (course) {
      courseForm.reset(course);
    } else {
      courseForm.reset({ name: '', description: '', duration: '', price: 0, syllabus: '', targetAudience: '' });
    }
    setIsCourseDialogOpen(true);
  };

  const onCourseSubmit = async (data: CourseFormValues) => {
    if (!firestore) return;
    try {
      if (selectedCourse) {
        await updateDoc(doc(firestore, 'courses', selectedCourse.id), data);
        toast({ title: 'Success', description: 'Course updated successfully.' });
      } else {
        await addDoc(collection(firestore, 'courses'), data);
        toast({ title: 'Success', description: 'Course added successfully.' });
      }
      setIsCourseDialogOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the course.' });
    }
  };

  // Batch Dialog Handlers
  const handleBatchDialogOpen = (course: any) => {
      setCourseForBatches(course);
      setSelectedBatch(null);
      batchForm.reset({ name: '', schedule: '', teacherId: '' });
      setIsBatchDialogOpen(true);
  }

  const handleEditBatch = (batch: any) => {
      setSelectedBatch(batch);
      batchForm.reset(batch);
  }

  const onBatchSubmit = async (data: BatchFormValues) => {
      if (!firestore || !courseForBatches) return;
      const batchData = { ...data, courseId: courseForBatches.id };
      try {
          if (selectedBatch) {
              await updateDoc(doc(firestore, `courses/${courseForBatches.id}/batches`, selectedBatch.id), batchData);
              toast({ title: 'Success', description: 'Batch updated.' });
          } else {
              await addDoc(collection(firestore, `courses/${courseForBatches.id}/batches`), batchData);
              toast({ title: 'Success', description: 'Batch added.' });
          }
          setSelectedBatch(null);
          batchForm.reset({ name: '', schedule: '', teacherId: '' });
      } catch (error) {
          console.error('Error saving batch:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not save batch.' });
      }
  }

  // Delete Handler
  const handleDeleteRequest = (item: any, type: 'course' | 'batch') => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete || !deleteType) return;
    let itemRef;
    if (deleteType === 'course') {
        itemRef = doc(firestore, 'courses', itemToDelete.id);
    } else { // batch
        itemRef = doc(firestore, `courses/${courseForBatches.id}/batches`, itemToDelete.id);
    }

    try {
      await deleteDoc(itemRef);
      toast({ title: 'Success', description: `${deleteType} deleted successfully.` });
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not delete the ${deleteType}.` });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
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
                <CardTitle>Course Management</CardTitle>
                <CardDescription>Add, edit, or remove courses and their batches from the platform.</CardDescription>
              </div>
              <Button onClick={() => handleCourseDialogOpen()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Course
              </Button>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <p>Loading courses...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Price (LKR)</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses?.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium max-w-sm truncate">{course.name}</TableCell>
                        <TableCell> {course.price?.toLocaleString()}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleBatchDialogOpen(course)}>
                                <Users className="mr-2 h-4 w-4" /> Manage Batches
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleCourseDialogOpen(course)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Course
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteRequest(course, 'course')}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete Course
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
              </DialogHeader>
              <Form {...courseForm}>
                <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
                  <FormField control={courseForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input placeholder="e.g., IELTS Academic" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={courseForm.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>Price (LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 25000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={courseForm.control} name="duration" render={({ field }) => (
                      <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 6 Weeks" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={courseForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief summary of the course." {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={courseForm.control} name="syllabus" render={({ field }) => (
                      <FormItem><FormLabel>Syllabus</FormLabel><FormControl><Textarea placeholder="List syllabus topics, separated by commas." {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                   <FormField control={courseForm.control} name="targetAudience" render={({ field }) => (
                      <FormItem><FormLabel>Target Audience</FormLabel><FormControl><Input placeholder="e.g., Students and professionals" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <DialogFooter className="mt-4">
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={courseForm.formState.isSubmitting}>
                      {courseForm.formState.isSubmitting ? 'Saving...' : 'Save Course'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Manage Batches for: {courseForBatches?.name}</DialogTitle>
                  <DialogDescription>Add, edit, or remove batches for this course.</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto p-1">
                <div>
                  <h3 className="font-semibold mb-4">Existing Batches</h3>
                  {batchesLoading ? <p>Loading...</p> : (
                    <div className="space-y-2">
                        {batches?.map(batch => (
                            <div key={batch.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                                <div>
                                    <p className="font-medium">{batch.name}</p>
                                    <p className="text-xs text-muted-foreground">{batch.schedule}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEditBatch(batch)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(batch, 'batch')}>Delete</Button>
                                </div>
                            </div>
                        ))}
                         {batches?.length === 0 && <p className="text-sm text-muted-foreground">No batches found.</p>}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-4">{selectedBatch ? 'Edit Batch' : 'Add New Batch'}</h3>
                   <Form {...batchForm}>
                    <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-4">
                        <FormField control={batchForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Batch Name</FormLabel><FormControl><Input placeholder="e.g., Weekend Batch" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={batchForm.control} name="schedule" render={({ field }) => (
                            <FormItem><FormLabel>Schedule</FormLabel><FormControl><Input placeholder="e.g., Sat & Sun, 10am - 12pm" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex justify-end gap-2 mt-4">
                            {selectedBatch && <Button type="button" variant="ghost" onClick={() => { setSelectedBatch(null); batchForm.reset(); }}>Cancel Edit</Button>}
                            <Button type="submit">{selectedBatch ? 'Update Batch' : 'Add Batch'}</Button>
                        </div>
                    </form>
                  </Form>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the {deleteType}{' '}
                  <span className="font-bold">{itemToDelete?.name}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}

    