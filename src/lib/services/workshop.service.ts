'use client';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    Firestore,
    addDoc,
} from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────

export interface Workshop {
    id?: string;
    title: string;
    description: string;
    date: Timestamp | Date;
    time: string;
    instructor: string;
    seatsAvailable: number;
    thumbnailUrl?: string;
    youtubeLink: string;
    notesFileUrl?: string;
    notesFileName?: string;
    benefits: string[];
    isActive: boolean;
    createdAt: any;
}

export interface WorkshopRegistration {
    id?: string;
    workshopId: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    studentLevel?: string;
    country?: string;
    registrationDate: any;
    hasReviewed?: boolean;
}

// ─── Workshop Management ─────────────────────────────────────────────

const WORKSHOPS_COLLECTION = 'workshops';
const REGISTRATIONS_COLLECTION = 'registrations';

/**
 * Get all active workshops
 */
export async function getActiveWorkshops(db: Firestore): Promise<Workshop[]> {
    try {
        const workshopsRef = collection(db, WORKSHOPS_COLLECTION);
        const q = query(
            workshopsRef,
            where('isActive', '==', true),
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Workshop));
    } catch (error) {
        console.error('Error fetching workshops:', error);
        return [];
    }
}

/**
 * Get single workshop by ID
 */
export async function getWorkshopById(db: Firestore, id: string): Promise<Workshop | null> {
    try {
        const docRef = doc(db, WORKSHOPS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Workshop;
        }
        return null;
    } catch (error) {
        console.error('Error fetching workshop:', error);
        return null;
    }
}

/**
 * Create or Update Workshop (Admin only)
 */
export async function saveWorkshop(db: Firestore, workshop: Workshop): Promise<string> {
    try {
        if (workshop.id) {
            const docRef = doc(db, WORKSHOPS_COLLECTION, workshop.id);
            await updateDoc(docRef, { ...workshop, updatedAt: serverTimestamp() });
            return workshop.id;
        } else {
            const docRef = await addDoc(collection(db, WORKSHOPS_COLLECTION), {
                ...workshop,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error('Error saving workshop:', error);
        throw error;
    }
}

// ─── Registration Functions ───────────────────────────────────────────

/**
 * Register a student for a workshop
 */
export async function registerForWorkshop(
    db: Firestore,
    data: Omit<WorkshopRegistration, 'registrationDate' | 'hasReviewed'>
): Promise<{ success: boolean; message: string }> {
    try {
        // Check for existing registration
        const q = query(
            collection(db, REGISTRATIONS_COLLECTION),
            where('workshopId', '==', data.workshopId),
            where('userId', '==', data.userId)
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            return { success: false, message: 'You are already registered for this workshop.' };
        }

        // Add registration
        await addDoc(collection(db, REGISTRATIONS_COLLECTION), {
            ...data,
            registrationDate: serverTimestamp(),
            hasReviewed: false
        });

        // Optional: Trigger email notification via API route
        // fetch('/api/workshop/registration-email', { method: 'POST', body: JSON.stringify(data) });

        return { success: true, message: 'Registration successful!' };
    } catch (error) {
        console.error('Error registering for workshop:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

/**
 * Get user's registered workshops
 */
export async function getUserWorkshops(db: Firestore, userId: string): Promise<WorkshopRegistration[]> {
    try {
        const q = query(
            collection(db, REGISTRATIONS_COLLECTION),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkshopRegistration));
    } catch (error) {
        console.error('Error fetching user workshops:', error);
        return [];
    }
}

/**
 * Mark review as completed to unlock notes
 */
export async function completeWorkshopReview(db: Firestore, registrationId: string): Promise<boolean> {
    try {
        const docRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
        await updateDoc(docRef, { hasReviewed: true });
        return true;
    } catch (error) {
        console.error('Error updating review status:', error);
        return false;
    }
}
