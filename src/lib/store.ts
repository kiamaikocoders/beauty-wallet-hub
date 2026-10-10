import { useSyncExternalStore } from "react";
import { DEFAULT_RULES, type CoinRules, type TierId, bookingCoins, vendorPayout } from "./pricing";

export interface Service {
  id: string; name: string; category: string; vendor: string; area: string;
  cashKsh: number; minutes: number; tier: TierId;
}
export type BookingStatus = "upcoming" | "in_service" | "completed" | "disputed";
export interface Booking {
  id: string; customer: string; serviceIds: string[]; vendor: string; when: string;
  coins: number; cashKsh: number; payoutKsh: number; pin: string; status: BookingStatus; addOns: string[];
}
export interface Vendor {
  id: string; name: string; area: string; owner: string; cls: TierId; verified: boolean;
  status: "pending" | "active" | "rejected"; kyc: string[]; payoutMethod: string; applied: string;
}

export const SERVICES: Service[] = [
  { id: "s1", name: "Classic Cut & Line-up", category: "Barbering", vendor: "Kinyozi Republic", area: "Westlands", cashKsh: 800, minutes: 40, tier: "basic" },
  { id: "s2", name: "Beard Sculpt & Hot Towel", category: "Barbering", vendor: "Kinyozi Republic", area: "Westlands", cashKsh: 600, minutes: 30, tier: "basic" },
  { id: "s3", name: "Gel Manicure", category: "Nails", vendor: "Polished Kilimani", area: "Kilimani", cashKsh: 1500, minutes: 50, tier: "basic" },
  { id: "s4", name: "Silk Press & Trim", category: "Hair", vendor: "Crown Atelier", area: "Kilimani", cashKsh: 3500, minutes: 120, tier: "intermediate" },
  { id: "s5", name: "Deep Cleanse Facial", category: "Skin", vendor: "Crown Atelier", area: "Kilimani", cashKsh: 4000, minutes: 60, tier: "intermediate" },
  { id: "s6", name: "Knotless Braids (Medium)", category: "Hair", vendor: "Braid Bar Ngong Rd", area: "Kilimani", cashKsh: 6000, minutes: 300, tier: "intermediate" },
  { id: "s7", name: "Signature Hydra Facial", category: "Skin", vendor: "The Karen Retreat", area: "Karen", cashKsh: 9000, minutes: 75, tier: "premium" },
  { id: "s8", name: "Hot Stone Massage (90m)", category: "Wellness", vendor: "The Karen Retreat", area: "Karen", cashKsh: 8500, minutes: 90, tier: "premium" },
  { id: "s9", name: "At-Home Groom Package", category: "Barbering", vendor: "Gentry Mobile", area: "Westlands", cashKsh: 5500, minutes: 80, tier: "premium" },
];

export const ADDONS = [
  { id: "a1", label: "Priority slot (skip queue)", coins: 30 },
  { id: "a2", label: "Complimentary drink & snack", coins: 15 },
  { id: "a3", label: "Home / office visit", coins: 120 },
];

const pin = () => String(Math.floor(1000 + Math.random() * 9000));

interface State {
  rules: CoinRules;
  user: { name: string; tier: TierId; available: number; escrow: number };
  bookings: Booking[];
  vendors: Vendor[];
}

