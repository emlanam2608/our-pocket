"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase/client";

export function useFCM() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

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
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          sessionStorage.setItem("fcm-token", token);
          await fetch("/api/fcm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          console.log("FCM Token registered:", token);
        }
      }
    } catch (err) {
      console.error("FCM Permission error:", err);
    }
  }, []);

  // Try to auto-init if already granted
  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission === "granted") {
      requestPermission();
    }
  }, [requestPermission]);

  return { permission, requestPermission };
}
