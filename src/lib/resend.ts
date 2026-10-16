import { createServerFn } from "@tanstack/react-start";
import type { EmailName, TemplateInput } from "@/emails";

export type SendTemplateArgs = {
  to: string;
  template: EmailName;
  data?: TemplateInput;
  from?: string;
};

export type SendTemplateResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

/**
 * Sends one Beauty Wallet email template via Resend (server-only).
 * If RESEND_API_KEY is missing, no-ops and logs to the console.
 */
export async function deliverTemplateEmail(args: SendTemplateArgs): Promise<SendTemplateResult> {
  const { renderEmail } = await import("@/emails");
  const key = process.env["RESEND_API_KEY"] ?? "";
  const payload = renderEmail(args.template, args.data);
  const from = args.from ?? "Beauty Wallet <hello@beautywallet.co.ke>";

  if (!key) {
    console.info("[resend] RESEND_API_KEY missing — skip send", {
      to: args.to,
      template: args.template,
      subject: payload.subject,
    });
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        tags: [{ name: "template", value: args.template }],
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("[resend] send failed", json);
      return { ok: false, error: json.message ?? res.statusText };
    }
    return json.id ? { ok: true, id: json.id } : { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[resend] send error", message);
    return { ok: false, error: message };
  }
}

export const sendTemplateEmail = createServerFn({ method: "POST" })
  .validator((raw: SendTemplateArgs) => {
    if (!raw || typeof raw.to !== "string" || !raw.to.includes("@")) {
      throw new Error("A valid recipient email is required");
    }
    if (!raw.template) throw new Error("template is required");
    return raw;
  })
  .handler(async ({ data: args }): Promise<SendTemplateResult> => deliverTemplateEmail(args));

const CODE_TTL_MS = 10 * 60 * 1000;

function codeSecret() {
  return process.env["OTP_SECRET"] || process.env["RESEND_API_KEY"] || "";
}

export type EmailCodeTicket = {
  ok: boolean;
  token?: string;
  exp?: number;
  error?: string;
  skipped?: boolean;
};

/** Email a 6-digit join code. The code stays in the email; the client only stores a signed ticket. */
export const sendEmailCode = createServerFn({ method: "POST" })
  .validator((raw: { email?: string; firstName?: string }) => {
    const email = raw?.email?.trim().toLowerCase() ?? "";
    if (!email.includes("@")) throw new Error("A valid email is required");
    return { email, firstName: raw.firstName?.trim() || "there" };
  })
  .handler(async ({ data }): Promise<EmailCodeTicket> => {
    const secret = codeSecret();
    if (!secret) return { ok: false, error: "Email codes are not configured" };
    const { createHmac, randomInt } = await import("node:crypto");
    const code = String(randomInt(100000, 1_000_000));
    const exp = Date.now() + CODE_TTL_MS;
    const token = createHmac("sha256", secret).update(`${data.email}|${code}|${exp}`).digest("hex");
    const sent = await deliverTemplateEmail({
      to: data.email,
      template: "verify",
      data: {
        email: data.email,
        firstName: data.firstName,
        code,
        ctaUrl: "https://www.beautywallet.co.ke/join/verify",
      },
    });
    if (!sent.ok) return { ok: false, error: sent.error ?? "Could not send email" };
    return sent.skipped ? { ok: true, token, exp, skipped: true } : { ok: true, token, exp };
  });

export const verifyEmailCode = createServerFn({ method: "POST" })
  .validator((raw: { email?: string; code?: string; token?: string; exp?: number }) => {
    const email = raw?.email?.trim().toLowerCase() ?? "";
    const code = (raw?.code ?? "").replace(/\D/g, "");
    if (!email.includes("@") || code.length !== 6 || !raw?.token || typeof raw.exp !== "number") {
      throw new Error("Enter the 6-digit code from your email");
    }
    return { email, code, token: raw.token, exp: raw.exp };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; error?: "expired" | "wrong" }> => {
    if (Date.now() > data.exp) return { ok: false, error: "expired" };
    const secret = codeSecret();
    if (!secret) return { ok: false, error: "wrong" };
    const { createHmac, timingSafeEqual } = await import("node:crypto");
    const expected = createHmac("sha256", secret)
      .update(`${data.email}|${data.code}|${data.exp}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, error: "wrong" };
    return { ok: true };
  });

/** Fire-and-forget wrapper for UI flows — never throws. */
export function notifyEmail(args: SendTemplateArgs) {
  void sendTemplateEmail({ data: args }).catch((err) => {
    console.error("[resend] notify failed", err);
  });
}
