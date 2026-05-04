
'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, MoreHorizontal, PlusCircle, Trash, Edit, ArrowLeft, Users, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const courseSchema = z.object({
  name: z.string().min(3, 'Course name is required'),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  themeColor: z.string().optional().default('blue'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  duration: z.string().optional(),
  days: z.string().optional(),
  startTime: z.string().optional(),
  bonusTitle: z.string().optional(),
  bonusSubtitle: z.string().optional(),
  features: z.string().optional(),
  payhereButtonId: z.string().optional(),
  status: z.enum(['active', 'disabled']).optional().default('active'),
  courseType: z.enum(['pte', 'ielts', 'other']).optional().default('pte'),
  description: z.string().optional(), // kept for legacy
});

type CourseFormValues = z.infer<typeof courseSchema>;

const batchSchema = z.object({
  name: z.string().min(3, 'Batch name is required'),
  schedule: z.string().optional(),
  teacherId: z.string().optional(),
  timetableImageUrl: z.string().optional(),
  timetableDetails: z.string().optional(),
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
  const [isUploading, setIsUploading] = useState(false);

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
    defaultValues: {
      name: '',
      subtitle: '',
      badgeText: '',
      themeColor: 'blue',
      price: 0,
      duration: '',
      days: '',
      startTime: '',
      bonusTitle: '',
      bonusSubtitle: '',
      features: '',
      payhereButtonId: '',
      status: 'active',
      courseType: 'pte',
      description: ''
    }
  });

  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: '',
      schedule: '',
      teacherId: '',
      timetableImageUrl: '',
      timetableDetails: ''
    }
  });

  // Course Dialog Handlers
  const handleCourseDialogOpen = (course: any = null) => {
    setSelectedCourse(course);
    if (course) {
      courseForm.reset(course);
    } else {
      courseForm.reset({
        name: '',
        subtitle: '',
        badgeText: '',
        themeColor: 'blue',
        price: 0,
        duration: '',
        days: '',
        startTime: '',
        bonusTitle: '',
        bonusSubtitle: '',
        features: '',
        payhereButtonId: '',
        status: 'active',
        courseType: 'pte',
        description: ''
      });
    }
    setIsCourseDialogOpen(true);
  };

  const onCourseSubmit = async (data: CourseFormValues) => {
    if (!firestore) return;
    try {
      const sanitize = (obj: any) =>
        Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === undefined ? '' : v]));
      const payload = sanitize(data);
      if (selectedCourse) {
        await updateDoc(doc(firestore, 'courses', selectedCourse.id), payload);
        toast({ title: 'Success', description: 'Course updated successfully.' });
      } else {
        await addDoc(collection(firestore, 'courses'), payload);
        toast({ title: 'Success', description: 'Course added successfully.' });
      }
      setIsCourseDialogOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the course.' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { storage } = useFirebase();
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `batches/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      batchForm.setValue('timetableImageUrl', downloadURL);
      toast({
        title: "Image Uploaded",
        description: "Timetable image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Batch Dialog Handlers
  const handleBatchDialogOpen = (course: any) => {
    setCourseForBatches(course);
    setSelectedBatch(null);
    batchForm.reset({ name: '', schedule: '', teacherId: '', timetableImageUrl: '', timetableDetails: '' });
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
      batchForm.reset({ name: '', schedule: '', teacherId: '', timetableImageUrl: '', timetableDetails: '' });
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => {
                  if (!firestore) return;
                  const seed = [
                    { id: 'pte-boostify', name: 'PTE Boostify Package', subtitle: 'Exam-focused strategies with AI practice', themeColor: 'accent-3', price: 30000, duration: '13 Days | 20 Hours', days: 'Monday – Friday', startTime: '2.30 PM – 4.30 PM', features: 'All live class recordings, Exam focused strategies, Smart practice methods, Individual feedback for difficult questions, 8.00 PM batch available, Next Intake: 16 March (8.00 PM), 23 March (2.30 PM)', status: 'active', courseType: 'pte' },
                    { id: 'pte-boostify-grammar', name: 'PTE Boostify + Grammar Clinic Program', subtitle: 'Full strategy + grammar foundation', themeColor: 'primary', price: 35000, duration: '21 Days | 42 Hours', days: 'Monday – Friday', startTime: '2.30 PM – 4.30 PM', features: 'All live class recordings available, Grammar Clinic: Saturday & Sunday, Grammar Clinic Time: 4.00 PM – 6.00 PM, Grammar Clinic Duration: 1 Month', status: 'active', courseType: 'pte' },
                    { id: 'pte-hybrid', name: 'PTE Hybrid (Online + Physical)', subtitle: 'Zoom + Rajagiriya campus weekend', themeColor: 'accent-2', price: 50000, duration: 'Online 20 Hours + Physical 16 Hours/month', days: 'Online: Mon–Fri | Physical: Sat & Sun', startTime: 'Online: 8.00–10.00 PM or 2.30–4.30 PM', features: 'Online via Zoom, Grammar Clinic: Sat & Sun 4.00 – 6.00 PM (1 Month), Physical: Sat & Sun 8.30 – 10.30 AM, Starting Date: 14th March, Location: Rajagiriya – Janajaya Building', status: 'active', courseType: 'pte' },
                    { id: 'pte-physical', name: 'PTE Physical Classes', subtitle: 'Face-to-face coaching at Rajagiriya', themeColor: 'accent', price: 40000, duration: '16 Hours per month', days: 'Saturday & Sunday', startTime: '8.30 AM – 10.30 AM', features: 'Location: Rajagiriya – Janajaya Building, Bonus: Complimentary Grammar Online Sessions', status: 'active', courseType: 'pte' },
                    { id: 'pte-recorded', name: 'PTE Recorded Sessions Program', subtitle: 'Self-Paced Learning Program', themeColor: 'orange', price: 0, duration: 'Flexible', days: 'Self-paced', startTime: '', features: 'Access to latest live class recordings, Class materials, Extra practice materials, Flexible learning schedule, Note: Live classes provide direct lecturer feedback, Note: Recorded program is fully self-study based', status: 'active', courseType: 'pte' },
                  ];
                  try {
                    for (const pkg of seed) {
                      await setDoc(doc(firestore, 'courses', pkg.id), pkg);
                    }
                    toast({ title: 'Seed Complete', description: 'Default packages have been added to Firestore.' });
                  } catch (e) {
                    console.error('Seeding error', e);
                    toast({ variant: 'destructive', title: 'Seed Failed', description: 'Could not seed default packages.' });
                  }
                }}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Seed Packages
                </Button>
                <Button onClick={() => handleCourseDialogOpen()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Course
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <p>Loading courses...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses?.map((course) => {
                    let themeBg = "bg-primary text-white";
                    if (course.themeColor === "blue") themeBg = "bg-blue-600 text-white";
                    if (course.themeColor === "orange") themeBg = "bg-orange-500 text-white";
                    if (course.themeColor === "accent") themeBg = "bg-accent text-white";
                    if (course.themeColor === "accent-2") themeBg = "bg-accent-2 text-primary-foreground";
                    if (course.themeColor === "accent-3") themeBg = "bg-accent-3 text-white";

                    return (
                      <Card key={course.id} className="relative flex flex-col overflow-hidden shadow-lg border-none hover:shadow-xl transition-all">
                        <div className={`p-6 ${themeBg} flex flex-col`}>
                          <div className="flex justify-between items-start mb-4">
                            {course.badgeText ? (
                              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none uppercase text-[10px] tracking-widest">{course.badgeText}</Badge>
                            ) : (
                              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none uppercase text-[10px] tracking-widest invisible">BADGE</Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                          <h3 className="text-2xl font-black font-headline tracking-tight">{course.name}</h3>
                          {course.subtitle && <p className="text-white/80 text-sm mt-1 italic font-medium">{course.subtitle}</p>}

                          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                            <span className="text-xl font-black">LKR {course.price?.toLocaleString()}</span>
                            {course.status === 'active' ? (
                              <Badge variant="secondary" className="bg-green-500/20 text-white border-none text-[10px] uppercase"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-500/20 text-white border-none text-[10px] uppercase"><XCircle className="w-3 h-3 mr-1" /> Hidden</Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="flex-grow p-6 bg-card space-y-4">
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Duration</p>
                              <p className="font-semibold">{course.duration || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Days</p>
                              <p className="font-semibold">{course.days || 'N/A'}</p>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Payment Link</p>
                              <p className="font-mono text-xs bg-muted p-1 rounded inline-block truncate max-w-[150px]" title={course.payhereButtonId || 'Not Configured'}>
                                {course.payhereButtonId ? 'Configured' : 'Not Configured'}
                              </p>
                            </div>
                          </div>

                          <Button variant="outline" className="w-full mt-4" onClick={() => handleBatchDialogOpen(course)}>
                            <Users className="mr-2 h-4 w-4" /> Manage Intakes / Batches
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={courseForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input placeholder="e.g., PTE Boostify" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={courseForm.control} name="subtitle" render={({ field }) => (
                      <FormItem><FormLabel>Subtitle (Italic)</FormLabel><FormControl><Input placeholder="e.g., Essential for high scores" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={courseForm.control} name="badgeText" render={({ field }) => (
                      <FormItem><FormLabel>Badge Text</FormLabel><FormControl><Input placeholder="e.g., Most Recommended" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={courseForm.control} name="themeColor" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme Color</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="blue">Blue (Primary default)</SelectItem>
                            <SelectItem value="orange">Orange (Secondary)</SelectItem>
                            <SelectItem value="primary">Dark Blue (Logo Primary)</SelectItem>
                            <SelectItem value="accent">Purple (Accent 1)</SelectItem>
                            <SelectItem value="accent-2">Light Purple (Accent 2)</SelectItem>
                            <SelectItem value="accent-3">Pink/Magenta (Accent 3)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={courseForm.control} name="courseType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="pte">PTE Course</SelectItem>
                            <SelectItem value="ielts">IELTS Course</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={courseForm.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active (Visible)</SelectItem>
                            <SelectItem value="disabled">Disabled (Hidden)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={courseForm.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>Price (LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 35000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={courseForm.control} name="payhereButtonId" render={({ field }) => (
                      <FormItem><FormLabel>Full PayHere Payment Link</FormLabel><FormControl><Input placeholder="e.g., https://www.payhere.lk/pay/o12bac2e6" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={courseForm.control} name="duration" render={({ field }) => (
                      <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 21 Days | 42 Hours" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={courseForm.control} name="days" render={({ field }) => (
                      <FormItem><FormLabel>Days</FormLabel><FormControl><Input placeholder="e.g., Monday - Friday" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={courseForm.control} name="startTime" render={({ field }) => (
                      <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input placeholder="e.g., 2:30 PM - 4:30 PM SLT" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={courseForm.control} name="features" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Features (Comma separated list)</FormLabel><FormControl><Textarea placeholder="Full live recordings, Writing templates, Speaking feedback..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={courseForm.control} name="bonusTitle" render={({ field }) => (
                      <FormItem><FormLabel>Bonus Feature Title</FormLabel><FormControl><Input placeholder="e.g., Grammar Clinic Included" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={courseForm.control} name="bonusSubtitle" render={({ field }) => (
                      <FormItem><FormLabel>Bonus Feature Subtitle</FormLabel><FormControl><Input placeholder="e.g., Sat & Sun for one full month" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
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
                      <FormField control={batchForm.control} name="timetableImageUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timetable Image</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="Upload or enter URL" {...field} />
                            </FormControl>
                            <div className="relative">
                              <input
                                type="file"
                                id="timetable-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                asChild
                                disabled={isUploading}
                              >
                                <label htmlFor="timetable-upload" className="cursor-pointer flex items-center gap-2">
                                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                  Upload
                                </label>
                              </Button>
                            </div>
                          </div>
                          {field.value && (
                            <div className="mt-2 relative w-full aspect-video rounded-lg overflow-hidden border">
                              <img src={field.value} alt="Timetable Preview" className="object-contain w-full h-full" />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={batchForm.control} name="timetableDetails" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Timetable Details</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter any extra details about this batch's timetable..." className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex justify-end gap-2 mt-4">
                        {selectedBatch && <Button type="button" variant="ghost" onClick={() => { setSelectedBatch(null); batchForm.reset({ name: '', schedule: '', teacherId: '', timetableImageUrl: '', timetableDetails: '' }); }}>Cancel Edit</Button>}
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

