import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';

export interface AiTutorCourse {
    id: string;
    name: string;
    tutor: string;
    specialization: string;
    students: string;
    rating: string;
    color: string;
    bg: string;
    border: string;
    description: string;
    stats: {
        pass: string;
        speed: string;
    };
    isActive: boolean;
    order: number;
    createdAt: any;
}

export interface AiTutorGuide {
    step: number;
    title: string;
    content: string;
}

export interface UserPerformanceData {
    speaking: number;
    writing: number;
    listening: number;
    reading: number;
    grammar: number;
    volatility: number[];
}

const COLLECTION_NAME = 'ai_tutor_courses';
const USER_PERFORMANCE_COLLECTION = 'user_ai_tutor_performance';

export const aiTutorService = {
    async getTutorCourses(): Promise<AiTutorCourse[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AiTutorCourse[];
        } catch (error) {
            console.error('Error fetching AI Tutor courses:', error);
            return [];
        }
    },

    async getCourseGuides(courseId: string): Promise<AiTutorGuide[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME, courseId, 'guides'),
                orderBy('step', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AiTutorGuide[];
        } catch (error) {
            console.error(`Error fetching guides for course ${courseId}:`, error);
            return [];
        }
    },

    async getUserPerformance(userId: string, courseId: string): Promise<UserPerformanceData | null> {
        try {
            const docRef = doc(db, USER_PERFORMANCE_COLLECTION, `${userId}_${courseId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as UserPerformanceData;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching user performance for ${userId} and ${courseId}:`, error);
            return null;
        }
    },

    async saveUserPerformance(userId: string, courseId: string, data: UserPerformanceData): Promise<void> {
        try {
            const docRef = doc(db, USER_PERFORMANCE_COLLECTION, `${userId}_${courseId}`);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error(`Error saving user performance for ${userId} and ${courseId}:`, error);
            throw error;
        }
    },

    async addTutorCourse(course: Omit<AiTutorCourse, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...course,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding AI Tutor course:', error);
            throw error;
        }
    },

    async updateTutorCourse(id: string, data: Partial<AiTutorCourse>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating AI Tutor course:', error);
            throw error;
        }
    },

    async deleteTutorCourse(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error('Error deleting AI Tutor course:', error);
            throw error;
        }
    },
};
