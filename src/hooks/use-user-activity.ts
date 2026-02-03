import { useState, useEffect } from 'react';
import { getUserActivities, type UserActivity } from '@/lib/services/activity.service';

export function useUserActivity(userId: string | undefined, limitCount: number = 10) {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setActivities([]);
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchActivities() {
            if (!userId) return;

            try {
                setLoading(true);
                const data = await getUserActivities(userId, limitCount);
                if (isMounted) {
                    setActivities(data);
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

        fetchActivities();

        return () => {
            isMounted = false;
        };
    }, [userId, limitCount]);

    return { activities, loading, error };
}
