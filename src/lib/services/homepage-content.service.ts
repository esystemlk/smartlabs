import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

export interface Course {
    id: string;
    title: string;
    description: string;
    icon: string;
    href: string;
    color: string;
    iconColor: string;
    bgGradient: string;
    features: string[];
    isActive: boolean;
    order: number;
    createdAt: any;
}

export interface LearningMethod {
    id: string;
    icon: string;
    title: string;
    description: string;
    color: string;
    gradient: string;
    href?: string;
    isActive: boolean;
    order: number;
    createdAt: any;
}

export interface Feature {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    iconColor: string;
    isActive: boolean;
    order: number;
    createdAt: any;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    isActive: boolean;
    order: number;
    createdAt: any;
}

export interface Comparison {
    id: string;
    item: string;
    traditional: string;
    smartlabs: string;
    highlight: boolean;
    isActive: boolean;
    order: number;
    createdAt: any;
}

const COLLECTIONS = {
    COURSES: 'homepage_courses',
    LEARNING_METHODS: 'homepage_learning_methods',
    FEATURES: 'homepage_features',
    FAQS: 'homepage_faqs',
    COMPARISONS: 'homepage_comparisons'
};

export const homepageContentService = {
    // Courses
    async getCourses(): Promise<Course[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.COURSES),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Course[];
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    },

    async addCourse(course: Omit<Course, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
                ...course,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    },

    async updateCourse(id: string, data: Partial<Course>) {
        try {
            const docRef = doc(db, COLLECTIONS.COURSES, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    },

    async deleteCourse(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.COURSES, id));
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    },

    // Learning Methods
    async getLearningMethods(): Promise<LearningMethod[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.LEARNING_METHODS),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LearningMethod[];
        } catch (error) {
            console.error('Error fetching learning methods:', error);
            return [];
        }
    },

    async addLearningMethod(method: Omit<LearningMethod, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.LEARNING_METHODS), {
                ...method,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding learning method:', error);
            throw error;
        }
    },

    // Features
    async getFeatures(): Promise<Feature[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.FEATURES),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Feature[];
        } catch (error) {
            console.error('Error fetching features:', error);
            return [];
        }
    },

    async addFeature(feature: Omit<Feature, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.FEATURES), {
                ...feature,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding feature:', error);
            throw error;
        }
    },

    // FAQs
    async getFAQs(): Promise<FAQ[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.FAQS),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FAQ[];
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            return [];
        }
    },

    async addFAQ(faq: Omit<FAQ, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.FAQS), {
                ...faq,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding FAQ:', error);
            throw error;
        }
    },

    async updateFAQ(id: string, data: Partial<FAQ>) {
        try {
            const docRef = doc(db, COLLECTIONS.FAQS, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating FAQ:', error);
            throw error;
        }
    },

    async deleteFAQ(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.FAQS, id));
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            throw error;
        }
    },

    // Comparisons
    async getComparisons(): Promise<Comparison[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.COMPARISONS),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Comparison[];
        } catch (error) {
            console.error('Error fetching comparisons:', error);
            return [];
        }
    },

    async addComparison(comparison: Omit<Comparison, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.COMPARISONS), {
                ...comparison,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding comparison:', error);
            throw error;
        }
    },

    async updateComparison(id: string, data: Partial<Comparison>) {
        try {
            const docRef = doc(db, COLLECTIONS.COMPARISONS, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating comparison:', error);
            throw error;
        }
    },

    async deleteComparison(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.COMPARISONS, id));
        } catch (error) {
            console.error('Error deleting comparison:', error);
            throw error;
        }
    }
};
