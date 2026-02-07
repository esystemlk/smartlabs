import { useState, useEffect } from 'react';
import { notificationService, Notification } from '@/lib/services/notifications.service';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                setLoading(true);
                const data = await notificationService.getActiveNotifications();
                setNotifications(data);
            } catch (err) {
                setError('Failed to fetch notifications');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, []);

    return { notifications, loading, error };
}