let state: State = {
  rules: DEFAULT_RULES,
  user: { name: "Amani Wanjiru", tier: "intermediate", available: 520, escrow: 0 },
  bookings: [
    { id: "b1", customer: "Brian Otieno", serviceIds: ["s1", "s2"], vendor: "Kinyozi Republic", when: "10:00", coins: 120, cashKsh: 1400, payoutKsh: 1190, pin: "4821", status: "upcoming", addOns: [] },
    { id: "b2", customer: "Grace Muthoni", serviceIds: ["s1"], vendor: "Kinyozi Republic", when: "11:30", coins: 80, cashKsh: 800, payoutKsh: 680, pin: "3307", status: "upcoming", addOns: ["Priority slot (skip queue)"] },
    { id: "b3", customer: "Kevin Kamau", serviceIds: ["s2"], vendor: "Kinyozi Republic", when: "09:00", coins: 60, cashKsh: 600, payoutKsh: 510, pin: "9150", status: "in_service", addOns: [] },
    { id: "b4", customer: "Faith Njeri", serviceIds: ["s1"], vendor: "Kinyozi Republic", when: "08:15", coins: 80, cashKsh: 800, payoutKsh: 680, pin: "1188", status: "completed", addOns: [] },
    { id: "b5", customer: "Liam Odhiambo", serviceIds: ["s5"], vendor: "Crown Atelier", when: "Yesterday", coins: 352, cashKsh: 4000, payoutKsh: 3400, pin: "7741", status: "disputed", addOns: [] },
  ],
  vendors: [
    { id: "v1", name: "Kinyozi Republic", area: "Westlands", owner: "Peter Mwangi", cls: "basic", verified: true, status: "active", kyc: ["Business permit", "KRA PIN"], payoutMethod: "M-Pesa Till 552190", applied: "Jul 2" },
    { id: "v2", name: "Crown Atelier", area: "Kilimani", owner: "Wambui Kariuki", cls: "intermediate", verified: true, status: "active", kyc: ["Business permit", "KRA PIN", "Health cert"], payoutMethod: "Equity Bank ••4410", applied: "Jun 18" },
    { id: "v3", name: "The Karen Retreat", area: "Karen", owner: "Aisha Hassan", cls: "premium", verified: true, status: "active", kyc: ["Business permit", "KRA PIN", "Health cert"], payoutMethod: "KCB ••9021", applied: "May 30" },
    { id: "v4", name: "Fade Lab Lavington", area: "Lavington", owner: "Dennis Ochieng", cls: "basic", verified: false, status: "pending", kyc: ["Business permit", "KRA PIN"], payoutMethod: "M-Pesa 0712 ••• 448", applied: "Oct 8" },
    { id: "v5", name: "Lumière Skin Studio", area: "Westlands", owner: "Nadia Patel", cls: "intermediate", verified: false, status: "pending", kyc: ["Business permit", "Health cert"], payoutMethod: "NCBA ••3302", applied: "Oct 9" },
  ],
};

const listeners = new Set<() => void>();
const set = (fn: (s: State) => State) => { state = fn(state); listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

export const actions = {
  setTier: (tier: TierId) => set((s) => ({ ...s, user: { ...s.user, tier } })),
  book(serviceIds: string[], addOnIds: string[], when: string): Booking | string {
    const items = SERVICES.filter((x) => serviceIds.includes(x.id));
    const adds = ADDONS.filter((a) => addOnIds.includes(a.id));
    const coins = bookingCoins(items, adds.reduce((t, a) => t + a.coins, 0), state.user.tier, state.rules);
    if (coins > state.user.available) return "Not enough coins";
    const cash = items.reduce((t, i) => t + i.cashKsh, 0);
    const b: Booking = {
      id: "b" + Date.now(), customer: state.user.name, serviceIds, vendor: items[0]?.vendor ?? "", when,
      coins, cashKsh: cash, payoutKsh: vendorPayout(cash, state.rules), pin: pin(), status: "upcoming", addOns: adds.map((a) => a.label),
    };
    set((s) => ({ ...s, bookings: [b, ...s.bookings], user: { ...s.user, available: s.user.available - coins, escrow: s.user.escrow + coins } }));
    return b;
  },
  refreshPin: (id: string) => set((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, pin: pin() } : b)) })),
  start: (id: string) => set((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "in_service" } : b)) })),
  complete: (id: string) => set((s) => {
    const b = s.bookings.find((x) => x.id === id);
    const mine = b && b.customer === s.user.name;
    return {
      ...s,
      bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: "completed" } : x)),
      user: mine ? { ...s.user, escrow: Math.max(0, s.user.escrow - b!.coins) } : s.user,
    };
  }),
  resolveDispute: (id: string, refund: boolean) => set((s) => ({
    ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "completed", payoutKsh: refund ? 0 : b.payoutKsh } : b)),
  })),
  updateVendor: (id: string, patch: Partial<Vendor>) => set((s) => ({ ...s, vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  addVendor: (v: Omit<Vendor, "id" | "status" | "verified" | "applied">) => set((s) => ({
    ...s, vendors: [...s.vendors, { ...v, id: "v" + Date.now(), status: "pending", verified: false, applied: "Today" }],
  })),
  setRules: (rules: CoinRules) => set((s) => ({ ...s, rules })),
};
