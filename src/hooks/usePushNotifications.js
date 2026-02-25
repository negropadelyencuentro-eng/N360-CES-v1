import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Chequeos seguros para SSR y browsers sin soporte
const supportsNotifications = typeof window !== "undefined" && "Notification" in window;
const supportsPush = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(
    supportsNotifications ? Notification.permission : "denied"
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!supportsPush) return;
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // silencioso
    }
  };

  const requestAndSubscribe = async () => {
    if (!supportsNotifications || !supportsPush) return "denied";
    if (!VAPID_PUBLIC_KEY) {
      console.warn("VITE_VAPID_PUBLIC_KEY no configurada");
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return result;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from("push_subscriptions").upsert(
        { user_id: user.id, subscription: sub.toJSON() },
        { onConflict: "user_id" }
      );

      setSubscribed(true);
      return result;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return "denied";
    }
  };

  return { permission, subscribed, requestAndSubscribe, supported: supportsPush };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
