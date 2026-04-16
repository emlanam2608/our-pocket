import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Triggered when a new transaction is created.
 * Sends a notification to all registered tokens EXCEPT the sender.
 *
 * Region: us-central1
 */
export const onTransactionCreated = onDocumentCreated(
  {
    document: "houses/{houseId}/transactions/{transactionId}",
    region: "us-central1",
    memory: "256MiB",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (!data) return;

    const senderToken = data.senderToken;
    const amount = data.amount || 0;
    const createdBy = data.createdBy || "Ai đó";
    const description = data.description || "";

    console.log(
      `New v2 transaction detected: ${event.params.transactionId} by ${createdBy}`,
    );

    try {
      // 1. Get all registered tokens
      const tokensSnap = await admin.firestore().collection("fcmTokens").get();
      const tokens = tokensSnap.docs
        .map((doc) => doc.id)
        .filter((token) => token !== senderToken); // Don't notify the sender

      console.log(
        `Found ${tokensSnap.docs.length} total tokens. Sending to ${tokens.length} recipients (sender filtered: ${!!senderToken}).`,
      );

      if (tokens.length === 0) {
        return;
      }

      // 2. Define the notification using the modern Multicast API
      const body = description
        ? `${createdBy} vừa nhập ${amount.toLocaleString("vi-VN")}đ - ${description}`
        : `${createdBy} vừa nhập ${amount.toLocaleString("vi-VN")}đ`;

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens,
        notification: {
          title: "Chi tiêu mới! 💸",
          body: body,
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
      console.log(
        `Successfully sent ${response.successCount} notifications. Failed: ${response.failureCount}.`,
      );

      // 4. Aggressive cleanup: Delete any invalid tokens
      const invalidTokens: string[] = [];
      const tasks: Promise<any>[] = [];

      response.responses.forEach((resp, index) => {
        if (!resp.success && resp.error) {
          const failedToken = tokens[index];
          console.error(
            `Failure sending notification to ${failedToken.substring(0, 20)}...`,
            resp.error.code,
          );

          // Delete token on any error (invalid, expired, unregistered, etc.)
          if (
            resp.error.code === "messaging/invalid-registration-token" ||
            resp.error.code === "messaging/registration-token-not-registered" ||
            resp.error.code === "messaging/invalid-argument" ||
            resp.error.code === "messaging/third-party-auth-error" ||
            resp.error.code === "messaging/authentication-error"
          ) {
            console.log(
              `Deleting invalid token: ${failedToken.substring(0, 20)}...`,
            );
            invalidTokens.push(failedToken);
            tasks.push(
              admin
                .firestore()
                .collection("fcmTokens")
                .doc(failedToken)
                .delete()
                .catch((err) =>
                  console.error(
                    `Failed to delete token ${failedToken.substring(0, 20)}...`,
                    err,
                  ),
                ),
            );
          }
        }
      });

      await Promise.all(tasks);

      if (invalidTokens.length > 0) {
        console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  },
);

/**
 * Backfill existing transactions and assets from root collections to a house subcollection.
 * This is a one-time migration function.
 *
 * Usage:
 * const response = await firebase.functions().httpsCallable('migrateToHouse')({
 *   houseId: 'my-house-id',
 *   dryRun: true  // Optional, defaults to false
 * });
 */
export const migrateToHouse = https.onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (request) => {
    const { houseId, dryRun } = request.data;

    if (!request.auth?.uid) {
      throw new Error("Unauthenticated: You must be logged in to run migration");
    }

    if (!houseId) {
      throw new Error("houseId is required");
    }

    const db = admin.firestore();
    let transactionsMigrated = 0;
    let assetsMigrated = 0;
    let transactionsSkipped = 0;
    let assetsSkipped = 0;

    try {
      console.log(
        `Starting migration to house: ${houseId} (dryRun: ${dryRun})`,
      );

      // Check if house exists
      const houseDoc = await db.collection("houses").doc(houseId).get();
      if (!houseDoc.exists()) {
        throw new Error(`House ${houseId} does not exist`);
      }

      // Verify user is member of the house (or is the creator)
      const userMember = await db
        .collection("houses")
        .doc(houseId)
        .collection("members")
        .doc(request.auth.uid)
        .get();
      if (!userMember.exists()) {
        throw new Error(`You are not a member of house ${houseId}`);
      }

      // Step 1: Migrate transactions
      const txnsSnap = await db.collection("transactions").get();
      console.log(`Found ${txnsSnap.docs.length} root-level transactions`);

      const batch = db.batch();

      for (const doc of txnsSnap.docs) {
        const data = doc.data();

        // Check if already migrated (has houseId field)
        if (data.houseId) {
          console.log(`Transaction ${doc.id} already has houseId, skipping`);
          transactionsSkipped++;
          continue;
        }

        if (!dryRun) {
          const newDocRef = db
            .collection("houses")
            .doc(houseId)
            .collection("transactions")
            .doc(doc.id);

          batch.set(newDocRef, {
            ...data,
            houseId,
          });

          transactionsMigrated++;

          // Commit in batches of 100
          if (transactionsMigrated % 100 === 0) {
            await batch.commit();
            console.log(`Committed ${transactionsMigrated} transactions`);
          }
        } else {
          transactionsMigrated++;
        }
      }

      if (transactionsMigrated > 0 && !dryRun) {
        await batch.commit();
      }

      console.log(
        `Transactions migration complete: ${transactionsMigrated} migrated, ${transactionsSkipped} skipped`,
      );

      // Step 2: Migrate assets
      const assetsSnap = await db.collection("assets").get();
      console.log(`Found ${assetsSnap.docs.length} root-level assets`);

      const batch2 = db.batch();

      for (const doc of assetsSnap.docs) {
        const data = doc.data();

        // Check if already migrated
        if (data.houseId) {
          console.log(`Asset ${doc.id} already has houseId, skipping`);
          assetsSkipped++;
          continue;
        }

        if (!dryRun) {
          const newDocRef = db
            .collection("houses")
            .doc(houseId)
            .collection("assets")
            .doc(doc.id);

          batch2.set(newDocRef, {
            ...data,
            houseId,
          });

          assetsMigrated++;

          // Commit in batches of 100
          if (assetsMigrated % 100 === 0) {
            await batch2.commit();
            console.log(`Committed ${assetsMigrated} assets`);
          }
        } else {
          assetsMigrated++;
        }
      }

      if (assetsMigrated > 0 && !dryRun) {
        await batch2.commit();
      }

      console.log(
        `Assets migration complete: ${assetsMigrated} migrated, ${assetsSkipped} skipped`,
      );

      return {
        success: true,
        message: dryRun ? "Dry run completed" : "Migration completed",
        transactionsMigrated,
        transactionsSkipped,
        assetsMigrated,
        assetsSkipped,
        dryRun,
      };
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  },
);
