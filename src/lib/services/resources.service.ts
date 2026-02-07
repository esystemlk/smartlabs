import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

export interface ResourceItem {
    id: string;
    type: 'test' | 'video' | 'list';
    title: string;
    format: string;
    url: string;
    icon?: string;
    category: 'PTE' | 'IELTS' | 'CELPIP' | 'General';
    isActive: boolean;
    createdAt: any;
}

const COLLECTION_NAME = 'resources';

export const resourceService = {
    async getResources(): Promise<ResourceItem[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ResourceItem[];
        } catch (error) {
            console.error('Error fetching resources:', error);
            return [];
        }
    },

    async getResourcesByCategory(category: string): Promise<ResourceItem[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('category', '==', category),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ResourceItem[];
        } catch (error) {
            console.error('Error fetching resources by category:', error);
            return [];
        }
    },

    async addResource(resource: Omit<ResourceItem, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...resource,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding resource:', error);
            throw error;
        }
    },

    async updateResource(id: string, data: Partial<ResourceItem>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Error updating resource:', error);
            throw error;
        }
    }
};
