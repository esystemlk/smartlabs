import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['admin', 'developer', 'teacher'];

/**
 * Manually grant a student access to a recorded package — used for bank-transfer
 * buyers who pay outside PayHere. Admin-only. Access expires after `months`.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));

    // Verify the caller is an admin.
    const callerSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const callerRole = callerSnap.data()?.role;
    if (!ADMIN_ROLES.includes(callerRole)) {
      return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
    }

    const { packageId, email, months, amountPaid } = (await request.json()) as {
      packageId?: string; email?: string; months?: number; amountPaid?: number;
    };
    if (!packageId || !email) {
      return NextResponse.json({ error: 'packageId and email are required.' }, { status: 400 });
    }
    const accessMonths = Number(months) || 1;
    const cleanEmail = String(email).toLowerCase().trim();

    // Package
    const pkgSnap = await adminDb.collection('recorded_packages').doc(packageId).get();
    if (!pkgSnap.exists) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
    const pkg = pkgSnap.data()!;

    // Find the student's account by email (they need an account to watch).
    const usersSnap = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (usersSnap.empty) {
      return NextResponse.json({
        error: `No student account found for ${cleanEmail}. Ask them to sign up on the website first, then grant again.`,
      }, { status: 404 });
    }
    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;
    const u = userDoc.data();

    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt);
    expiresAt.setMonth(expiresAt.getMonth() + accessMonths);

    // Deterministic id => re-granting refreshes the same row.
    const enrollRef = adminDb.collection('recorded_enrollments').doc(`${userId}_${packageId}`);
    await enrollRef.set({
      userId,
      userEmail: u.email ?? cleanEmail,
      userName: u.displayName ?? null,
      userPhone: u.phone ?? null,
      packageId,
      packageTitle: (pkg.title as string) ?? 'Recorded Package',
      purchasedAt,
      expiresAt,
      status: 'active',
      amountPaid: Number(amountPaid) || 0,
      grantedBy: (callerSnap.data()?.email as string) || decoded.uid,
      paymentMethod: 'bank_transfer',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      grantedTo: cleanEmail,
      expiresAt: expiresAt.toISOString(),
      months: accessMonths,
    });
  } catch (error) {
    console.error('[recorded-packages/grant-access]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
