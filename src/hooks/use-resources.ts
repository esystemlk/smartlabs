import { useState, useEffect } from 'react';
import { resourceService, ResourceItem } from '@/lib/services/resources.service';

export function useResources(category?: string) {
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchResources() {
            try {
                setLoading(true);
                const data = category
                    ? await resourceService.getResourcesByCategory(category)
                    : await resourceService.getResources();
                setResources(data);
            } catch (err) {
                setError('Failed to fetch resources');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchResources();
    }, [category]);

    return { resources, loading, error };
}
