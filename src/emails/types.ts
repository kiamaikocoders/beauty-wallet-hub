export type EmailName =
  | "welcome"
  | "verify"
  | "password-reset"
  | "plan-receipt"
  | "renewal"
  | "payment-failed"
  | "booking-confirmed"
  | "booking-reminder"
  | "booking-cancelled"
  | "rate-visit"
  | "top-up"
  | "low-balance"
  | "monthly-statement"
  | "plan-changed"
  | "gift-received"
  | "provider-application"
  | "provider-approved"
  | "provider-new-booking"
  | "provider-weekly-payout";

export type EmailPayload = {
  subject: string;
  html: string;
  text: string;
};

export type Row = { label: string; value: string };

export type TemplateInput = {
  firstName?: string;
  fullName?: string;
  email?: string;
  tier?: string;
  planPrice?: string;
  coins?: string;
  discount?: string;
  renewalDate?: string;
  ctaUrl?: string;
  code?: string;
  receiptId?: string;
  paidWith?: string;
  mpesaRef?: string;
  date?: string;
  coinsAdded?: string;
  rolledOver?: string;
  walletNow?: string;
  amount?: string;
  phone?: string;
  reason?: string;
  nextTry?: string;
  service?: string;
  provider?: string;
  stylist?: string;
  when?: string;
  coinsHeld?: string;
  pin?: string;
  cancelBy?: string;
  coinsReturned?: string;
  available?: string;
  message?: string;
  giftFrom?: string;
  claimBy?: string;
  company?: string;
  reference?: string;
  payout?: string;
  period?: string;
  completedVisits?: string;
  lateCancel?: string;
  till?: string;
  nowPlan?: string;
  nextPlan?: string;
  heroImage?: string;
  footerNote?: string;
};
