import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    addDoc,
    Timestamp,
    deleteDoc
} from 'firebase/firestore';

export interface CoursePaymentSettings {
    id?: string;
    courseId: string;
    courseName: string;
    payherePaymentLink: string;
    price: number;
    status: 'active' | 'disabled';
    createdAt?: any;
}

export interface PaymentOrder {
    id?: string;
    userId: string;
    courseId: string;
    orderId: string;
    paymentStatus: 'pending' | 'success' | 'failed' | 'cancelled';
    paymentAmount: number;
    createdAt: any;
}

export interface UserCourseAccess {
    userId: string;
    courseId: string;
    paymentOrderId: string;
    accessStatus: 'active' | 'suspended';
    activatedAt: any;
}

const COLLECTIONS = {
    PAYMENT_SETTINGS: 'course_payment_settings',
    PAYMENT_ORDERS: 'payment_orders',
    COURSE_ACCESS: 'user_course_access'
};

export const paymentService = {
    // Admin Payment Settings
    async getPaymentSettings(): Promise<CoursePaymentSettings[]> {
        try {
            const q = query(collection(db, COLLECTIONS.PAYMENT_SETTINGS), orderBy('courseName', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoursePaymentSettings));
        } catch (error) {
            console.error('Error fetching payment settings:', error);
            return [];
        }
    },

    async updatePaymentSettings(settings: CoursePaymentSettings) {
        try {
            const docId = settings.id || settings.courseId;
            const docRef = doc(db, COLLECTIONS.PAYMENT_SETTINGS, docId);
            await setDoc(docRef, {
                ...settings,
                updatedAt: serverTimestamp(),
                createdAt: settings.createdAt || serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error updating payment settings:', error);
            return false;
        }
    },

    async getCoursePaymentSetting(courseId: string): Promise<CoursePaymentSettings | null> {
        try {
            const docRef = doc(db, COLLECTIONS.PAYMENT_SETTINGS, courseId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as CoursePaymentSettings;
            }
            return null;
        } catch (error) {
            console.error('Error fetching course payment setting:', error);
            return null;
        }
    },

    // Payment Orders
    async createPaymentOrder(order: Omit<PaymentOrder, 'id' | 'createdAt'>): Promise<string | null> {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_ORDERS), {
                ...order,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating payment order:', error);
            return null;
        }
    },

    async getPaymentOrders(): Promise<PaymentOrder[]> {
        try {
            const q = query(collection(db, COLLECTIONS.PAYMENT_ORDERS), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Handle Firestore Timestamp
                    createdAt: data.createdAt
                } as PaymentOrder;
            });
        } catch (error) {
            console.error('Error fetching payment orders:', error);
            return [];
        }
    },

    async updateOrderStatus(orderId: string, status: PaymentOrder['paymentStatus']) {
        try {
            // Find order by orderId field (which is the one sent to PayHere)
            const q = query(collection(db, COLLECTIONS.PAYMENT_ORDERS), where('orderId', '==', orderId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docRef = doc(db, COLLECTIONS.PAYMENT_ORDERS, snapshot.docs[0].id);
                await updateDoc(docRef, { paymentStatus: status });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    },

    // User Course Access
    async grantCourseAccess(access: UserCourseAccess) {
        try {
            // 1. Update user_course_access
            const docId = `${access.userId}_${access.courseId}`;
            const docRef = doc(db, COLLECTIONS.COURSE_ACCESS, docId);
            await setDoc(docRef, {
                ...access,
                activatedAt: serverTimestamp()
            });

            // 2. Compatibility: Add to users/{uid}/enrollments
            const enrollmentId = `pay_${access.paymentOrderId}`;
            const enrollmentRef = doc(db, 'users', access.userId, 'enrollments', enrollmentId);
            await setDoc(enrollmentRef, {
                id: enrollmentId,
                userId: access.userId,
                courseId: access.courseId,
                enrollmentStatus: 'active',
                enrollmentDate: serverTimestamp(),
                paymentOrderId: access.paymentOrderId
            });

            // 3. Compatibility: Add to users/{uid}/active_courses
            const activeCourseRef = doc(db, 'users', access.userId, 'active_courses', access.courseId);
            await setDoc(activeCourseRef, {
                enrolledAt: serverTimestamp(),
                courseId: access.courseId
            });

            // 4. Update user role
            const userRef = doc(db, 'users', access.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().role === 'user') {
                await updateDoc(userRef, { role: 'student' });
            }

            return true;
        } catch (error) {
            console.error('Error granting course access:', error);
            return false;
        }
    },

    async updateCourseAccessStatus(accessId: string, status: 'active' | 'suspended') {
        try {
            const docRef = doc(db, COLLECTIONS.COURSE_ACCESS, accessId);
            await updateDoc(docRef, { accessStatus: status });
            return true;
        } catch (error) {
            console.error('Error updating access status:', error);
            return false;
        }
    },

    async removeCourseAccess(accessId: string, userId: string, courseId: string) {
        try {
            // 1. Remove from user_course_access
            await deleteDoc(doc(db, COLLECTIONS.COURSE_ACCESS, accessId));

            // 2. Remove from active_courses (compatibility)
            await deleteDoc(doc(db, 'users', userId, 'active_courses', courseId));

            // 3. Optional: We might want to keep the enrollment record but mark it as 'removed' or delete it.
            // For now, let's just delete the access points.
            return true;
        } catch (error) {
            console.error('Error removing course access:', error);
            return false;
        }
    }
};
