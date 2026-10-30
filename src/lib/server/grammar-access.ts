import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { GRAMMAR_PACKAGE_ID, NO_ACCESS_EXPIRY, timestampMillis } from '@/lib/recorded-learning';
import { addMonths } from '@/types/recorded-package';
function normalCourseExpiry(row:FirebaseFirestore.DocumentData){
  const explicit=row.expiresAt||row.accessExpiresAt;
  if(explicit)return timestampMillis(explicit);
  const months=Number(row.accessMonths||row.months);
  const purchased=timestampMillis(row.purchasedAt||row.createdAt||row.enrollmentDate||row.activatedAt);
  if(purchased&&Number.isInteger(months)&&months>=1&&months<=3)return addMonths(new Date(purchased),months).getTime();
  // Older normal-course enrollments have no duration; their server-issued active status controls access.
  return NO_ACCESS_EXPIRY;
}

/** Existing server-issued course enrollments are the authority; client profile flags never grant grammar. */
export async function includedGrammarAccess(uid:string):Promise<number>{
  const db=adminDb!;
  const [recorded,pte,ielts,legacy]=await Promise.all([
    db.collection('recorded_enrollments').where('userId','==',uid).get(),
    db.collection('pte_course_enrollments').where('userId','==',uid).get(),
    db.collection('ielts_course_enrollments').where('userId','==',uid).get(),
    db.collection('user_course_access').where('userId','==',uid).get(),
  ]);
  let expiry=0;
  for(const doc of recorded.docs){const row=doc.data();const until=timestampMillis(row.expiresAt);if(row.packageId===GRAMMAR_PACKAGE_ID||row.status!=='active'||until<=Date.now())continue;const pkg=await db.collection('recorded_packages').doc(String(row.packageId)).get();if(pkg.exists&&pkg.data()?.productType!=='grammar')expiry=Math.max(expiry,until)}
  for(const doc of [...pte.docs,...ielts.docs]){
    const row=doc.data();if(row.status!=='active'||!(Number(row.amountPaid)>0||row.paymentStatus==='success'||row.grantedBy))continue;
    const time=normalCourseExpiry(row);
    if(time>Date.now())expiry=Math.max(expiry,time);
  }
  for(const doc of legacy.docs){
    const row=doc.data();if(row.accessStatus!=='active'||!row.courseId||!row.paymentOrderId)continue;
    const [course,orders]=await Promise.all([db.collection('courses').doc(String(row.courseId)).get(),db.collection('payment_orders').where('orderId','==',row.paymentOrderId).where('paymentStatus','==','success').limit(1).get()]);
    const data=course.data();if(!course.exists||!/\b(pte|ielts)\b/i.test(`${data?.title||''} ${data?.name||''} ${row.courseId}`)||orders.empty)continue;
    const time=normalCourseExpiry(row);if(time>Date.now())expiry=Math.max(expiry,time);
  }
  return expiry;
}
