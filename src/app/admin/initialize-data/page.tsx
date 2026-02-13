'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeHomepageData } from '@/lib/init-homepage-data';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InitializeDataPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; error?: any } | null>(null);

    const handleInitialize = async () => {
        setLoading(true);
        setResult(null);

        try {
            const res = await initializeHomepageData();
            setResult(res);
        } catch (error) {
            setResult({ success: false, error });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Initialize Homepage Data</CardTitle>
                        <CardDescription>
                            This will populate Firebase with the homepage content (courses, learning methods, features, FAQs, comparisons).
                            <br /><br />
                            <strong className="text-destructive">Warning:</strong> Only run this once to initialize the data. Running it multiple times will create duplicate entries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleInitialize}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Initialize Data
                        </Button>

                        {result && (
                            <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2">
                                    {result.success ? (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <span className="font-bold text-green-900">Success!</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-red-600" />
                                            <span className="font-bold text-red-900">Error</span>
                                        </>
                                    )}
                                </div>
                                {result.error && (
                                    <pre className="mt-2 text-xs text-red-800 overflow-auto">
                                        {JSON.stringify(result.error, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                <li>Click "Initialize Data" to populate Firebase</li>
                                <li>Go to the homepage to see the data in action</li>
                                <li>Use the admin panel to manage the content going forward</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
