import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { EmailName, TemplateInput } from "@/emails";

const EMAIL_TEMPLATES = new Set<EmailName>([
  "booking-reminder",
  "rate-visit",
  "low-balance",
  "renewal",
  "payment-failed",
  "monthly-statement",
]);

type NoticeRow = {
  id: string;
  userId: string;
  email: string | null;
  title: string;
  body: string;
  href: string;
  template: string | null;
  emailData: Record<string, unknown> | null;
};

function serverEnv(name: string) {
  const env = globalThis.process?.env;
  const value = env?.[name];
  return typeof value === "string" ? value : "";
}

function asNotices(data: unknown): NoticeRow[] {
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is NoticeRow => {
    if (!row || typeof row !== "object") return false;
    const notice = row as Partial<NoticeRow>;
    return typeof notice.id === "string" && typeof notice.userId === "string" && typeof notice.title === "string";
  });
}

export const publishNotice = createServerFn({ method: "POST" })
  .validator((raw: { accessToken?: string; event?: string; ref?: string; origin?: string }) => {
    const accessToken = raw?.accessToken?.trim() ?? "";
    const event = raw?.event?.trim() ?? "";
    const ref = (raw?.ref ?? "").trim().slice(0, 80);
    const origin = typeof raw?.origin === "string" ? raw.origin.slice(0, 200) : "";
    if (accessToken.length < 20) throw new Error("Sign in again");
    if (!/^[a-z_]+$/.test(event)) throw new Error("Unknown notice");
    return { accessToken, event, ref, origin };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; created?: number; error?: string }> => {
    const url = serverEnv("VITE_SUPABASE_URL");
    const key = serverEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
    if (!url || !key) return { ok: false, error: "Notices are not set up yet" };

    const userClient = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Sign in again" };

    const { data: created, error } = await userClient.rpc("record_notice", {
      p_event: data.event,
      p_ref: data.ref,
    });
    if (error) return { ok: false, error: error.message };
    const notices = asNotices(created);
    if (notices.length === 0) return { ok: true, created: 0 };

    const secret = serverEnv("NOTIFY_INTERNAL_SECRET");
    const userIds = [...new Set(notices.map((notice) => notice.userId))];
    const tokensByUser = new Map<string, string[]>();
    const stale: string[] = [];

    if (secret) {
      const secretClient = createClient(url, key, {
        global: { headers: { "x-notify-secret": secret } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: tokenRows } = await secretClient.rpc("push_tokens_for", { p_user_ids: userIds });
      if (Array.isArray(tokenRows)) {
        for (const row of tokenRows) {
          const token = (row as { token?: string; user_id?: string }).token;
          const userId = (row as { user_id?: string }).user_id;
          if (!token || !userId) continue;
          const list = tokensByUser.get(userId) ?? [];
          list.push(token);
          tokensByUser.set(userId, list);
        }
      }

      const { sendPushToTokens } = await import("@/lib/fcm");
      for (const notice of notices) {
        const tokens = tokensByUser.get(notice.userId) ?? [];
        if (tokens.length === 0) continue;
        const result = await sendPushToTokens(tokens, {
          title: notice.title,
          body: notice.body,
          path: notice.href,
          origin: data.origin,
          notificationId: notice.id,
        });
        stale.push(...result.stale);
      }
      if (stale.length > 0) {
        await secretClient.rpc("forget_push_tokens", { p_tokens: stale });
      }
    }

    const { deliverTemplateEmail } = await import("@/lib/resend");
    for (const notice of notices) {
      if (!notice.email || !notice.template || !EMAIL_TEMPLATES.has(notice.template as EmailName)) continue;
      const emailData: TemplateInput = {};
      for (const [field, value] of Object.entries(notice.emailData ?? {})) {
        if (typeof value === "string" || typeof value === "number") {
          (emailData as Record<string, string>)[field] = String(value);
        }
      }
      if (data.origin && notice.href.startsWith("/")) {
        emailData.ctaUrl = `${data.origin}${notice.href}`;
      }
      await deliverTemplateEmail({
        to: notice.email,
        template: notice.template as EmailName,
        data: emailData,
      });
    }

    return { ok: true, created: notices.length };
  });
