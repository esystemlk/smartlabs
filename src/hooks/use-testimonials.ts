import { useState, useEffect } from 'react';
import { getActiveTestimonials, type Testimonial } from '@/lib/services/testimonials.service';

export function useTestimonials(limitCount: number = 10) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchTestimonials() {
            try {
                setLoading(true);
                const data = await getActiveTestimonials(limitCount);
                if (isMounted) {
                    setTestimonials(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchTestimonials();

        return () => {
            isMounted = false;
        };
    }, [limitCount]);

    return { testimonials, loading, error };
}
