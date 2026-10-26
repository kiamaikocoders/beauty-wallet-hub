import { supabase } from "@/integrations/supabase/client";
import type { TierId } from "@/lib/pricing";

type RpcError = { message: string };

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error((error as RpcError).message);
  return data as T;
}

export async function adminUpdatePayoutBand(input: {
  classId: TierId;
  minPct: number;
  maxPct: number;
  defaultPct: number;
}) {
  return rpc<{ ok: boolean }>("admin_update_payout_band", {
    p_class: input.classId,
    p_min_pct: input.minPct,
    p_max_pct: input.maxPct,
    p_default_pct: input.defaultPct,
  });
}

export async function adminAdjustCoins(input: {
  memberKey: string;
  coins: number;
  reason: string;
}) {
  return rpc<{ ok: boolean; available: number }>("admin_adjust_coins", {
    p_member_key: input.memberKey,
    p_coins: input.coins,
    p_reason: input.reason,
  });
}

export async function adminApprovePayoutRun(input: { runDate: string; code: string }) {
  return rpc<{ ok: boolean; status: string }>("admin_approve_payout_run", {
    p_run_date: input.runDate,
    p_code: input.code,
  });
}

export async function adminResolveDispute(input: {
  code: string;
  decision: "redo" | "half" | "full";
  note: string;
}) {
  return rpc<{ ok: boolean; refundCoins?: number }>("admin_resolve_dispute", {
    p_code: input.code,
    p_decision: input.decision,
    p_note: input.note,
  });
}

export async function adminExtendCompanyDueDate(input: {
  companyId: string;
  dueDate: string;
  resumeCoins: boolean;
  reason: string;
}) {
  return rpc<{ ok: boolean }>("admin_extend_company_due_date", {
    p_company_id: input.companyId,
    p_due_date: input.dueDate,
    p_resume_coins: input.resumeCoins,
    p_reason: input.reason,
  });
}

export async function adminReviewProvider(input: {
  slug: string;
  decision: "approve" | "reject" | "ask_changes";
  classId?: TierId;
  payoutPct?: number;
  note?: string;
}) {
  return rpc<{
    ok: boolean;
    status: string;
    email: string | null;
    phone: string | null;
    name: string;
    slug: string;
    ref: string | null;
    class: TierId;
    payoutPct: number;
  }>("admin_review_provider", {
    p_slug: input.slug,
    p_decision: input.decision,
    p_class: input.classId ?? null,
    p_payout_pct: input.payoutPct ?? null,
    p_note: input.note ?? null,
  });
}
