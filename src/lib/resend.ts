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
export const sendTemplateEmail = createServerFn({ method: "POST" })
  .validator((raw: SendTemplateArgs) => {
    if (!raw || typeof raw.to !== "string" || !raw.to.includes("@")) {
      throw new Error("A valid recipient email is required");
    }
    if (!raw.template) throw new Error("template is required");
    return raw;
  })
  .handler(async ({ data: args }): Promise<SendTemplateResult> => {
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
  });

/** Fire-and-forget wrapper for UI flows — never throws. */
export function notifyEmail(args: SendTemplateArgs) {
  void sendTemplateEmail({ data: args }).catch((err) => {
    console.error("[resend] notify failed", err);
  });
}
