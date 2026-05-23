import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;

  if (!serviceAccountString) {
    console.error(
      '❌ [firebase-admin] FIREBASE_ADMIN_CONFIG env var is MISSING. ' +
      'Set it in .env.local. Firebase Admin SDK not initialized.'
    );
  } else {
    let serviceAccount: object | null = null;

    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error(
        '❌ [firebase-admin] FIREBASE_ADMIN_CONFIG is set but JSON.parse() FAILED. ' +
        'The JSON in .env.local is malformed. Error:', msg,
        '\nFirst 120 chars of value:', serviceAccountString.slice(0, 120)
      );
    }

    if (serviceAccount) {
      try {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
        adminDb   = admin.firestore();
        adminAuth = admin.auth();
        console.log('✅ [firebase-admin] Firebase Admin SDK initialized successfully.');
      } catch (initErr: unknown) {
        const msg = initErr instanceof Error ? initErr.message : String(initErr);
        console.error('❌ [firebase-admin] initializeApp() failed:', msg);
      }
    }
  }
} else {
  adminDb   = admin.firestore();
  adminAuth = admin.auth();
}

export { adminDb, adminAuth };
