import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface SiteStats {
    studentsCount: number;
    successRate: number;
    targetWeeks: string;
    reviewsCount: number;
    rating: number;
    aiSupport: string;
    lastUpdated: Date;
}

const STATS_DOC_ID = 'global_stats';

/**
 * Get current site statistics
 */
export async function getSiteStats(): Promise<SiteStats> {
    try {
        const statsRef = doc(db, 'site_stats', STATS_DOC_ID);
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            const data = statsSnap.data();
            return {
                studentsCount: data.studentsCount || 5000,
                successRate: data.successRate || 95,
                targetWeeks: data.targetWeeks || '6–8',
                reviewsCount: data.reviewsCount || 1200,
                rating: data.rating || 5.0,
                aiSupport: data.aiSupport || '24/7',
                lastUpdated: data.lastUpdated?.toDate() || new Date(),
            };
        }

        // Initialize with default values if doesn't exist
        const defaultStats: SiteStats = {
            studentsCount: 5000,
            successRate: 95,
            targetWeeks: '6–8',
            reviewsCount: 1200,
            rating: 5.0,
            aiSupport: '24/7',
            lastUpdated: new Date(),
        };

        await setDoc(statsRef, defaultStats);
        return defaultStats;
    } catch (error) {
        console.error('Error fetching site stats:', error);
        // Return defaults on error
        return {
            studentsCount: 5000,
            successRate: 95,
            targetWeeks: '6–8',
            reviewsCount: 1200,
            rating: 5.0,
            aiSupport: '24/7',
            lastUpdated: new Date(),
        };
    }
}

/**
 * Update site statistics
 */
export async function updateSiteStats(updates: Partial<SiteStats>): Promise<void> {
    try {
        const statsRef = doc(db, 'site_stats', STATS_DOC_ID);
        await updateDoc(statsRef, {
            ...updates,
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Error updating site stats:', error);
        throw error;
    }
}

/**
 * Increment student count (called when new user signs up)
 */
export async function incrementStudentCount(): Promise<void> {
    try {
        const statsRef = doc(db, 'site_stats', STATS_DOC_ID);
        await updateDoc(statsRef, {
            studentsCount: increment(1),
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Error incrementing student count:', error);
    }
}
