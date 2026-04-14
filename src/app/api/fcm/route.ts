import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { token, userAgent, deviceType, language, displayName } = await req.json();
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

    // Deduplication: Remove old tokens for the same user + device fingerprint
    const sameUserTokens = await adminDb.collection("fcmTokens")
      .where("displayName", "==", displayName || "Nhà")
      .get();

    const deleteBatch = adminDb.batch();
    sameUserTokens.docs.forEach((doc) => {
      const data = doc.data();
      // If it's the same device (UA) but a different token, delete it
      if (doc.id !== token && data.userAgent === userAgent) {
        deleteBatch.delete(doc.ref);
      }
    });
    await deleteBatch.commit();

    // Save the new token
    await adminDb.collection("fcmTokens").doc(token).set({
      token,
      deviceType: deviceType || "Unknown",
      userAgent: userAgent || "Unknown",
      language: language || "Unknown",
      displayName: displayName || "Nhà",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FCM API error:", err);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}
