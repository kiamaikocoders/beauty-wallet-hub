import { supabase } from "@/integrations/supabase/client";
import type { TierId } from "./pricing";

export type PaymentIntentResult = {
  id: string;
  reference: string;
  status: string;
  tier: TierId;
  amount_ksh: number;
  method: string;
};

function asIntent(data: unknown): PaymentIntentResult {
  const row = data as PaymentIntentResult;
  return row;
}

export async function createPaymentIntent(args: {
  tier: TierId;
  amountKsh: number;
  method: "mpesa" | "card";
  phone?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}) {
  const { data, error } = await supabase.rpc(
    "create_payment_intent" as never,
    {
      p_tier: args.tier,
      p_amount_ksh: args.amountKsh,
      p_method: args.method,
      p_phone: args.phone ?? null,
      p_metadata: args.metadata ?? {},
    } as never,
  );
  if (error) throw new Error(error.message);
  return asIntent(data);
}

export async function updatePaymentStatus(
  id: string,
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled",
  failureReason?: string,
) {
  const { data, error } = await supabase.rpc(
    "update_payment_intent_status" as never,
    {
      p_id: id,
      p_status: status,
      p_failure_reason: failureReason ?? null,
    } as never,
  );
  if (error) throw new Error(error.message);
  return asIntent(data);
}
