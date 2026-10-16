import { emailAsset, emailShell, p, pHtml, small, summaryBox } from "./shell";
import type { EmailName, EmailPayload, TemplateInput } from "./types";

const demo: Required<
  Pick<
    TemplateInput,
    | "firstName"
    | "fullName"
    | "email"
    | "tier"
    | "planPrice"
    | "coins"
    | "discount"
    | "renewalDate"
    | "ctaUrl"
    | "code"
    | "receiptId"
    | "paidWith"
    | "mpesaRef"
    | "date"
    | "coinsAdded"
    | "rolledOver"
    | "walletNow"
    | "amount"
    | "phone"
    | "reason"
    | "nextTry"
    | "service"
    | "provider"
    | "stylist"
    | "when"
    | "coinsHeld"
    | "pin"
    | "cancelBy"
    | "coinsReturned"
    | "available"
    | "message"
    | "giftFrom"
    | "claimBy"
    | "company"
    | "reference"
    | "payout"
    | "period"
    | "completedVisits"
    | "lateCancel"
    | "till"
    | "nowPlan"
    | "nextPlan"
  >
> = {
  firstName: "Amani",
  fullName: "Amani Wanjiru",
  email: "amani.wanjiru@gmail.com",
  tier: "Intermediate",
  planPrice: "Ksh 15,000",
  coins: "1,500",
  discount: "12%",
  renewalDate: "Sat 1 Aug",
  ctaUrl: "https://beautywallet.co.ke/app",
  code: "731 904",
  receiptId: "BW-R-104382",
  paidWith: "M-Pesa 0712 345 678",
  mpesaRef: "SJ41K7QX2P",
  date: "Thu 1 Oct, 06:00",
  coinsAdded: "1,500",
  rolledOver: "118",
  walletNow: "1,618",
  amount: "Ksh 15,000",
  phone: "0712 345 678",
  reason: "M-Pesa request not approved",
  nextTry: "Sun 11 Oct",
  service: "Knotless Braids, Medium",
  provider: "Braid Bar Ngong Rd",
  stylist: "Wanjiku Kariuki",
  when: "Sat 17 Oct, 10:00",
  coinsHeld: "528",
  pin: "7306",
  cancelBy: "Fri 16 Oct, 10:00",
  coinsReturned: "+528",
  available: "1,520",
  message: "Happy birthday! Go treat yourself. Amani",
  giftFrom: "Amani Wanjiru",
  claimBy: "Mon 9 Nov",
  company: "Fade District",
  reference: "BW-PRV-2061",
  payout: "Ksh 4,800",
  period: "Mon 28 Sep to Sun 4 Oct",
  completedVisits: "Ksh 68,800",
  lateCancel: "Ksh 2,400",
  till: "417",
  nowPlan: "Basic · Ksh 7,000 · 700 coins",
  nextPlan: "Intermediate · Ksh 15,000",
};

function merge(input?: TemplateInput): typeof demo & TemplateInput {
  return { ...demo, ...input };
}

function textFrom(parts: string[]) {
  return parts.filter(Boolean).join("\n\n");
}

export const EMAIL_NAMES: EmailName[] = [
  "welcome",
  "verify",
  "password-reset",
  "plan-receipt",
  "renewal",
  "payment-failed",
  "booking-confirmed",
  "booking-reminder",
  "booking-cancelled",
  "rate-visit",
  "top-up",
  "low-balance",
  "monthly-statement",
  "plan-changed",
  "gift-received",
  "provider-application",
  "provider-approved",
  "provider-new-booking",
  "provider-weekly-payout",
];

