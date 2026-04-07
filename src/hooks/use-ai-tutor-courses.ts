import { useState, useEffect } from 'react';
import { aiTutorService, AiTutorCourse } from '@/lib/services/ai-tutor.service';

export function useAiTutorCourses() {
    const [courses, setCourses] = useState<AiTutorCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchCourses() {
            try {
                setLoading(true);
                const data = await aiTutorService.getTutorCourses();
                if (isMounted) {
                    setCourses(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to fetch AI Tutor courses');
                    console.error(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchCourses();

        return () => {
            isMounted = false;
        };
    }, []);

    return { courses, loading, error };
}
