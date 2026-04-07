import { useState, useEffect } from 'react';
import { aiTutorService, AiTutorGuide } from '@/lib/services/ai-tutor.service';

export function useAiTutorGuides(courseId: string) {
    const [guides, setGuides] = useState<AiTutorGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchGuides() {
            try {
                setLoading(true);
                const data = await aiTutorService.getCourseGuides(courseId);
                if (isMounted) {
                    setGuides(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(`Failed to fetch AI Tutor guides for course ${courseId}`);
                    console.error(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchGuides();

        return () => {
            isMounted = false;
        };
    }, [courseId]);

    return { guides, loading, error };
}
