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
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

// Types
export interface WebinarRegistration {
    id?: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    examType: 'PTE' | 'IELTS';
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    registrationDate: any;
    emailSent?: boolean;
    emailError?: string;
}

export async function updateEmailStatus(
    firestore: Firestore,
    id: string,
    status: { emailSent: boolean; emailError?: string }
): Promise<boolean> {
    try {
        const docRef = doc(firestore, WEBINAR_REGISTRATIONS_COLLECTION, id);
        await updateDoc(docRef, status);
        return true;
    } catch (error) {
        console.error('Error updating email status:', error);
        return false;
    }
}

export interface WebinarSettings {
    id?: string;
    title: string;
    description: string;
    date: string;
    time: string;
    meetingLink: string;
    isActive: boolean;
    updatedAt?: any;
}

const WEBINAR_REGISTRATIONS_COLLECTION = 'webinarRegistrations';
const WEBINAR_SETTINGS_COLLECTION = 'webinarSettings';
const WEBINAR_SETTINGS_DOC_ID = 'current';

// Default webinar settings
export const DEFAULT_WEBINAR_SETTINGS: WebinarSettings = {
    title: 'Free PTE Strategy Webinar',
    description: 'Join our free webinar and learn powerful strategies to improve your PTE scores.',
    date: '2026-03-15',
    time: '9:00 AM',
    meetingLink: '',
    isActive: true,
};

// ─── Registration Functions ───────────────────────────────────────────

