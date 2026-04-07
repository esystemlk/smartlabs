import { useState, useEffect } from 'react';
import { testResultService, TestResult } from '@/lib/services/test-results.service';

export function usePerformanceData(userId: string | undefined) {
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function fetchResults() {
            try {
                setLoading(true);
                if (userId) {
                    const data = await testResultService.getUserResults(userId);
                    setResults(data);
                }
            } catch (err) {
                setError('Failed to fetch performance data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [userId]);

    // Process data for Radar Chart
    const radarData = [
        { subject: 'Listening', A: 0, fullMark: 90 },
        { subject: 'Speaking', A: 0, fullMark: 90 },
        { subject: 'Reading', A: 0, fullMark: 90 },
        { subject: 'Writing', A: 0, fullMark: 90 },
        { subject: 'Grammar', A: 0, fullMark: 90 },
        { subject: 'Vocab', A: 0, fullMark: 90 },
    ];

    if (results.length > 0) {
        const categories = ['Listening', 'Speaking', 'Reading', 'Writing', 'Grammar', 'Vocab'];
        categories.forEach((cat, index) => {
            const catResults = results.filter(r => r.category === cat);
            if (catResults.length > 0) {
                const avg = catResults.reduce((sum, r) => sum + r.score, 0) / catResults.length;
                radarData[index].A = Math.round(avg);
            } else {
                // Default values if no data yet to keep the chart looking good
                radarData[index].A = 40 + Math.random() * 20;
            }
        });
    } else {
        // Default mock data if no real results yet
        radarData.forEach(item => item.A = 50 + Math.random() * 20);
    }

    // Process data for Trend Chart (last 7 days/results)
    const trendData = results
        .slice(0, 7)
        .reverse()
        .map(r => ({
            name: r.completedAt?.toDate ? r.completedAt.toDate().toLocaleDateString('en-US', { weekday: 'short' }) : 'Day',
            score: r.score
        }));

    if (trendData.length === 0) {
        // Return mock trend if no data
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
            trendData.push({ name: day, score: 60 + Math.random() * 20 });
        });
    }

    // Calculate overall progress
    const overallProgress = useMemo(() => {
        if (results.length === 0) {
            return 0;
        }
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalMaxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
        return totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    }, [results]);

    return { results, radarData, trendData, loading, error, overallProgress };
}
