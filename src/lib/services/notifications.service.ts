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
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isActive: boolean;
    createdAt: any;
    expiresAt?: any;
}

const COLLECTION_NAME = 'notifications';

export const notificationService = {
    async getActiveNotifications(): Promise<Notification[]> {
        try {
            const now = new Date();
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const notifications: Notification[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Manual filter for expiry since Firestore doesn't support multiple inequalities easily with orderBy
                if (!data.expiresAt || data.expiresAt.toDate() > now) {
                    notifications.push({ id: doc.id, ...data } as Notification);
                }
            });

            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...notification,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    async toggleNotificationStatus(id: string, isActive: boolean) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { isActive });
        } catch (error) {
            console.error('Error updating notification status:', error);
            throw error;
        }
    }
};