export async function registerForWebinar(
    firestore: Firestore,
    data: Omit<WebinarRegistration, 'registrationDate'>
): Promise<{ success: boolean; message: string }> {
    try {
        // Check for duplicate registration
        const existing = await checkExistingRegistration(firestore, data.userId);
        if (existing) {
            return { success: false, message: 'You are already registered for this webinar.' };
        }

        const docRef = doc(collection(firestore, WEBINAR_REGISTRATIONS_COLLECTION));
        await setDoc(docRef, {
            ...data,
            registrationDate: serverTimestamp(),
            emailSent: false,
        });

        // Trigger email notification (don't await to avoid delaying the UI)
        fetch('/api/webinar/notification', {
            method: 'POST',
            body: JSON.stringify({
                studentName: data.fullName,
                studentEmail: data.email,
                studentPhone: data.phone,
                level: data.level,
                registrationTime: new Date().toLocaleString(),
                adminEmails: (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin_email_1@gmail.com,admin_email_2@gmail.com').split(','),
            }),
        }).catch(err => console.error('Failed to trigger notification:', err));

        return { success: true, message: '🎉 You are successfully registered for the webinar. A confirmation email has been sent to you.' };
    } catch (error) {
        console.error('Error registering for webinar:', error);
        return { success: false, message: 'Failed to register. Please try again.' };
    }
}

export async function checkExistingRegistration(
    firestore: Firestore,
    userId: string
): Promise<boolean> {
    try {
        const q = query(
            collection(firestore, WEBINAR_REGISTRATIONS_COLLECTION),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}

export async function getWebinarRegistrations(
    firestore: Firestore
): Promise<WebinarRegistration[]> {
    try {
        const q = query(
            collection(firestore, WEBINAR_REGISTRATIONS_COLLECTION),
            orderBy('registrationDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WebinarRegistration));
    } catch (error) {
        console.error('Error fetching registrations:', error);
        return [];
    }
}

export async function deleteWebinarRegistration(
    firestore: Firestore,
    id: string
): Promise<boolean> {
    try {
        await deleteDoc(doc(firestore, WEBINAR_REGISTRATIONS_COLLECTION, id));
        return true;
    } catch (error) {
        console.error('Error deleting webinar registration:', error);
        return false;
    }
}

// ─── Admin Notification Emails ───────────────────────────────────────

export interface AdminEmail {
    id?: string;
    email: string;
    dateAdded: any;
    addedBy: string;
    isActive: boolean;
}

const WEBINAR_ADMIN_EMAILS_COLLECTION = 'webinarAdminEmails';

export async function getAdminEmails(firestore: Firestore): Promise<AdminEmail[]> {
    try {
        const q = query(
            collection(firestore, WEBINAR_ADMIN_EMAILS_COLLECTION),
            orderBy('dateAdded', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminEmail));
    } catch (error) {
        console.error('Error fetching admin emails:', error);
        return [];
    }
}

export async function addAdminEmail(
    firestore: Firestore,
    email: string,
    addedBy: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Check for duplicates
        const q = query(
            collection(firestore, WEBINAR_ADMIN_EMAILS_COLLECTION),
            where('email', '==', email)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { success: false, message: 'This email is already in the list.' };
        }

        const docRef = doc(collection(firestore, WEBINAR_ADMIN_EMAILS_COLLECTION));
        await setDoc(docRef, {
            email,
            dateAdded: serverTimestamp(),
            addedBy,
            isActive: true,
        });

        return { success: true, message: 'Admin email added successfully.' };
    } catch (error) {
        console.error('Error adding admin email:', error);
        return { success: false, message: 'Failed to add admin email.' };
    }
}

export async function removeAdminEmail(firestore: Firestore, id: string): Promise<boolean> {
    try {
        await deleteDoc(doc(firestore, WEBINAR_ADMIN_EMAILS_COLLECTION, id));
        return true;
    } catch (error) {
        console.error('Error removing admin email:', error);
        return false;
    }
}

export async function toggleAdminEmailStatus(
    firestore: Firestore,
    id: string,
    isActive: boolean
): Promise<boolean> {
    try {
        const docRef = doc(firestore, WEBINAR_ADMIN_EMAILS_COLLECTION, id);
        await updateDoc(docRef, { isActive });
        return true;
    } catch (error) {
        console.error('Error toggling admin email status:', error);
        return false;
    }
}

// ─── Settings Functions ───────────────────────────────────────────────

export async function getWebinarSettings(
    firestore: Firestore
): Promise<WebinarSettings> {
    try {
        const docRef = doc(firestore, WEBINAR_SETTINGS_COLLECTION, WEBINAR_SETTINGS_DOC_ID);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as WebinarSettings;
        }
        // Initialize with defaults if not found
        await setDoc(docRef, { ...DEFAULT_WEBINAR_SETTINGS, updatedAt: serverTimestamp() });
        return DEFAULT_WEBINAR_SETTINGS;
    } catch (error) {
        console.error('Error fetching webinar settings:', error);
        return DEFAULT_WEBINAR_SETTINGS;
    }
}

export async function updateWebinarSettings(
    firestore: Firestore,
    settings: Partial<WebinarSettings>
): Promise<boolean> {
    try {
        const docRef = doc(firestore, WEBINAR_SETTINGS_COLLECTION, WEBINAR_SETTINGS_DOC_ID);
        await updateDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating webinar settings:', error);
        // Try setDoc if doc doesn't exist yet
        try {
            const docRef = doc(firestore, WEBINAR_SETTINGS_COLLECTION, WEBINAR_SETTINGS_DOC_ID);
            await setDoc(docRef, { ...DEFAULT_WEBINAR_SETTINGS, ...settings, updatedAt: serverTimestamp() });
            return true;
        } catch {
            return false;
        }
    }
}

// ─── CSV Export ───────────────────────────────────────────────────────

export function exportRegistrationsToCSV(registrations: WebinarRegistration[]): void {
    const headers = ['Name', 'Email', 'Phone', 'Exam', 'Level', 'Date'];
    const rows = registrations.map(r => [
        r.fullName,
        r.email,
        r.phone,
        r.examType,
        r.level,
        r.registrationDate?.toDate
            ? r.registrationDate.toDate().toLocaleDateString()
            : new Date(r.registrationDate?.seconds * 1000).toLocaleDateString() || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `webinar_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}
