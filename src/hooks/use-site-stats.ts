import { useState, useEffect } from 'react';
import { getSiteStats, type SiteStats } from '@/lib/services/stats.service';

export function useSiteStats() {
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchStats() {
            try {
                setLoading(true);
                const data = await getSiteStats();
                if (isMounted) {
                    setStats(data);
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

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, []);

    return { stats, loading, error };
}
