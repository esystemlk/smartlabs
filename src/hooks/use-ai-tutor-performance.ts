import { useState, useEffect, useCallback } from 'react';
import { aiTutorService, UserPerformanceData } from '@/lib/services/ai-tutor.service';
import { useUser } from '@/firebase';

const initialPerformanceData: UserPerformanceData = {
    speaking: 65,
    writing: 70,
    listening: 60,
    reading: 75,
    grammar: 75,
    volatility: [45, 67, 43, 89, 56, 78, 92, 45, 66, 88]
};

export function useAiTutorPerformance(courseId: string) {
    const { user } = useUser();
    const [performanceData, setPerformanceData] = useState<UserPerformanceData>(initialPerformanceData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid || !courseId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchPerformance() {
            try {
                setLoading(true);
                const data = await aiTutorService.getUserPerformance(user!.uid, courseId);
                if (isMounted) {
                    setPerformanceData(data || initialPerformanceData);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(`Failed to fetch AI Tutor performance for course ${courseId}`);
                    console.error(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchPerformance();

        return () => {
            isMounted = false;
        };
    }, [user?.uid, courseId]);

    const savePerformance = useCallback(async (data: UserPerformanceData) => {
        if (!user?.uid || !courseId) {
            console.warn("Cannot save performance: user not logged in or courseId missing.");
            return;
        }
        try {
            await aiTutorService.saveUserPerformance(user.uid, courseId, data);
            setPerformanceData(data); // Update local state after successful save
        } catch (err) {
            setError(`Failed to save AI Tutor performance for course ${courseId}`);
            console.error(err);
        }
    }, [user?.uid, courseId]);

    return { performanceData, setPerformanceData, loading, error, savePerformance };
}
