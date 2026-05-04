'use client';
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockTestCourses = [
  {
    title: "PTE Academic Mock Test 1",
    description: "Full-length practice tests to simulate the real exam experience.",
    href: "/mock-tests/pte/test-1",
    status: "Available"
  },
  {
    title: "PTE Academic Mock Test 2",
    description: "A second full-length practice test to sharpen your skills.",
    href: "/mock-tests/pte/test-2",
    status: "Available"
  },
  {
    title: "CELPIP Mock Tests",
    description: "Prepare for your Canadian immigration journey with our practice tests.",
    href: "#",
    status: "Coming Soon"
  }
];

export default function MockTestsPage() {
  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Mock Tests</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Prepare for your exam with our full-length mock tests designed to simulate the real experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {mockTestCourses.map((course) => (
              <Card key={course.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   {course.status === 'Available' ? (
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /> 1 Full Test Available</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Approx. 30 mins</div>
                     </div>
                   ) : (
                     <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
                        <Badge variant="outline">Coming Soon</Badge>
                     </div>
                   )}
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full" disabled={course.status !== 'Available'}>
                        <Link href={course.href}>
                            {course.status === 'Available' ? 'Start Test' : 'Coming Soon'}
                            {course.status === 'Available' && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Link>
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
