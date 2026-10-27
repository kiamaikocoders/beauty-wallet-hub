type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type PushMessage = {
  title: string;
  body: string;
  path: string;
  origin: string;
  notificationId?: string;
};

type SendResult =
  | { ok: true; sent: number; stale: string[] }
  | { ok: false; error: string; stale: string[] };

let cachedToken: { value: string; exp: number } | null = null;

function serverEnv(name: string) {
  const env = globalThis.process?.env;
  const value = env?.[name];
  return typeof value === "string" ? value : "";
}

function serviceAccount(): ServiceAccount | null {
  const raw = serverEnv("FIREBASE_SERVICE_ACCOUNT").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function pemToPkcs8(pem: string) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signJwt(account: ServiceAccount, now: number) {
  const header = textToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = textToBase64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;
  const assertion = await signJwt(account, now);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || "Could not authorize push sending");
  }
  cachedToken = { value: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

export function notificationLink(origin: string, path: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/app/notifications";
  try {
    const base = new URL(origin);
    const local = base.hostname === "localhost" || base.hostname === "127.0.0.1";
    if (base.protocol !== "https:" && !local) return safePath;
    const url = new URL(safePath, base.origin);
    if (url.origin !== base.origin) return safePath;
    return url.toString();
  } catch {
    return safePath;
  }
}

function staleToken(status: number, body: string) {
  return status === 404 || body.includes("UNREGISTERED") || body.includes("NOT_FOUND");
}

export async function sendPushToTokens(tokens: string[], message: PushMessage): Promise<SendResult> {
  const account = serviceAccount();
  if (!account) return { ok: false, error: "Push sending is not configured", stale: [] };
  if (tokens.length === 0) return { ok: false, error: "Turn on push for this device first", stale: [] };

  let bearer: string;
  try {
    bearer = await accessToken(account);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not authorize push sending",
      stale: [],
    };
  }

  const link = notificationLink(message.origin, message.path);
  const webpush: {
    fcm_options?: { link: string };
    notification?: { icon: string };
  } = {};
  if (link.startsWith("https:")) {
    webpush.fcm_options = { link };
    webpush.notification = { icon: new URL("/icon-512.png", link).toString() };
  }
  let sent = 0;
  const stale: string[] = [];
  let lastError = "Could not deliver the notification";

  for (const token of tokens) {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: message.title, body: message.body },
            data: {
              url: link,
              title: message.title,
              body: message.body,
              notificationId: message.notificationId ?? "",
            },
            webpush,
          },
        }),
      },
    );
    if (res.ok) {
      sent += 1;
      continue;
    }
    const body = await res.text();
    if (staleToken(res.status, body)) {
      stale.push(token);
      continue;
    }
    lastError = "Could not deliver the notification";
    console.error("[fcm] send failed", res.status);
  }

  if (sent === 0) {
    return {
      ok: false,
      error: stale.length ? "Turn on push for this device first" : lastError,
      stale,
    };
  }
  return { ok: true, sent, stale };
}
