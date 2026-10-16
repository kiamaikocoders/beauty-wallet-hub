/** Member-facing SMS copy from Figma page 06 (SMS/Member + SMS/Member renewal failed). */
export const SMS_MEMBER = {
  planRenewed:
    "Beauty Wallet: Ksh 15,000 received for your Intermediate plan. 1,500 coins added plus 118 rolled over. Wallet: 1,618 coins.",
  topUp: "Beauty Wallet: 500 coins added (Ksh 5,000 by M-Pesa). Wallet: 1,986 coins.",
  bookingConfirmed:
    "Booked: Knotless Braids, Braid Bar Ngong Rd, Sat 17 Oct 10:00. 528 coins held. Arrival PIN 7306. Free cancellation until Fri 16 Oct 10:00.",
  bookingReminderSameDay:
    "Reminder: Silk Press & Trim at Crown Atelier today at 14:00. Arrival PIN 4821.",
  bookingCancelled:
    "Cancelled: Knotless Braids, Sat 17 Oct. No fee, 528 coins returned. Available: 1,520 coins.",
  renewalFailed:
    "Beauty Wallet: we couldn’t renew your Basic plan (Ksh 7,000). Your coins are safe. Pay at beautywallet.co.ke/pay or we’ll try again on Sun 11 Oct.",
  otp: (code: string) =>
    `${code} is your Beauty Wallet code. It expires in 10 minutes. Never share it, not even with our staff.`,
  renewalStillUnpaid:
    "Reminder: your Basic plan is still unpaid and new bookings are paused. We’ll try again on Sun 11 Oct, or pay now at beautywallet.co.ke/pay.",
} as const;

export const SMS_PROVIDER = {
  payoutSent:
    "Beauty Wallet: payout of Ksh 71,200 sent to your M-Pesa till ending 417 for 28 Sep to 4 Oct.",
  newBooking:
    "New booking: Amani W., Knotless Braids Medium, Sat 17 Oct 10:00 with Wanjiku. Your payout: Ksh 4,800.",
  cancelledByMember:
    "Cancelled by member: Amani W., Knotless Braids, Sat 17 Oct 10:00. The slot is open again.",
} as const;

export type SmsMemberKey = keyof typeof SMS_MEMBER;
