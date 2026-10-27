export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function read(name: string) {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function firebaseWebConfig(): FirebaseWebConfig | null {
  const config = {
    apiKey: read("VITE_FIREBASE_API_KEY"),
    authDomain: read("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: read("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: read("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: read("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: read("VITE_FIREBASE_APP_ID"),
  };
  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) return null;
  return config;
}

export function firebaseVapidKey() {
  return read("VITE_FIREBASE_VAPID_KEY");
}

export function firebaseConfigured() {
  return Boolean(firebaseWebConfig() && firebaseVapidKey());
}
