import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  };

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Guardar subscripción en Supabase
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        subscription: sub.toJSON(),
      }, { onConflict: "user_id" });

      setSubscribed(true);
      setPermission("granted");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    }
  };

  const requestAndSubscribe = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribe();
    }
    return result;
  };

  return { permission, subscribed, requestAndSubscribe };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
