'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedAllQuestions, type AllSeedResult } from '@/lib/seed-pte-questions';
import { Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function SeedQuestionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AllSeedResult | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      setResult(await seedAllQuestions());
    } catch (error) {
      setResult({ success: false, perType: {}, total: 0, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const entries = result ? Object.entries(result.perType).sort() : [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Seed PTE Questions to Database</CardTitle>
                <CardDescription className="mt-1">
                  Feeds <strong>every hardcoded PTE question bank</strong> (all speaking, writing,
                  reading and listening task types, including the predicted essay questions) into the
                  <code> pte_questions</code> collection so they can be managed from the admin panel.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p><strong>Safe to run more than once.</strong> Each question uses a fixed document id,
              so re-running <em>updates</em> the existing records instead of creating duplicates.</p>
              <p className="mt-2">Interactive questions (MCQ, reorder, fill-in-blanks, highlight, …)
              are stored with their full options/answers, so nothing is lost.</p>
              <p className="mt-2">You must be signed in as an <strong>admin/staff</strong> account
              (Firestore rules restrict writes to staff).</p>
            </div>

            <Button onClick={handleSeed} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Seeding all question types…' : 'Seed all question types'}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-900">
                        Done — {result.total} questions written across {entries.length} task types.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-bold text-red-900">Failed</span>
                    </>
                  )}
                </div>
                {result.error && (
                  <pre className="mt-2 text-xs text-red-800 overflow-auto whitespace-pre-wrap">{result.error}</pre>
                )}
                {result.success && result.failed > 0 && (
                  <p className="mt-2 text-xs text-amber-800">
                    {result.failed} item(s) skipped (e.g. oversized). First error: {result.firstError}
                  </p>
                )}
                {result.success && entries.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-900">
                    {entries.map(([type, n]) => (
                      <div key={type} className="flex justify-between border-b border-green-200/60 py-0.5">
                        <span className="font-mono">{type}</span>
                        <span className="font-bold">{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">Next steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click <strong>Seed all question types</strong> (once).</li>
                <li>Confirm the counts look right and questions show in the app / admin.</li>
                <li>Tell me it worked, and I&apos;ll switch the website practice pages to read from
                the database and remove the hardcoded data files.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
