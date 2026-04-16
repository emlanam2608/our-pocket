import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { token, userAgent, deviceType, language, displayName } = await req.json();
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

    // Aggressive deduplication: Remove ALL old tokens for the same user + device fingerprint
    const sameUserTokens = await adminDb.collection("fcmTokens")
      .where("displayName", "==", displayName || "Nhà")
      .get();

    const deleteBatch = adminDb.batch();
    sameUserTokens.docs.forEach((doc) => {
      const data = doc.data();
      // Delete ANY token with the same UA (same device), regardless of timestamp
      // This ensures only the latest token persists per device
      if (doc.id !== token && data.userAgent === userAgent) {
        console.log(`Deleting old FCM token: ${doc.id.substring(0, 20)}...`);
        deleteBatch.delete(doc.ref);
      }
    });
    await deleteBatch.commit();

    // Save the new token with explicit merge to ensure it's the current one
    await adminDb.collection("fcmTokens").doc(token).set({
      token,
      deviceType: deviceType || "Unknown",
      userAgent: userAgent || "Unknown",
      language: language || "Unknown",
      displayName: displayName || "Nhà",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`FCM Token registered: ${token.substring(0, 20)}... for ${displayName}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FCM API error:", err);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}
