import { renderEmail, type EmailName, type TemplateInput } from "@/emails";

export type SendTemplateArgs = {
  to: string;
  template: EmailName;
  data?: TemplateInput;
  from?: string;
};

/**
 * Sends one Beauty Wallet email template via Resend.
 * If RESEND_API_KEY is missing, no-ops and logs to the console.
 */
export async function sendTemplateEmail(args: SendTemplateArgs): Promise<{
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}> {
  const key =
    (typeof process !== "undefined" && process.env["RESEND_API_KEY"]) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.["RESEND_API_KEY"]) ||
    "";

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
