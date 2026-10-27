import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type PushInput = {
  accessToken: string;
  title: string;
  body: string;
  path: string;
  origin: string;
};

function userClient(accessToken: string) {
  const url = (process.env["VITE_SUPABASE_URL"] ?? "").trim();
  const key = (process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const sendOwnPush = createServerFn({ method: "POST" })
  .validator((raw: Partial<PushInput>) => {
    const accessToken = raw?.accessToken?.trim() ?? "";
    const title = raw?.title?.trim().slice(0, 80) ?? "";
    const body = raw?.body?.trim().slice(0, 180) ?? "";
    const path =
      typeof raw?.path === "string" && raw.path.startsWith("/") && !raw.path.startsWith("//")
        ? raw.path.slice(0, 200)
        : "/app/notifications";
    const origin = typeof raw?.origin === "string" ? raw.origin.slice(0, 200) : "";
    if (accessToken.length < 20) throw new Error("Sign in again");
    if (!title || !body) throw new Error("A title and message are required");
    return { accessToken, title, body, path, origin };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; sent?: number; error?: string }> => {
    const url = (process.env["VITE_SUPABASE_URL"] ?? "").trim();
    const key = (process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();
    if (!url || !key) return { ok: false, error: "Push is not set up yet" };
    const supabase = userClient(data.accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Sign in again" };

    const { data: devices, error } = await supabase
      .from("push_devices")
      .select("token")
      .eq("user_id", userData.user.id);
    if (error) return { ok: false, error: "Could not read this device" };

    const tokens = (devices ?? []).map((row) => row.token).filter(Boolean);
    const { sendPushToTokens } = await import("@/lib/fcm");
    const result = await sendPushToTokens(tokens, data);
    if (result.stale.length > 0) {
      await supabase.from("push_devices").delete().in("token", result.stale);
    }
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, sent: result.sent };
  });
