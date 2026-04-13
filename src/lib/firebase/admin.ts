import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString()
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to project ID only (works in some environments if project is set)
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();