export function renderEmail(name: EmailName, input?: TemplateInput): EmailPayload {
  const d = merge(input);
  const hero = d.heroImage ?? emailAsset("/images/emails/welcome-hero.jpg");

  switch (name) {
    case "welcome":
      return {
        subject: `Welcome to Beauty Wallet, ${d.firstName}`,
        html: emailShell({
          eyebrow: "WELCOME",
          title: `Your wallet is ready, ${d.firstName}`,
          heroImage: hero,
          bodyHtml:
            p(
              `Your ${d.tier} plan is active. We added ${d.coins} coins to your wallet, and every booking costs you ${d.discount} less than the cash price.`,
            ) +
            summaryBox([
              { label: "Plan", value: `${d.tier} · ${d.planPrice} a month` },
              { label: "Coins added", value: d.coins },
              { label: "Your discount", value: `${d.discount} off every service` },
              { label: "Next renewal", value: `${d.renewalDate} by M-Pesa` },
            ]),
          cta: { label: "Book your first visit", href: d.ctaUrl },
          afterCtaHtml: small(
            "Use your coins at any Basic or Intermediate provider. Premium providers add a 10% unlock fee in coins.",
          ),
        }),
        text: textFrom([
          `Your wallet is ready, ${d.firstName}`,
          `Your ${d.tier} plan is active. We added ${d.coins} coins.`,
          d.ctaUrl,
        ]),
      };

    case "verify":
      return {
        subject: "Confirm your email address",
        html: emailShell({
          title: "Confirm your email",
          bodyHtml:
            p(`Tap the button to confirm ${d.email} for your Beauty Wallet account.`) +
            pHtml(
              `<span style="font-family:Georgia,serif;font-size:32px;letter-spacing:4px;color:#161417;">${d.code}</span>`,
            ) +
            small("Or enter this code in the app. It expires in 30 minutes."),
          cta: { label: "Confirm email", href: d.ctaUrl },
          afterCtaHtml: small("Didn’t sign up? You can ignore this email."),
        }),
        text: textFrom([`Confirm ${d.email}`, `Code: ${d.code}`, d.ctaUrl]),
      };

    case "password-reset":
      return {
        subject: "Reset your password",
        html: emailShell({
          title: "Reset your password",
          bodyHtml: p(`We got a request to reset the password for ${d.email}.`),
          cta: { label: "Choose a new password", href: d.ctaUrl },
          afterCtaHtml: small(
            "This link expires in 30 minutes. If you didn’t ask for this, ignore this email and your password stays the same.",
          ),
        }),
        text: textFrom(["Reset your password", d.ctaUrl]),
      };

    case "plan-receipt":
      return {
        subject: `Receipt: October plan, ${d.amount}`,
        html: emailShell({
          eyebrow: "RECEIPT",
          title: "Your October coins are in",
          bodyHtml:
            small(d.receiptId) +
            p(
              `Thanks, ${d.firstName}. Your ${d.tier} plan renewed and your wallet is topped up for the month.`,
            ) +
            summaryBox([
              { label: `${d.tier} plan, October`, value: d.amount },
              { label: "Paid with", value: d.paidWith },
              { label: "M-Pesa reference", value: d.mpesaRef },
              { label: "Date", value: d.date },
              { label: "Coins added", value: d.coinsAdded },
              { label: "Rolled over from September", value: d.rolledOver },
              { label: "Wallet now", value: `${d.walletNow} coins` },
            ]),
          cta: { label: "Open wallet", href: d.ctaUrl },
          afterCtaHtml: small(
            `The ${d.rolledOver} rolled-over coins are used first and expire on Sat 31 Oct.`,
          ),
        }),
        text: textFrom([`Receipt ${d.receiptId}`, `${d.amount} paid`, `Wallet: ${d.walletNow}`]),
      };

    case "renewal":
      return {
        subject: `Your plan renews on ${d.renewalDate}`,
        html: emailShell({
          eyebrow: "RENEWAL IN 3 DAYS",
          title: "Your plan renews on Sunday",
          bodyHtml:
            p(
              `On ${d.renewalDate} we’ll charge ${d.amount} to your M-Pesa and add ${d.coins} fresh coins to your wallet.`,
            ) +
            summaryBox([
              { label: "Plan", value: d.tier },
              { label: "Amount", value: d.amount },
              { label: "Pay with", value: `M-Pesa ${d.phone}` },
              { label: "Charge date", value: d.renewalDate },
            ]) +
            small(
              "Unused coins: 10% roll over for one month. The rest expire on Sat 31 Oct at midnight, so this is a good week to book.",
            ),
          cta: { label: "Book before 31 Oct", href: d.ctaUrl },
          afterCtaHtml: small("Change or pause my plan"),
        }),
        text: textFrom([`Plan renews ${d.renewalDate}`, `${d.amount} · ${d.tier}`]),
      };

    case "payment-failed":
      return {
        subject: "We couldn’t renew your plan",
        html: emailShell({
          eyebrow: "ACTION NEEDED",
          title: "Your renewal didn’t go through",
          bodyHtml:
            p(
              `We tried to charge ${d.amount} to M-Pesa ${d.phone} this morning, but the request wasn’t approved on your phone.`,
            ) +
            p("Your coins are safe. New bookings are paused until the payment goes through.") +
            summaryBox([
              { label: "Plan", value: `${d.tier} · ${d.amount}` },
              { label: "Tried on", value: d.date },
              { label: "Reason", value: d.reason },
              { label: "Next automatic try", value: d.nextTry },
            ]),
          cta: { label: `Pay ${d.amount} now`, href: d.ctaUrl },
          afterCtaHtml: small("Prefer a card? Add one in Wallet, then Payment method."),
        }),
        text: textFrom(["Renewal failed", `Pay ${d.amount}`, d.ctaUrl]),
      };

    case "booking-confirmed":
      return {
        subject: `Booked: ${d.service}, ${d.when}`,
        html: emailShell({
          eyebrow: "BOOKING CONFIRMED",
          title: `See you Saturday, ${d.firstName}`,
          bodyHtml:
            summaryBox([
              { label: "Service", value: d.service },
              { label: "Provider", value: d.provider },
              { label: "Stylist", value: d.stylist },
              { label: "When", value: `${d.when} · about 5 hours` },
              { label: "Coins held", value: d.coinsHeld },
              { label: "Arrival PIN", value: d.pin },
            ]) +
            small(
              "Show your arrival PIN at the front desk. Your coins stay on hold and only go to the provider once your visit starts.",
            ),
          cta: { label: "View booking", href: d.ctaUrl },
          afterCtaHtml: small(
            `Free cancellation until ${d.cancelBy}. After that, half the held coins go to the provider.`,
          ),
        }),
        text: textFrom([`Booked: ${d.service}`, d.when, `PIN ${d.pin}`]),
      };

    case "booking-reminder":
      return {
        subject: `Tomorrow at 10:00: ${d.service} at ${d.provider}`,
        html: emailShell({
          eyebrow: "REMINDER",
          title: "Your visit is tomorrow",
          bodyHtml:
            summaryBox([
              { label: "When", value: d.when },
              { label: "Where", value: d.provider },
              { label: "Stylist", value: d.stylist },
              { label: "Arrival PIN", value: d.pin },
            ]) +
            p(
              "Knotless braids take about 5 hours. Arrive 10 minutes early and bring your phone for the PIN.",
            ),
          cta: { label: "Get directions", href: d.ctaUrl },
          afterCtaHtml: small(
            `Free cancellation has ended. If you cancel now or don’t arrive within 20 minutes, 264 of your ${d.coinsHeld} held coins go to ${d.provider}.`,
          ),
        }),
        text: textFrom(["Visit tomorrow", d.when, `PIN ${d.pin}`]),
      };

    case "booking-cancelled":
      return {
        subject: `Cancelled: ${d.service}, Sat 17 Oct`,
        html: emailShell({
          eyebrow: "BOOKING CANCELLED",
          title: "Cancelled, and your coins are back",
          bodyHtml:
            p(`You cancelled before ${d.cancelBy}, so there’s no fee.`) +
            summaryBox([
              { label: "Service", value: d.service },
              { label: "Provider", value: d.provider },
              { label: "Was booked for", value: d.when },
              { label: "Coins returned", value: d.coinsReturned },
              { label: "Available now", value: `${d.available} coins` },
            ]),
          cta: { label: "Book another time", href: d.ctaUrl },
        }),
        text: textFrom(["Booking cancelled", `${d.coinsReturned} coins returned`]),
      };

    case "rate-visit":
      return {
        subject: `How was Brow Shape & Tint at Glow Studio?`,
        html: emailShell({
          eyebrow: "RATE YOUR VISIT",
          title: `How was your visit, ${d.firstName}?`,
          bodyHtml: p(
            "Brow Shape & Tint at Glow Studio Lavington, today at 15:00. Your rating helps other members choose, and helps the studio improve.",
          ),
          cta: { label: "Rate your visit", href: d.ctaUrl },
          afterCtaHtml: small("Something went wrong? Report a problem"),
        }),
        text: textFrom(["Rate your visit", d.ctaUrl]),
      };

    case "top-up":
      return {
        subject: `Receipt: 500 coins, Ksh 5,000`,
        html: emailShell({
          eyebrow: "RECEIPT",
          title: "500 coins added",
          bodyHtml:
            small("RECEIPT BW-T-20917") +
            p("Your top-up went through and the coins are ready to use.") +
            summaryBox([
              { label: "Coin pack", value: "500 coins" },
              { label: "Price", value: "Ksh 5,000" },
              { label: "Paid with", value: d.paidWith },
              { label: "M-Pesa reference", value: "SJ58N3TR1K" },
              { label: "Wallet now", value: `${d.walletNow} coins` },
            ]),
          cta: { label: "Book a visit", href: d.ctaUrl },
          afterCtaHtml: small("Your plan discount still applies when you spend top-up coins."),
        }),
        text: textFrom(["500 coins added", `Wallet: ${d.walletNow}`]),
      };

    case "low-balance":
      return {
        subject: "You have 84 coins left",
        html: emailShell({
          eyebrow: "LOW BALANCE",
          title: `Running low, ${d.firstName === "Amani" ? "Joy" : d.firstName}`,
          bodyHtml:
            p(
              `You have 84 coins left until your plan renews on ${d.renewalDate}. That’s not enough for most services.`,
            ) +
            summaryBox([
              { label: "100 coins", value: "Ksh 1,000" },
              { label: "250 coins", value: "Ksh 2,500" },
              { label: "500 coins", value: "Ksh 5,000" },
            ]),
          cta: { label: "Top up coins", href: d.ctaUrl },
          afterCtaHtml: small("Or move to Intermediate: 1,500 coins a month and 12% off"),
        }),
        text: textFrom(["Running low", "Top up at beautywallet.co.ke"]),
      };

    case "monthly-statement":
      return {
        subject: "Your September statement",
        html: emailShell({
          eyebrow: "MONTHLY STATEMENT",
          title: "September at a glance",
          bodyHtml:
            summaryBox([
              { label: "Plan coins added", value: "1,500" },
              { label: "Spent on 2 visits", value: "−320" },
              { label: "Unused at month end", value: "1,180" },
              { label: "Rolled into October (10%)", value: "+118" },
              { label: "Expired", value: "1,062" },
            ]) +
            small(
              "Rolled-over coins are spent first and last until Sat 31 Oct. Booking earlier in the month gets the most out of your plan.",
            ),
          cta: { label: "Download statement (PDF)", href: d.ctaUrl },
        }),
        text: textFrom(["September statement", "1,500 coins added · −320 spent"]),
      };

    case "plan-changed":
      return {
        subject: `Your plan moves to Intermediate on ${d.renewalDate}`,
        html: emailShell({
          eyebrow: "PLAN CHANGE",
          title: "You’re moving up to Intermediate",
          bodyHtml:
            p("You keep Basic until Sat 31 Oct. From your next renewal, here’s what changes:") +
            summaryBox([
              { label: "Now", value: d.nowPlan },
              { label: `From ${d.renewalDate}`, value: d.nextPlan },
              { label: "Coins each month", value: "1,500" },
              { label: "Discount", value: "12% off every service" },
              { label: "Intermediate providers", value: "No unlock fee" },
            ]),
          cta: { label: "View my plan", href: d.ctaUrl },
          afterCtaHtml: small(`Changed your mind? Switch back any time before ${d.renewalDate}.`),
        }),
        text: textFrom(["Plan change", d.nextPlan]),
      };

    case "gift-received":
      return {
        subject: `${d.giftFrom.split(" ")[0]} sent you ${d.coins} Beauty Wallet coins`,
        html: emailShell({
          eyebrow: "A GIFT FOR YOU",
          title: `You’ve got a gift, ${d.firstName === "Amani" ? "Nadia" : d.firstName}`,
          bodyHtml:
            p(
              `${d.giftFrom} gave you a month of Intermediate: ${d.coins} coins to spend on hair, nails, spa and more across Nairobi.`,
            ) +
            pHtml(`<em style="font-family:Georgia,serif;font-size:18px;">“${d.message}”</em>`) +
            summaryBox([
              { label: "Gift", value: `${d.coins} coins` },
              { label: "From", value: d.giftFrom },
              { label: "Claim by", value: d.claimBy },
            ]),
          cta: { label: "Claim your coins", href: d.ctaUrl },
          afterCtaHtml: small(
            "Claiming creates a free Beauty Wallet account. You won’t be charged.",
          ),
        }),
        text: textFrom([`Gift from ${d.giftFrom}`, `${d.coins} coins`, d.ctaUrl]),
      };

    case "provider-application":
      return {
        subject: `We got your application, ${d.company}`,
        html: emailShell({
          providerTone: true,
          eyebrow: "APPLICATION RECEIVED",
          title: `Thanks, ${d.firstName === "Amani" ? "Peter" : d.firstName}. Here’s what happens next`,
          bodyHtml:
            small(`Reference ${d.reference}`) +
            summaryBox([
              { label: "1. Intro call", value: "Within 2 working days" },
              { label: "2. Studio visit", value: "Hygiene and quality" },
              { label: "3. Go live", value: "Class and payout agreed" },
            ]) +
            p(
              "We’ll call you on 0733 204 615 to book the studio visit. Have your business permit, KRA PIN certificate and ID ready.",
            ),
          cta: { label: "View application", href: d.ctaUrl },
        }),
        text: textFrom([`Application received · ${d.reference}`]),
      };

    case "provider-approved":
      return {
        subject: "You’re live on Beauty Wallet",
        html: emailShell({
          providerTone: true,
          eyebrow: "APPROVED",
          title: `Welcome aboard, ${d.company}`,
          bodyHtml:
            p("Members can find and book you from today. Here’s how you get paid:") +
            summaryBox([
              { label: "Class", value: "Basic" },
              { label: "Your payout", value: "85% of your cash price" },
              { label: "Payouts", value: "Every Tuesday to your M-Pesa till" },
              { label: "Class review", value: "Every quarter" },
            ]) +
            small(
              "Members pay in coins; you get paid in shillings. You never handle coins, and every visit starts with the member’s arrival PIN.",
            ),
          cta: { label: "Open provider portal", href: d.ctaUrl },
        }),
        text: textFrom([`${d.company} is live`, "Open provider portal"]),
      };

    case "provider-new-booking":
      return {
        subject: `New booking: ${d.service}, ${d.when}`,
        html: emailShell({
          providerTone: true,
          eyebrow: "NEW BOOKING",
          title: `New booking from ${d.firstName}`,
          bodyHtml:
            summaryBox([
              { label: "Member", value: `${d.fullName} · ${d.tier}` },
              { label: "Service", value: d.service },
              { label: "When", value: d.when },
              { label: "Stylist", value: d.stylist },
              { label: "Your payout", value: d.payout },
            ]) + small("Ask for Amani’s 4-digit arrival PIN at check-in to start the visit."),
          cta: { label: "Open booking", href: d.ctaUrl },
          afterCtaHtml: small(
            `If ${d.firstName} cancels after ${d.cancelBy}, or doesn’t arrive within 20 minutes, you get Ksh 2,400.`,
          ),
        }),
        text: textFrom([`New booking · ${d.service}`, d.when, d.payout]),
      };

    case "provider-weekly-payout":
      return {
        subject: "Payout sent: Ksh 71,200",
        html: emailShell({
          providerTone: true,
          eyebrow: "WEEKLY PAYOUT",
          title: "Your payout is on its way",
          bodyHtml:
            p(d.period) +
            summaryBox([
              { label: "Completed visits (29)", value: d.completedVisits },
              { label: "Late cancellation (1)", value: d.lateCancel },
              { label: `Paid to M-Pesa till ending ${d.till}`, value: "Ksh 71,200" },
              { label: "Sent", value: "Tue 6 Oct, 10:30" },
            ]),
          cta: { label: "Download statement", href: d.ctaUrl },
          afterCtaHtml: small("Payouts for this week arrive on Tue 13 Oct."),
        }),
        text: textFrom(["Payout Ksh 71,200", d.period]),
      };
  }
}
