
'use server';

import { createHash } from 'crypto';
import { payhereUrls } from '@/lib/payhere';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Client SDK for server-side use
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);


export type ServerActionState = {
    success: boolean;
    message: string;
    payload?: any; 
}

export async function enrollAction(prevState: ServerActionState, formData: FormData): Promise<ServerActionState> {
  const formValues = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    courseId: formData.get('course') as string,
    batchId: formData.get('batch') as string,
    freeDemo: formData.get('freeDemo') === 'on',
    userId: formData.get('userId') as string,
  };
  
  const userEmail = formValues.email;

  if (!userEmail || !formValues.userId) {
      return { success: false, message: 'User not found. Please log in to enroll.' };
  }
  
  if (formValues.freeDemo) {
      // Here you could add logic to save the demo request to your database
      return { success: true, message: 'Free demo requested! We will contact you shortly.' };
  }
  
  if (!formValues.courseId || !formValues.batchId) {
      return { success: false, message: 'Please select both a course and a batch.' };
  }

  const courseRef = doc(db, 'courses', formValues.courseId);
  const courseDoc = await getDoc(courseRef);

  if (!courseDoc.exists()) {
      return { success: false, message: 'Selected course not found.' };
  }

  const courseData = courseDoc.data();
  const amount = courseData?.price;
  const courseName = courseData?.name;

  if (!amount || !courseName) {
      return { success: false, message: 'Invalid course price or name.' };
  }

  const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    console.error("Payhere credentials are not set in environment variables.");
    return { success: false, message: "Payment gateway is not configured." };
  }
  
  // Simplified order_id to make it more robust for parsing.
  const order_id = `${formValues.userId}__${formValues.courseId}__${formValues.batchId}`;
  const amount_formatted = amount.toFixed(2);
  const currency = 'LKR';
  
  const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

  const hashed_secret = md5(merchantSecret);
  const hash_string = merchantId + order_id + amount_formatted + currency + hashed_secret;
  const hash = md5(hash_string);

  const payload = {
    merchant_id: merchantId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payhere/notify`,
    order_id: order_id,
    items: courseName,
    currency: currency,
    amount: amount_formatted,
    first_name: formValues.fullName.split(' ')[0],
    last_name: formValues.fullName.split(' ').slice(1).join(' ') || formValues.fullName.split(' ')[0],
    email: userEmail,
    phone: formValues.phone,
    address: '',
    city: '',
    country: 'Sri Lanka',
    hash: hash,
  };

  try {
    const orderDoc = {
      userId: formValues.userId,
      courseId: formValues.courseId,
      batchId: formValues.batchId,
      orderId: order_id,
      paymentStatus: 'pending',
      paymentAmount: amount,
      createdAt: new Date(),
      userEmail,
      userPhone: formValues.phone,
      courseName
    };
    const { addDoc, collection: coll } = await import('firebase/firestore');
    await addDoc(coll(db, 'payment_orders'), orderDoc);
  } catch (e) {
    console.error('Failed to create payment order record:', e);
  }

  return { success: true, message: 'Redirecting to payment...', payload };
}
