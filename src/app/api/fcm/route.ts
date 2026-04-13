import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    // Use adminDb to bypass security rules on the server
    await adminDb.collection("fcmTokens").doc(token).set({
      token,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FCM API error:", err);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}
