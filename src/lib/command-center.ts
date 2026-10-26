import { supabase } from "@/integrations/supabase/client";
import type { TierId } from "@/lib/pricing";

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export type SearchHit = { label: string; hint: string; href: string };
export type SearchGroup = { title: string; hits: SearchHit[] };

type SearchPayload = {
  providers: { slug: string; label: string; hint: string }[];
  members: { id: string; label: string; hint: string }[];
  disputes: { code: string; label: string; hint: string }[];
  companies: { id: string; label: string; hint: string }[];
  gifts: { id: string; label: string; hint: string }[];
};

export async function searchAdmin(query: string): Promise<SearchGroup[]> {
  const data = await rpc<SearchPayload>("admin_search", { p_query: query });
  const groups: SearchGroup[] = [
    {
      title: "Studios",
      hits: (data.providers ?? []).map((row) => ({
        label: row.label,
        hint: row.hint,
        href: `/admin/providers/${row.slug}`,
      })),
    },
    {
      title: "Members",
      hits: (data.members ?? []).map((row) => ({
        label: row.label,
        hint: row.hint,
        href: `/admin/members/${row.id}`,
      })),
    },
    {
      title: "Disputes",
      hits: (data.disputes ?? []).map((row) => ({
        label: row.label,
        hint: row.hint,
        href: `/admin/disputes`,
      })),
    },
    {
      title: "Companies",
      hits: (data.companies ?? []).map((row) => ({
        label: row.label,
        hint: row.hint,
        href: `/admin/companies/${row.id}`,
      })),
    },
    {
      title: "Gifts",
      hits: (data.gifts ?? []).map((row) => ({
        label: row.label,
        hint: row.hint,
        href: `/admin/gifts/${row.id}`,
      })),
    },
  ];
  return groups.filter((group) => group.hits.length > 0);
}

export type GiftRow = {
  id: string;
  code: string;
  fromName: string;
  toName: string;
  toPhone: string | null;
  tier: TierId;
  coins: number;
  priceKsh: number;
  status: string;
  claimBy: string;
  createdAt: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  seats: number;
  invited: number;
  dueOn: string | null;
  amountKsh: number;
};

export type FinanceSnapshot = {
  coinsOutstanding: number;
  coinsOnHold: number;
  visitsMonth: number;
  coinsSpentMonth: number;
  cashKshMonth: number;
  payoutKshMonth: number;
  months: { month: string; cash: number; payout: number }[];
  mix: { member: string; provider: string; visits: number; marginKsh: number }[];
};

export type PayoutLine = {
  slug: string;
  name: string;
  visits: number;
  earned: number;
  method: string;
  status: string;
};

export type HealthBoard = {
  applications: number;
  staleApplications: number;
  openDisputes: number;
  oldDisputes: number;
  missingPins: number;
  studiosWithoutEmail: number;
  bookingsToday: number;
  pausedMembers: number;
  giftsWaiting: number;
  documents: number;
};

export type AuditRow = {
  action: string;
  at: string;
  actor: string;
  detail: Record<string, unknown>;
};

export type StaffRow = {
  id: string;
  name: string;
  role: string;
  works: string | null;
  active: boolean;
};

export type DocRow = { id: string; label: string; path: string; at: string };

export type StudioContact = {
  email: string | null;
  provider: string;
  member: string;
  when: string;
  service: string;
  coins: number;
  payout: number;
};

export type DisputeNotice = {
  code: string;
  status: string;
  reason: string;
  note: string | null;
  refundCoins: number | null;
  memberName: string;
  memberEmail: string | null;
  providerName: string;
  providerEmail: string | null;
};

export function fetchGifts() {
  return rpc<GiftRow[]>("admin_gifts");
}

export function fetchCompanies() {
  return rpc<CompanyRow[]>("admin_companies");
}

export function extendCompanyInvoice(companyId: string, due: string) {
  return rpc<{ ok: boolean }>("admin_extend_company_invoice", {
    p_company_id: companyId,
    p_due: due,
  });
}

export function fetchFinance() {
  return rpc<FinanceSnapshot>("admin_finance");
}

export function fetchPayoutLines() {
  return rpc<{ weekStart: string; rows: PayoutLine[] }>("admin_payout_lines");
}

