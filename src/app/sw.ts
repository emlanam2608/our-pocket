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

// --- Firebase Messaging Setup (Push Notifications) ---

// Use environment variables for Firebase config
// In SW, process.env might not be defined if not shimmed by the bundler
const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have a sender ID and it's not a placeholder
if (firebaseConfig.messagingSenderId && !firebaseConfig.messagingSenderId.includes("11111")) {
  try {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, (payload) => {
      console.log("[sw.ts] Background message received", payload);
      const { title, body, icon } = payload.notification || {};

      self.registration.showNotification(title || "Nhà Mình 🏠", {
        body: body || "",
        icon: icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        // @ts-ignore
        vibrate: [200, 100, 200],
        tag: "nhaminh-transaction",
        renotify: true,
        data: payload.data,
      });
    });
  } catch (err) {
    console.error("[sw.ts] Failed to initialize Firebase Messaging:", err);
  }
}

// Notification click – open/focus the app
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
