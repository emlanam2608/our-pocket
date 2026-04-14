import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope;

// --- Serwist Setup (Asset Caching) ---
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// --- Firebase Messaging Setup ---

// Hardcoded check for build-time replacement
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (FIREBASE_CONFIG.messagingSenderId) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, (payload) => {
      console.log("[sw.ts] Received background message", payload);
      const notificationTitle = payload.notification?.title || "Chi tiêu mới! 🏠";
      const notificationOptions = {
        body: payload.notification?.body || "Gia đình mình vừa có chi tiêu mới.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "nhaminh-transaction",
        data: payload.data,
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (err) {
    console.error("[sw.ts] Firebase Messaging init error", err);
  }
}

// Fallback: Listen to raw push events (very reliable for iOS)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log("[sw.ts] Raw push received", data);
    
    // If the notification isn't already handled by onBackgroundMessage
    if (data.notification) {
      const { title, body } = data.notification;
      event.waitUntil(
        self.registration.showNotification(title || "Nhà Mình 🏠", {
          body: body || "",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "nhaminh-transaction",
        })
      );
    }
  } catch (e) {
    console.error("[sw.ts] Push event processing error", e);
  }
});

// Notification click logic
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
