import { supabase } from "@/integrations/supabase/client";
import { duration, ksh, serviceCoins, type TierId } from "@/lib/pricing";

export const DEMO_PROVIDER_SLUG = "braid-bar-ngong-rd";

export type BookingStatus =
  "booked" | "arriving" | "in_progress" | "done" | "cancelled" | "no_show";

export type PortalService = {
  id: string;
  name: string;
  category: string;
  section: string | null;
  cash_ksh: number;
  minutes: number;
  active: boolean;
  sort: number;
  image_url?: string | null;
};

export type PortalBookingService = {
  id: string;
  name: string;
  minutes: number;
  cash_ksh: number;
  coins: number;
};

export type PortalBooking = {
  id: string;
  scheduled_at: string;
  status: BookingStatus;
  coins: number;
  cash_ksh: number;
  payout_ksh: number;
  addons: string[];
  created_at: string;
  member_name: string;
  member_tier: TierId;
  member_area: string | null;
  services: PortalBookingService[];
  stylist?: string;
};

export type PortalReview = {
  id: string;
  author_name: string;
  author_tier: TierId | null;
  rating: number;
  body: string | null;
  created_at: string;
};

export type PortalProvider = {
  id: string;
  slug: string;
  name: string;
  area: string;
  kind: string | null;
  class: TierId;
  payout_pct: number;
  payout_method: string | null;
  owner_name: string | null;
  rating: number | null;
  review_count: number;
  hours: { days: string; open: string; close: string }[];
  home_visits: boolean;
  about: string | null;
  kyc_docs: string[];
  verified: boolean;
};

export type PortalData = {
  provider: PortalProvider;
  services: PortalService[];
  bookings: PortalBooking[];
  reviews: PortalReview[];
};

const STYLIST_BY_MEMBER: Record<string, string> = {
  "Lilian Mwangi": "Achieng",
  "Joy Akinyi": "Wanjiku",
  "Sheila Otieno": "Wanjiku",
  "Ruth Njoroge": "Wanjiku",
  "Purity Wairimu": "Achieng",
  "Esther Kamau": "Achieng",
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  booked: "Booked",
  arriving: "Arriving",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const STATUS_TONE: Record<BookingStatus, string> = {
  booked: "bg-muted text-foreground",
  arriving: "bg-info-bg text-info",
  in_progress: "bg-warning-bg text-warning",
  done: "bg-success-bg text-success",
  cancelled: "bg-destructive-bg text-destructive",
  no_show: "bg-destructive-bg text-destructive",
};

export function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const hrs = Math.round(minutes / 60);
    return `${hrs} hr${hrs === 1 ? "" : "s"}`;
  }
  return duration(minutes);
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });
}

export function formatDayLong(iso = new Date().toISOString()) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  });
}

export function formatDayShort(iso = new Date().toISOString()) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

export function tierLabel(tier: TierId) {
  return tier === "basic" ? "Basic" : tier === "intermediate" ? "Intermediate" : "Premium";
}

export function isToday(iso: string) {
  const d = new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  return d === today;
}

export function todayBookings(bookings: PortalBooking[]) {
  return bookings.filter((b) => isToday(b.scheduled_at) && b.status !== "cancelled");
}

export function nextArrival(bookings: PortalBooking[]) {
  const now = Date.now();
  return (
    todayBookings(bookings)
      .filter((b) => ["booked", "arriving"].includes(b.status))
      .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
      .find((b) => +new Date(b.scheduled_at) >= now - 30 * 60_000) ?? null
  );
}

export function payoutToday(bookings: PortalBooking[]) {
  return todayBookings(bookings)
    .filter((b) => ["done", "in_progress", "no_show"].includes(b.status))
    .reduce((t, b) => t + b.payout_ksh, 0);
}

export function payoutWeek(bookings: PortalBooking[]) {
  return bookings
    .filter((b) => ["done", "in_progress", "no_show"].includes(b.status))
    .reduce((t, b) => t + b.payout_ksh, 0);
}

export function serviceLabel(b: PortalBooking) {
  return b.services.map((s) => s.name).join(", ") || "Service";
}

export function minutesFor(b: PortalBooking) {
  return b.services.reduce((t, s) => t + s.minutes, 0);
}

export function withStylist(b: PortalBooking): PortalBooking {
  return { ...b, stylist: b.stylist ?? STYLIST_BY_MEMBER[b.member_name] ?? "Wanjiku" };
}

export function coinPrices(cashKsh: number) {
  return {
    basic: serviceCoins(cashKsh, "basic"),
    intermediate: serviceCoins(cashKsh, "intermediate"),
    premium: serviceCoins(cashKsh, "premium"),
  };
}

export function payoutFor(cashKsh: number, pct: number) {
  return Math.round(cashKsh * pct);
}

export type CheckInResult =
  | {
      ok: true;
      booking_id: string;
      member_name: string;
      member_tier: TierId;
      services: string;
      minutes: number;
      scheduled_at: string;
      payout_ksh: number;
      status: BookingStatus;
    }
  | {
      ok: false;
      error: "wrong" | "expired" | "invalid" | "provider";
      member_name?: string | undefined;
      pin_time?: string | undefined;
    };

