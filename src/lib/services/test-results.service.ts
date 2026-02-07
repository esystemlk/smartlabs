import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';

export interface TestResult {
    id?: string;
    userId: string;
    testId: string;
    testType: string; // e.g., 'PTE Academic', 'IELTS'
    category: string; // e.g., 'Reading', 'Writing', 'Speaking', 'Listening'
    score: number;
    maxScore: number;
    breakdown?: Record<string, number>;
    completedAt: any;
    timeSpent?: number; // in seconds
}

const COLLECTION_NAME = 'test_results';

export const testResultService = {
    async saveTestResult(result: Omit<TestResult, 'completedAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...result,
                completedAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving test result:', error);
            throw error;
        }
    },

    async getUserResults(userId: string, testType?: string): Promise<TestResult[]> {
        try {
            let q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('completedAt', 'desc')
            );

            if (testType) {
                q = query(q, where('testType', '==', testType));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TestResult[];
        } catch (error) {
            console.error('Error fetching user results:', error);
            return [];
        }
    },

    async getLatestResults(userId: string, limitCount: number = 20): Promise<TestResult[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('completedAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TestResult[];
        } catch (error) {
            console.error('Error fetching latest results:', error);
            return [];
        }
    }
};
