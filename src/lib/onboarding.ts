import type { TierId } from "./pricing";

const KEY = "bw_onboarding";

export type Gender = "male" | "female" | "rather_not_say";

export type OnboardingState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  gender: Gender | "";
  phoneVerified: boolean;
  emailVerified: boolean;
  emailCodeToken: string;
  emailCodeExp: number;
  tier: TierId | null;
  services: string[];
  areas: string[];
  location: { lat: number; lng: number; address: string; area: string } | null;
  reminders: {
    bookingSms: boolean;
    coinsAlerts: boolean;
    offers: boolean;
  };
  paymentMethod: "mpesa" | "card";
  mpesaPhone: string;
  paymentId: string | null;
  paymentRef: string | null;
  paymentStatus: "idle" | "pending" | "succeeded" | "failed";
  step: string;
};

export const DEFAULT_ONBOARDING: OnboardingState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  gender: "",
  phoneVerified: false,
  emailVerified: false,
  emailCodeToken: "",
  emailCodeExp: 0,
  tier: "intermediate",
  services: [],
  areas: [],
  location: null,
  reminders: {
    bookingSms: true,
    coinsAlerts: true,
    offers: false,
  },
  paymentMethod: "mpesa",
  mpesaPhone: "",
  paymentId: null,
  paymentRef: null,
  paymentStatus: "idle",
  step: "account",
};

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return { ...DEFAULT_ONBOARDING };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_ONBOARDING };
    return { ...DEFAULT_ONBOARDING, ...(JSON.parse(raw) as Partial<OnboardingState>) };
  } catch {
    return { ...DEFAULT_ONBOARDING };
  }
}

export function saveOnboarding(patch: Partial<OnboardingState>): OnboardingState {
  const next = { ...loadOnboarding(), ...patch };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearOnboarding() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}

/** Normalise Kenya local numbers to E.164 for Supabase Auth. */
export function toE164Kenya(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  if (input.trim().startsWith("+")) return input.trim();
  return `+${digits}`;
}

export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("254")
    ? `0${digits.slice(3)}`
    : digits.startsWith("0")
      ? digits
      : phone;
  if (local.length === 10) return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return phone;
}

export function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

export function renewalDate(from = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export function formatRenewal(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatRenewalShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