export function fetchHealth() {
  return rpc<HealthBoard>("admin_health");
}

export function fetchAudit(limit = 80) {
  return rpc<AuditRow[]>("admin_audit", { p_limit: limit });
}

export function fetchRoster() {
  return rpc<{ name: string; email: string | null }[]>("admin_roster");
}

export function writeAdminNote(action: string, detail: Record<string, unknown>) {
  return rpc<{ ok: boolean }>("admin_note", { p_action: action, p_detail: detail });
}

export function setMemberStatus(id: string, status: "active" | "paused" | "cancelled" | "renewal_failed") {
  return rpc<{ ok: boolean; status: string }>("admin_set_member_status", {
    p_id: id,
    p_status: status,
  });
}

export function scheduleStudioVisit(slug: string, at: string, note: string) {
  return rpc<{ ok: boolean }>("admin_schedule_visit", {
    p_slug: slug,
    p_at: at,
    p_note: note,
  });
}

export function fetchStudioVisit(slug: string) {
  return rpc<{ visitAt: string | null; visitNote: string | null } | null>("admin_studio_visit", {
    p_slug: slug,
  });
}

export function saveProviderService(input: {
  slug: string;
  id?: string | null;
  name: string;
  category: string;
  cash: number;
  minutes: number;
  active: boolean;
}) {
  return rpc<{ id: string }>("provider_save_service", {
    p_slug: input.slug,
    p_id: input.id || null,
    p_name: input.name,
    p_category: input.category,
    p_cash: input.cash,
    p_minutes: input.minutes,
    p_active: input.active,
  });
}

export function listStaff(slug: string) {
  return rpc<StaffRow[]>("provider_staff_list", { p_slug: slug });
}

export function saveStaff(input: {
  slug: string;
  id?: string | null;
  name: string;
  role: string;
  works: string;
  active: boolean;
}) {
  return rpc<{ id: string }>("provider_save_staff", {
    p_slug: input.slug,
    p_id: input.id || null,
    p_name: input.name,
    p_role: input.role,
    p_works: input.works,
    p_active: input.active,
  });
}

export function saveHours(slug: string, hours: { days: string; open: string; close: string }[]) {
  return rpc<{ ok: boolean }>("provider_save_hours", { p_slug: slug, p_hours: hours });
}

export function listDocuments(slug: string) {
  return rpc<DocRow[]>("provider_documents", { p_slug: slug });
}

export async function signedDocumentUrl(path: string) {
  const { data, error } = await supabase.storage.from("provider-docs").createSignedUrl(path, 120);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open the file");
  return data.signedUrl;
}

export async function uploadApplicationDocument(input: {
  providerId: string;
  slug: string;
  ref: string;
  label: string;
  file: File;
}) {
  const safe = input.file.name.replace(/[^\w.\-]+/g, "-").slice(-80);
  const path = `${input.providerId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("provider-docs").upload(path, input.file, {
    upsert: false,
    ...(input.file.type ? { contentType: input.file.type } : {}),
  });
  if (error) throw new Error(error.message);
  await rpc("register_application_document", {
    p_slug: input.slug,
    p_ref: input.ref,
    p_label: input.label,
    p_path: path,
  });
}

export function recordGift(input: {
  fromName: string;
  toName: string;
  toPhone: string;
  toEmail: string;
  message: string;
  tier: TierId;
  arriveOn?: string | null;
}) {
  return rpc<{ id: string; code: string; coins: number; claimBy: string }>("create_gift", {
    p_from_name: input.fromName,
    p_from_email: null,
    p_to_name: input.toName,
    p_to_phone: input.toPhone,
    p_to_email: input.toEmail || null,
    p_message: input.message,
    p_tier: input.tier,
    p_arrive_on: input.arriveOn || null,
  });
}

export function bookingStudioContact(bookingId: string) {
  return rpc<StudioContact | null>("booking_studio_contact", { p_booking_id: bookingId });
}

export function disputeNotice(code: string) {
  return rpc<DisputeNotice | null>("dispute_notice", { p_code: code });
}

export async function loadPayoutBands() {
  const { data, error } = await supabase
    .from("payout_bands")
    .select("class, min_pct, max_pct, default_pct")
    .order("class");
  if (error) throw new Error(error.message);
  return data ?? [];
}
