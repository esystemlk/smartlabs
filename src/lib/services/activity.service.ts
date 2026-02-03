import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface UserActivity {
    id?: string;
    userId: string;
    activityType: 'test' | 'lesson' | 'achievement' | 'enrollment' | 'login';
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    icon?: string;
}

/**
 * Log a user activity
 */
export async function logUserActivity(
    userId: string,
    activityType: UserActivity['activityType'],
    title: string,
    description: string,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        const activitiesRef = collection(db, 'users', userId, 'activities');
        await addDoc(activitiesRef, {
            activityType,
            title,
            description,
            timestamp: new Date(),
            metadata: metadata || {},
        });
    } catch (error) {
        console.error('Error logging user activity:', error);
    }
}

/**
 * Get user activities
 */
export async function getUserActivities(userId: string, limitCount: number = 10): Promise<UserActivity[]> {
    try {
        const activitiesRef = collection(db, 'users', userId, 'activities');
        const q = query(
            activitiesRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const activities: UserActivity[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                userId,
                activityType: data.activityType,
                title: data.title,
                description: data.description,
                timestamp: data.timestamp?.toDate() || new Date(),
                metadata: data.metadata,
                icon: getActivityIcon(data.activityType),
            });
        });

        return activities;
    } catch (error) {
        console.error('Error fetching user activities:', error);
        return [];
    }
}

/**
 * Get activity icon based on type
 */
function getActivityIcon(activityType: string): string {
    const iconMap: Record<string, string> = {
        test: 'FileCheck',
        lesson: 'BookOpen',
        achievement: 'Trophy',
        enrollment: 'UserPlus',
        login: 'LogIn',
    };
    return iconMap[activityType] || 'Activity';
}

/**
 * Log test completion
 */
export async function logTestCompletion(
    userId: string,
    testTitle: string,
    score: number,
    testType: string
): Promise<void> {
    await logUserActivity(
        userId,
        'test',
        testTitle,
        `Scored ${score} on ${testType}`,
        { score, testType }
    );
}

/**
 * Log lesson completion
 */
export async function logLessonCompletion(
    userId: string,
    lessonTitle: string,
    course: string
): Promise<void> {
    await logUserActivity(
        userId,
        'lesson',
        lessonTitle,
        `Completed lesson in ${course}`,
        { course }
    );
}

/**
 * Log achievement
 */
export async function logAchievement(
    userId: string,
    achievementTitle: string,
    description: string
): Promise<void> {
    await logUserActivity(
        userId,
        'achievement',
        achievementTitle,
        description
    );
}
