import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Triggered when a new transaction is created.
 * Sends a notification to all registered tokens EXCEPT the sender.
 * 
 * Region: asia-southeast1 (Singapore)
 */
export const onTransactionCreated = onDocumentCreated({
  document: "transactions/{transactionId}",
  region: "us-central1",
  memory: "256MiB",
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (!data) return;

  const senderToken = data.senderToken;
  const amount = data.amount || 0;
  const createdBy = data.createdBy || "Ai đó";
  const description = data.description || "Không có mô tả";

  console.log(`New v2 transaction detected: ${event.params.transactionId} by ${createdBy}`);

  try {
    // 1. Get all registered tokens
    const tokensSnap = await admin.firestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs
      .map((doc) => doc.id)
      .filter((token) => token !== senderToken); // Don't notify the sender

    console.log(`Found ${tokensSnap.docs.length} total tokens. Sending to ${tokens.length} recipients (sender filtered: ${!!senderToken}).`);

    if (tokens.length === 0) {
      return;
    }

    // 2. Define the notification using the modern Multicast API
    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: "Chi tiêu mới! 💸",
        body: `${createdBy} vừa nhập ${amount.toLocaleString("vi-VN")}đ - ${description}`,
      },
      data: {
        transactionId: event.params.transactionId,
        amount: String(amount),
      },
      webpush: {
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        },
        fcmOptions: {
          link: "https://our-pocket-eta.vercel.app/",
        },
      },
    };

    // 3. Send notifications
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications.`);

    // 4. Cleanup old/invalid tokens
    const tasks: Promise<any>[] = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success && resp.error) {
        console.error("Failure sending notification to", tokens[index], resp.error);
        if (
          resp.error.code === "messaging/invalid-registration-token" ||
          resp.error.code === "messaging/registration-token-not-registered"
        ) {
          tasks.push(admin.firestore().collection("fcmTokens").doc(tokens[index]).delete());
        }
      }
    });

    await Promise.all(tasks);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
});
