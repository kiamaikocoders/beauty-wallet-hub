import { supabase } from "@/integrations/supabase/client";
import { firebaseConfigured, firebaseVapidKey, firebaseWebConfig } from "@/lib/firebase-public";
import { sendOwnPush } from "@/lib/push-server";

export type PushStatus = "loading" | "unconfigured" | "unsupported" | "denied" | "off" | "on";

export type PushNote = { title: string; body: string; id?: string };

async function messaging() {
  const config = firebaseWebConfig();
  if (!config) throw new Error("Push is not set up yet");
  const { getApp, getApps, initializeApp } = await import("firebase/app");
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) throw new Error("This browser cannot receive push notifications");
  const app = getApps().length ? getApp() : initializeApp(config);
  return getMessaging(app);
}

async function currentToken() {
  const vapidKey = firebaseVapidKey();
  if (!vapidKey) throw new Error("Push is not set up yet");
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(await messaging(), { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error("This browser did not return a push token");
  return token;
}

async function saveToken(token: string) {
  const { error } = await supabase.rpc("register_push_device" as never, {
    p_token: token,
    p_user_agent: navigator.userAgent.slice(0, 300),
  } as never);
  if (error) throw new Error(error.message);
}

export async function readPushStatus(): Promise<Exclude<PushStatus, "loading">> {
  if (!firebaseConfigured()) return "unconfigured";
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return "off";
  try {
    const token = await currentToken();
    const { data, error } = await supabase.from("push_devices").select("id").eq("token", token).maybeSingle();
    if (error || !data) return "off";
    return "on";
  } catch {
    return "off";
  }
}

export async function enablePush() {
  if (!firebaseConfigured()) return { ok: false as const, error: "Push is not set up yet" };
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false as const, error: "This browser cannot receive push notifications" };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false as const, error: "Notifications are blocked for this site" };
  }
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { ok: false as const, error: "Sign in to turn on push" };
  const token = await currentToken();
  await saveToken(token);
  return { ok: true as const };
}

export async function disablePush() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { ok: false as const, error: "Sign in again" };
  try {
    const token = await currentToken();
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(await messaging());
    const { error } = await supabase.from("push_devices").delete().eq("token", token);
    if (error) return { ok: false as const, error: error.message };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not turn off push" };
  }
  return { ok: true as const };
}

/** Refresh the token when permission was already granted. Does not prompt. */
export async function syncPushIfAllowed() {
  if (!firebaseConfigured()) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return;
  try {
    await saveToken(await currentToken());
  } catch (err) {
    console.info("[push] token sync skipped", err instanceof Error ? err.message : err);
  }
}

export async function listenForForegroundPush(onNote: (note: PushNote) => void) {
  if (!firebaseConfigured()) return () => {};
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return () => {};
  try {
    const { onMessage } = await import("firebase/messaging");
    return onMessage(await messaging(), (payload) => {
      const id = payload.data?.["notificationId"];
      onNote({
        title: payload.notification?.title || payload.data?.["title"] || "Beauty Wallet",
        body: payload.notification?.body || payload.data?.["body"] || "",
        ...(id ? { id } : {}),
      });
    });
  } catch {
    return () => {};
  }
}

export async function sendTestPush() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false as const, error: "Sign in again" };
  return sendOwnPush({
    data: {
      accessToken,
      title: "Beauty Wallet",
      body: "Push is on for this device.",
      path: "/app/notifications",
      origin: window.location.origin,
    },
  });
}
