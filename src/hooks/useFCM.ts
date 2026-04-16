"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase/client";

export function useFCM() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      const messaging = await getMessagingInstance();
      if (!messaging) throw new Error("Firebase Messaging not initialized");

      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === "granted") {
        // Clean up old push subscriptions before getting new token
        const oldSubscription = await registration.pushManager.getSubscription();
        if (oldSubscription) {
          console.log("Unsubscribing from old push subscription");
          await oldSubscription.unsubscribe();
        }

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          // Always update sessionStorage to track current token
          const previousToken = sessionStorage.getItem("fcm-token");
          sessionStorage.setItem("fcm-token", token);
          
          // Skip registration if token hasn't changed (prevents duplicate registrations)
          if (previousToken === token) {
            console.log("FCM Token unchanged, skipping duplicate registration");
            return;
          }
          
          const ua = navigator.userAgent;
          let deviceType = "Desktop";
          if (/iPhone|iPad|iPod/.test(ua)) deviceType = "iOS Device";
          else if (/Android/.test(ua)) deviceType = "Android Device";
          else if (/Macintosh/.test(ua)) deviceType = "Mac";
          else if (/Windows/.test(ua)) deviceType = "Windows PC";

          const deviceInfo = {
            token,
            deviceType,
            userAgent: ua,
            language: navigator.language,
            displayName: localStorage.getItem("nhaminh-displayname") ?? "Nhà",
          };

          await fetch("/api/fcm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deviceInfo),
          });
          console.log(`FCM Token registered for ${deviceType}:`, deviceInfo);
        }
      }
    } catch (err) {
      console.error("FCM Permission error:", err);
    }
  }, []);

  // Try to auto-init if already granted - but only once per session
  useEffect(() => {
    if (!initialized && typeof window !== "undefined" && Notification.permission === "granted") {
      setInitialized(true);
      requestPermission();
    }
  }, [initialized, requestPermission]);

  // Listen for foreground messages
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const setupListener = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Cleanup: Unregister old service workers to prevent duplicates
  useEffect(() => {
    const cleanupOldServiceWorkers = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        // Keep only the latest registration, unregister older ones
        if (registrations.length > 1) {
          console.log(`Found ${registrations.length} service worker registrations, cleaning up old ones`);
          for (let i = 0; i < registrations.length - 1; i++) {
            const success = await registrations[i].unregister();
            if (success) {
              console.log(`Unregistered old service worker: ${registrations[i].scope}`);
            }
          }
        }
      } catch (err) {
        console.error("Error cleaning up old service workers:", err);
      }
    };

    // Run cleanup after a short delay to ensure service workers are settled
    const timer = setTimeout(cleanupOldServiceWorkers, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { permission, requestPermission };
}
