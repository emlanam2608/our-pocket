import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { token, userAgent, deviceType, language, displayName } = await req.json();
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

    // Use adminDb to bypass security rules on the server
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
