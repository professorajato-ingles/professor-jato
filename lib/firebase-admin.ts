import * as admin from 'firebase-admin';

const PROJECT_ID = 'gen-lang-client-0176295507';

let adminApp: admin.app.App | null = null;

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      const databaseURL = `https://${PROJECT_ID}.firebaseio.com`;
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID,
        databaseURL: databaseURL,
      }, 'admin-app');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = adminApp ? admin.firestore(adminApp) : null;
