"use client";

import { useEffect, useRef } from "react";
import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase/client";

export function useFCM() {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Register service worker first
        const registration = await navigator.serviceWorker.register(
          "/sw.js",
          { scope: "/" }
        );

        const messaging = await getMessagingInstance();
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token && token !== tokenRef.current) {
          tokenRef.current = token;
          // Save to session so we can attach it to transactions
          sessionStorage.setItem("fcm-token", token);
          // Register with server
          await fetch("/api/fcm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
      } catch (err) {
        console.warn("FCM init error:", err);
      }
    };

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      init();
    }
  }, []);
}
