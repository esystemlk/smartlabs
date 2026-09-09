import admin from 'firebase-admin';

/**
 * Server-only connection to the LMS Firebase project (lms-smartlabs), used to
 * feed LMS batch recordings into the main website's recorded-packages admin.
 *
 * Set `LMS_ADMIN_CONFIG` in the environment to the LMS service-account JSON
 * (the same file used by the office console: lms-service-account.json), as a
 * single-line JSON string. This is separate from the main site's
 * FIREBASE_ADMIN_CONFIG so the two projects stay isolated.
 */
const LMS_APP_NAME = 'lms';

let lmsDb: admin.firestore.Firestore | undefined;

function initLmsApp(): admin.firestore.Firestore | undefined {
  if (lmsDb) return lmsDb;

  const existing = admin.apps.find((a) => a?.name === LMS_APP_NAME);
  if (existing) {
    lmsDb = existing.firestore();
    return lmsDb;
  }

  const configString = process.env.LMS_ADMIN_CONFIG;
  if (!configString) {
    console.error('[lms-admin] LMS_ADMIN_CONFIG env var is missing — LMS batch feed disabled.');
    return undefined;
  }
  let serviceAccount: object | null = null;
  try {
    serviceAccount = JSON.parse(configString);
  } catch (err) {
    console.error('[lms-admin] LMS_ADMIN_CONFIG is not valid JSON:', err instanceof Error ? err.message : err);
    return undefined;
  }
  try {
    const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) }, LMS_APP_NAME);
    lmsDb = app.firestore();
    return lmsDb;
  } catch (err) {
    console.error('[lms-admin] initializeApp failed:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

export function getLmsDb(): admin.firestore.Firestore | undefined {
  return initLmsApp();
}
