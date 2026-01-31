
// Using a client component to handle form state and interactions
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { courseData } from '@/lib/constants';
import { Sparkles, Bot } from 'lucide-react';

export default function StudyPlanPage() {
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [course, setCourse] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedCourse = formData.get('course') as string;
    setCourse(selectedCourse);
    setIsPlanGenerated(true);
  };

  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Generate Your Personalized Study Plan</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered tool creates a custom study schedule based on your needs to help you prepare effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Tell Us About Yourself</CardTitle>
                <CardDescription>Fill in the details below to generate your plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="course">Select Course</Label>
                    <Select name="course" required>
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Choose your course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseData.map((course) => (
                          <SelectItem key={course.title} value={course.title}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-level">Current Skill Level</Label>
                    <Select name="skill-level" defaultValue="intermediate">
                      <SelectTrigger id="skill-level">
                        <SelectValue placeholder="Select your skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="study-time">Weekly Study Time (in hours)</Label>
                    <Input id="study-time" name="study-time" type="number" placeholder="e.g., 10" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="test-results">Diagnostic Test Results (Optional)</Label>
                    <Textarea id="test-results" name="test-results" placeholder="Paste your diagnostic test scores or comments here..." />
                    <p className="text-xs text-muted-foreground">Our AI will use this to further customize your plan.</p>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Plan
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div>
              {isPlanGenerated ? (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Bot className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="font-headline text-2xl">Your {course} Study Plan</CardTitle>
                        <CardDescription>A 4-week plan tailored for you.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible defaultValue="week-1">
                      <AccordionItem value="week-1">
                        <AccordionTrigger className="font-semibold">Week 1: Foundations</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>Focus on understanding the test format and question types.</li>
                            <li>Complete 2 Reading and 2 Listening practice tests.</li>
                            <li>Practice foundational grammar and vocabulary for 1 hour daily.</li>
                            <li>Write one practice essay for Writing Task 1 and one for Task 2.</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="week-2">
                        <AccordionTrigger className="font-semibold">Week 2: Skill Building</AccordionTrigger>
                        <AccordionContent>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Deep dive into Speaking section strategies.</li>
                                <li>Analyze sample high-scoring essays.</li>
                                <li>Complete timed practice sections for all modules.</li>
                            </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="week-3">
                        <AccordionTrigger className="font-semibold">Week 3: Timed Practice</AccordionTrigger>
                        <AccordionContent>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Take 2 full-length mock tests under exam conditions.</li>
                                <li>Review mistakes and focus on weak areas.</li>
                                <li>Practice advanced vocabulary and idiomatic expressions.</li>
                            </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="week-4">
                        <AccordionTrigger className="font-semibold">Week 4: Final Review</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                              <li>Take one final mock test.</li>
                              <li>Light review of all sections.</li>
                              <li>Focus on test-day strategies and time management.</li>
                              <li>Relax and ensure you are well-rested for the exam.</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg p-8 min-h-[300px] md:min-h-full">
                    <div className="text-center">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">Your study plan will appear here.</p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
