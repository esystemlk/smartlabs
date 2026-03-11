
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
            payment_id
        } = data;

        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantSecret) {
            console.error('Payhere merchant secret not found in environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const local_md5sig = md5(
            String(merchant_id) +
            String(order_id) +
            String(payhere_amount) +
            String(payhere_currency) +
            String(status_code) +
            md5(merchantSecret)
        );

        if (local_md5sig !== md5sig) {
            console.warn(`MD5 signature mismatch for order ${order_id}.`);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        if (!adminDb) {
            throw new Error("Firebase Admin DB is not initialized.");
        }

        // Find the order in payment_orders
        const ordersRef = adminDb.collection('payment_orders');
        const orderSnapshot = await ordersRef.where('orderId', '==', order_id).limit(1).get();

        if (orderSnapshot.empty) {
            console.warn(`Order ${order_id} not found in database.`);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const orderDoc = orderSnapshot.docs[0];
        const orderData = orderDoc.data();
        const { userId, courseId, batchId, userEmail, userPhone } = orderData as any;

        if (status_code === '2') {
            const batch = adminDb.batch();

            // 1. Update order status to success
            batch.update(orderDoc.ref, {
                paymentStatus: 'success',
                payherePaymentId: payment_id,
                updatedAt: FieldValue.serverTimestamp()
            });

            // 2. Activate course access in user_course_access (standalone collection)
            const accessRef = adminDb.collection('user_course_access').doc(`${userId}_${courseId}`);
            const batchInfo: any = {};
            try {
                if (batchId) {
                    const batchRef = adminDb.collection('courses').doc(courseId).collection('batches').doc(batchId);
                    const bSnap = await batchRef.get();
                    if (bSnap.exists) {
                        const bData = bSnap.data() || {};
                        batchInfo.batchId = batchId;
                        batchInfo.batchName = bData.name || '';
                        batchInfo.schedule = bData.schedule || '';
                    } else {
                        batchInfo.batchId = batchId;
                    }
                }
            } catch (e) {
                console.warn('Failed to load batch info:', e);
            }
            batch.set(accessRef, {
                userId,
                courseId,
                paymentOrderId: order_id,
                accessStatus: 'active',
                activatedAt: FieldValue.serverTimestamp(),
                ...batchInfo,
                contactEmail: userEmail || '',
                contactPhone: userPhone || ''
            });

            // 3. Compatibility: Add to users/{uid}/enrollments
            const enrollmentId = `pay_${order_id}`;
            const enrollmentRef = adminDb.collection('users').doc(userId).collection('enrollments').doc(enrollmentId);
            batch.set(enrollmentRef, {
                id: enrollmentId,
                userId: userId,
                courseId: courseId,
                enrollmentStatus: 'active',
                enrollmentDate: FieldValue.serverTimestamp(),
                paymentOrderId: order_id,
                ...batchInfo
            });

            // 4. Compatibility: Add to users/{uid}/active_courses
            const activeCourseRef = adminDb.collection('users').doc(userId).collection('active_courses').doc(courseId);
            batch.set(activeCourseRef, {
                enrolledAt: FieldValue.serverTimestamp(),
                courseId: courseId,
                ...batchInfo
            });

            // 5. Update user role
            const userRef = adminDb.collection('users').doc(userId);
            batch.update(userRef, { role: 'student' });

            await batch.commit();
            console.log(`Successfully activated course access and enrollment for User: ${userId}, Course: ${courseId}`);
        } else if (status_code === '-1' || status_code === '-2') {
            // Update order status to failed or cancelled
            await orderDoc.ref.update({
                paymentStatus: status_code === '-1' ? 'cancelled' : 'failed',
                updatedAt: FieldValue.serverTimestamp()
            });
            console.log(`Payment failed or cancelled for Order ID: ${order_id}`);
        }

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Error in Payhere notify route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
