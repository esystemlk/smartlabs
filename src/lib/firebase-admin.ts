import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
      adminDb = admin.firestore();
      adminAuth = admin.auth();
    } catch (e: any) {
      console.error('Firebase admin initialization error:', e.message);
    }
  } else {
    // This will be logged during build, which is fine.
    console.warn("FIREBASE_ADMIN_CONFIG environment variable is not set. Firebase Admin SDK not initialized.");
  }
} else {
    // If the app is already initialized, get the instances.
    adminDb = admin.firestore();
    adminAuth = admin.auth();
}

export { adminDb, adminAuth };