export type StartVisitResult = {
  ok: true;
  booking_id: string;
  member_name: string;
  services: string;
  payout_ksh: number;
  checked_in_at: string;
};

async function fetchPortal(slug: string): Promise<PortalData | null> {
  const { data, error } = await supabase.rpc(
    "demo_provider_portal" as never,
    {
      p_slug: slug,
    } as never,
  );
  if (error || !data) return null;
  const raw = data as PortalData;
  return {
    ...raw,
    provider: {
      ...raw.provider,
      hours: Array.isArray(raw.provider.hours) ? raw.provider.hours : [],
    },
    bookings: (raw.bookings ?? []).map(withStylist),
    services: raw.services ?? [],
    reviews: raw.reviews ?? [],
  };
}

export async function loadProviderPortal(slug = DEMO_PROVIDER_SLUG): Promise<PortalData> {
  const data = await fetchPortal(slug);
  if (data) return data;
  // Hard fallback if RPC unavailable — still show a seeded owner shell.
  return {
    provider: {
      id: "demo",
      slug: DEMO_PROVIDER_SLUG,
      name: "Braid Bar Ngong Rd",
      area: "Kilimani",
      kind: "Braiding salon",
      class: "intermediate",
      payout_pct: 0.8,
      payout_method: "M-Pesa till ending 417",
      owner_name: "Mercy Wambui",
      rating: 4.8,
      review_count: 231,
      hours: [
        { days: "Mon – Fri", open: "8:00", close: "19:00" },
        { days: "Saturday", open: "8:00", close: "19:00" },
        { days: "Sunday", open: "10:00", close: "16:00" },
      ],
      home_visits: false,
      about: "Knotless braids, cornrows and protective styles.",
      kyc_docs: ["Business permit", "KRA PIN"],
      verified: false,
    },
    services: [],
    bookings: [],
    reviews: [],
  };
}

export async function checkInPin(pin: string, slug = DEMO_PROVIDER_SLUG): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc(
    "provider_check_in" as never,
    {
      p_pin: pin,
      p_provider_slug: slug,
    } as never,
  );
  if (error) return { ok: false, error: "wrong" };
  return data as CheckInResult;
}

export async function startVisit(
  bookingId: string,
  slug = DEMO_PROVIDER_SLUG,
): Promise<StartVisitResult> {
  const { data, error } = await supabase.rpc(
    "provider_start_visit" as never,
    {
      p_booking_id: bookingId,
      p_provider_slug: slug,
    } as never,
  );
  if (error) throw error;
  return data as StartVisitResult;
}

export async function markNoShow(
  bookingId: string,
  slug = DEMO_PROVIDER_SLUG,
): Promise<{ ok: true; payout_ksh: number }> {
  const { data, error } = await supabase.rpc(
    "provider_mark_no_show" as never,
    {
      p_booking_id: bookingId,
      p_provider_slug: slug,
    } as never,
  );
  if (error) throw error;
  return data as { ok: true; payout_ksh: number };
}

/** Demo earnings chart + history (no payouts table yet). */
export const DEMO_PAYOUTS = [
  {
    label: "8 Sep",
    short: "47.2k",
    amount: 47200,
    visits: 19,
    range: "1 to 7 Sep",
    status: "Paid",
  },
  {
    label: "15 Sep",
    short: "49.6k",
    amount: 49600,
    visits: 21,
    range: "7 to 13 Sep",
    status: "Paid",
  },
  {
    label: "22 Sep",
    short: "58.4k",
    amount: 58400,
    visits: 24,
    range: "14 to 20 Sep",
    status: "Paid",
  },
  {
    label: "29 Sep",
    short: "66.8k",
    amount: 66800,
    visits: 27,
    range: "21 to 27 Sep",
    status: "Paid",
  },
  {
    label: "6 Oct",
    short: "71.2k",
    amount: 71200,
    visits: 29,
    range: "28 Sep to 4 Oct",
    status: "Paid",
  },
  {
    label: "13 Oct",
    short: "62.4k",
    amount: 62400,
    visits: 23,
    range: "5 to 11 Oct",
    status: "Pending",
  },
] as const;

export const DEMO_TEAM = [
  {
    name: "Wanjiku Njeri",
    role: "Senior braider",
    works: "Mon to Sat",
    rating: 4.9,
    access: "Active",
  },
  { name: "Achieng Otieno", role: "Braider", works: "Tue to Sun", rating: 4.7, access: "Active" },
  {
    name: "Mercy Wambui",
    role: "Owner",
    works: "Not bookable",
    rating: null,
    access: "Full access",
  },
  {
    name: "Brian Okello",
    role: "Reception",
    works: "Sat and Sun",
    rating: null,
    access: "Invite sent",
  },
] as const;

export const DEMO_TIME_OFF = [
  { who: "Achieng", when: "Mon 12 Oct" },
  { who: "Wanjiku", when: "26 to 30 Oct" },
  { who: "Whole studio", when: "Sun 1 Nov" },
] as const;

export function openHoursLabel(hours: PortalProvider["hours"]) {
  const sat = hours.find((h) => /sat/i.test(h.days));
  if (sat) return `open ${sat.open} to ${sat.close}`;
  const first = hours[0];
  if (!first || !first.open) return "hours not set";
  return `open ${first.open} to ${first.close}`;
}

export { ksh };
