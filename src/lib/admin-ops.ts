import { supabase } from "@/integrations/supabase/client";
import type { TierId } from "@/lib/pricing";

export type OpsQueueItem = {
  slug: string;
  name: string;
  area: string;
  kind: string | null;
  status: string;
  appliedAt: string;
  ref: string | null;
};

export type OpsBooking = {
  id: string;
  when: string;
  status: string;
  coins: number;
  member: string;
  plan: TierId;
  provider: string;
  service: string;
  bucket: "today" | "upcoming" | "past" | "cancelled" | "no_show";
};

export type OpsDispute = {
  code: string;
  status: string;
  reason: string;
  memberMessage: string | null;
  providerMessage: string | null;
  when: string;
  member: string;
  provider: string;
  coins: number;
  service: string;
};

export type OpsBoard = {
  applications: number;
  liveProviders: number;
  members: number;
  bookingsToday: number;
  openDisputes: number;
  missingPins: number;
  coinsOutstanding: number;
  coinsOnHold: number;
  visits: { day: string; count: number }[];
  queue: OpsQueueItem[];
  bookings: OpsBooking[];
  disputes: OpsDispute[];
  audit: { action: string; at: string; detail: string }[];
};

export type ProviderFile = {
  slug: string;
  name: string;
  area: string;
  kind: string | null;
  about: string | null;
  class: TierId;
  payoutPct: number;
  status: string;
  verified: boolean;
  homeVisits: boolean;
  ownerName: string | null;
  kycDocs: string[];
  payoutMethod: string | null;
  ref: string | null;
  appliedAt: string;
  reviewNote: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  services: { name: string; minutes: number; cashKsh: number; active: boolean }[];
};

export type ApplicationStatus = {
  ref: string;
  name: string;
  area: string;
  kind: string | null;
  status: "applied" | "live" | "paused" | "rejected";
  appliedAt: string;
  reviewNote: string | null;
  address: string | null;
  slug: string;
  visitAt: string | null;
  visitNote: string | null;
};

export type MyProvider = {
  slug: string;
  name: string;
  area: string;
  kind: string | null;
  status: "applied" | "live" | "paused" | "rejected";
  ref: string | null;
  reviewNote: string | null;
};

export type MemberFile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  area: string;
  plan: TierId;
  status: string;
  renews: string;
  available: number;
  onHold: number;
  visits: number;
  ledger: { at: string; kind: string; coins: number; note: string | null }[];
  bookings: { when: string; status: string; coins: number; provider: string }[];
};

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return (data ?? null) as T | null;
}

export function fetchOpsBoard() {
  return rpc<OpsBoard>("admin_ops_board");
}

export function fetchProviderFile(slug: string) {
  return rpc<ProviderFile>("admin_provider_file", { p_slug: slug });
}

export function fetchApplicationStatus(ref: string) {
  return rpc<ApplicationStatus>("provider_application_status", { p_ref: ref });
}

export function fetchMyProvider() {
  return rpc<MyProvider>("my_provider");
}

export function fetchMemberFile(id: string) {
  return rpc<MemberFile>("admin_member_file", { p_id: id });
}

export function servicesListed(file: ProviderFile): string[] {
  if (file.services.length > 0) {
    return file.services.map((service) => {
      const time = service.minutes ? `${service.minutes} min` : "";
      const cash = service.cashKsh ? `Ksh ${service.cashKsh.toLocaleString("en-KE")}` : "";
      return [service.name, time, cash].filter(Boolean).join(" · ");
    });
  }
  const line = file.about?.split("\n").find((row) => row.startsWith("Services:"));
  return line ? [line.replace(/^Services:\s*/, "")] : [];
}

export function statusHeadline(status: ApplicationStatus["status"], note: string | null) {
  if (status === "live") return "You’re live";
  if (status === "rejected") return "Application closed";
  if (status === "paused") return "Studio paused";
  if (note) return "Changes requested";
  return "Your application is in review";
}
