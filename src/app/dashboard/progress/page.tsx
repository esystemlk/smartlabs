

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProgressPage() {
  return (
    <div className="space-y-4">
        <Button asChild variant="ghost">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Progress & Feedback</CardTitle>
                <CardDescription>This page will show your progress and feedback on assignments.</CardDescription>
            </div>
            </div>
        </CardHeader>
        </Card>
    </div>
  );
}
