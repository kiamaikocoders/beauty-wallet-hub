/* Public Firebase web config only. The service account never belongs in this file. */
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA-PJJ8XZNECElgbIP1I3ipN-eaSb_-fH8",
  authDomain: "beautywallet-e5e6e.firebaseapp.com",
  projectId: "beautywallet-e5e6e",
  storageBucket: "beautywallet-e5e6e.firebasestorage.app",
  messagingSenderId: "29855617482",
  appId: "1:29855617482:web:d29a64b2aaa913aa3d7f33",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const title = payload.data?.title || "Beauty Wallet";
  const body = payload.data?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-512.png",
    silent: false,
    sound: "/sounds/notification.wav",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = typeof data.url === "string" && data.url ? data.url : "/app/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      for (const client of windows) {
        if (!client.url.startsWith(self.location.origin)) continue;
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
      await clients.openWindow(target);
    }),
  );
});
