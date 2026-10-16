import type { Row } from "./types";

const SITE = "https://beautywallet.co.ke";

export function emailAsset(path: string) {
  const base = (typeof process !== "undefined" && process.env["EMAIL_ASSET_BASE"]) || SITE;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function rowsHtml(rows: Row[]) {
  return rows
    .map(
      (r) => `
      <tr>
        <td style="padding:5px 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#6b6570;">${escapeHtml(r.label)}</td>
        <td align="right" style="padding:5px 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#161417;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");
}

export function emailShell(opts: {
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  afterCtaHtml?: string;
  heroImage?: string;
  footerHtml?: string;
  providerTone?: boolean;
}) {
  const emblem = emailAsset("/images/brand/emblem-on-dark.svg");
  const hero = opts.heroImage
    ? `<img src="${escapeHtml(opts.heroImage)}" width="600" alt="" style="display:block;width:100%;height:auto;border:0;" />`
    : "";
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 16px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.44px;text-transform:uppercase;color:#6b1d38;">${escapeHtml(opts.eyebrow)}</p>`
    : "";
  const cta = opts.cta
    ? `<a href="${escapeHtml(opts.cta.href)}" style="display:inline-block;margin:0 0 16px;padding:12px 24px;border-radius:999px;background:#161417;color:#f7f1ea;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;line-height:1.2;">${escapeHtml(opts.cta.label)}</a>`
    : "";
  const defaultFooter = opts.providerTone
    ? "Questions about your listing or payouts? Email partners@beautywallet.co.ke or call 0700 123 456."
    : "Questions? Reply to this email, call 0700 123 456 or open Help in the app.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1ea;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#161417;padding:20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${emblem}" width="34" height="34" alt="" style="display:block;border:0;" />
                  </td>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.3;color:#f7f1ea;letter-spacing:-0.18px;">Beauty Wallet</td>
                </tr>
              </table>
            </td>
          </tr>
          ${hero ? `<tr><td>${hero}</td></tr>` : ""}
          <tr>
            <td style="padding:36px 40px;">
              ${eyebrow}
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:400;color:#161417;">${escapeHtml(opts.title)}</h1>
              ${opts.bodyHtml}
              ${cta}
              ${opts.afterCtaHtml ?? ""}
            </td>
          </tr>
          <tr>
            <td style="background:#efe6db;padding:20px 40px;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#6b6570;">
              ${opts.footerHtml ?? `<p style="margin:0 0 6px;font-size:14px;line-height:1.45;">${defaultFooter}</p>`}
              <p style="margin:0;font-size:12px;line-height:1.4;">Beauty Wallet · Nairobi, Kenya</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function summaryBox(rows: Row[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#efe6db;border-radius:12px;">
    <tr><td style="padding:16px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml(rows)}</table></td></tr>
  </table>`;
}

export function p(text: string, muted = false) {
  return `<p style="margin:0 0 16px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${muted ? "#6b6570" : "#161417"};">${escapeHtml(text)}</p>`;
}

export function pHtml(html: string, muted = false) {
  return `<p style="margin:0 0 16px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${muted ? "#6b6570" : "#161417"};">${html}</p>`;
}

export function small(text: string) {
  return `<p style="margin:0 0 16px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.45;color:#6b6570;">${escapeHtml(text)}</p>`;
}
