

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListVideo, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RecordingsPage() {
  return (
    <div className="space-y-4">
        <Button asChild variant="ghost">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
            <ListVideo className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Class Recordings</CardTitle>
                <CardDescription>This page will contain recordings of your classes.</CardDescription>
            </div>
            </div>
        </CardHeader>
        </Card>
    </div>
  );
}
