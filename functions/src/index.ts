import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Triggered when a new transaction document is created.
 * Sends a push notification to ALL registered FCM tokens
 * EXCEPT the device that created the transaction.
 */
export const onTransactionCreated = functions.firestore.onDocumentCreated(
  "transactions/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { createdBy, amount, description, categoryId, senderToken } = data as {
      createdBy: string;
      amount: number;
      description?: string;
      categoryId?: string;
      senderToken?: string;
    };

    // Fetch all FCM tokens
    const tokensSnap = await db.collection("fcmTokens").get();
    if (tokensSnap.empty) return;

    // Exclude the sender's token
    const tokens: string[] = tokensSnap.docs
      .map((d) => d.data().token as string)
      .filter((t) => t && t !== senderToken);

    if (tokens.length === 0) return;

    const notifTitle = "Nhà Mình 🏠";
    const amountStr = formatVND(amount);
    const label = description || categoryId || "Giao dịch mới";
    const notifBody = `${createdBy} vừa nhập: ${amountStr} - ${label}`;

    // Send multicast (max 500 tokens per batch per FCM spec)
    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        android: {
          notification: { icon: "ic_stat_nhaminh", sound: "default" },
          priority: "high",
        },
        apns: {
          payload: {
            aps: { sound: "default", badge: 1 },
          },
        },
        webpush: {
          notification: {
            title: notifTitle,
            body: notifBody,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [200, 100, 200],
          },
          fcmOptions: { link: "/" },
        },
      });

      // Clean up invalid tokens
      const invalidIndexes: number[] = [];
      response.responses.forEach((r, idx) => {
        if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
          invalidIndexes.push(idx);
        }
      });

      if (invalidIndexes.length > 0) {
        const batch2 = db.batch();
        invalidIndexes.forEach((idx) => {
          const token = batch[idx];
          batch2.delete(db.collection("fcmTokens").doc(token));
        });
        await batch2.commit();
      }
    }

    functions.logger.info(`Notification sent to ${tokens.length} device(s): "${notifBody}"`);
  }
);
