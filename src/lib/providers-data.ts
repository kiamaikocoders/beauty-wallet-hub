import { supabase } from "@/integrations/supabase/client";
import { pct, type TierId } from "@/lib/pricing";

export type PayoutBand = {
  class: TierId;
  minPct: number;
  maxPct: number;
  defaultPct: number;
};

const FALLBACK_BANDS: PayoutBand[] = [
  { class: "basic", minPct: 0.82, maxPct: 0.88, defaultPct: 0.85 },
  { class: "intermediate", minPct: 0.77, maxPct: 0.83, defaultPct: 0.8 },
  { class: "premium", minPct: 0.72, maxPct: 0.78, defaultPct: 0.75 },
];

export async function fetchPayoutBands(): Promise<PayoutBand[]> {
  const { data, error } = await supabase
    .from("payout_bands")
    .select("class, min_pct, max_pct, default_pct");
  if (error || !data?.length) return FALLBACK_BANDS;
  return data.map((row) => ({
    class: row.class as TierId,
    minPct: Number(row.min_pct),
    maxPct: Number(row.max_pct),
    defaultPct: Number(row.default_pct),
  }));
}

/** Example payout card: Knotless Braids Medium at intermediate default rate. */
export function examplePayout(bands: PayoutBand[]) {
  const cashKsh = 6000;
  const band = bands.find((b) => b.class === "intermediate") ?? FALLBACK_BANDS[1]!;
  const rate = band.defaultPct;
  return {
    service: "Knotless Braids, Medium",
    cashKsh,
    rate,
    rateLabel: pct(rate),
    payoutKsh: Math.round(cashKsh * rate),
  };
}

export type ApplyAsProviderArgs = {
  name: string;
  kind: string;
  area: string;
  phone: string;
  email: string;
  social?: string | undefined;
  homeVisits: boolean;
  teamSize?: string | undefined;
  class: TierId;
  services?: string | undefined;
  payoutMethod?: string | undefined;
  payoutDetails?: string | undefined;
  kycDocs?: string[] | undefined;
  locationLat?: number | undefined;
  locationLng?: number | undefined;
  addressText?: string | undefined;
};

export type ApplyAsProviderResult = {
  id: string;
  ref: string;
  slug: string;
  payout_pct: number;
};

export async function submitProviderApplication(
  args: ApplyAsProviderArgs,
): Promise<ApplyAsProviderResult> {
  const { data, error } = await supabase.rpc(
    "apply_as_provider" as never,
    {
      p_name: args.name,
      p_kind: args.kind,
      p_area: args.area,
      p_phone: args.phone,
      p_email: args.email,
      p_social: args.social ?? null,
      p_home_visits: args.homeVisits,
      p_team_size: args.teamSize ?? null,
      p_class: args.class,
      p_services: args.services ?? null,
      p_payout_method: args.payoutMethod ?? null,
      p_payout_details: args.payoutDetails ?? null,
      p_kyc_docs: args.kycDocs ?? [],
      p_location_lat: args.locationLat ?? null,
      p_location_lng: args.locationLng ?? null,
      p_address_text: args.addressText ?? null,
    } as never,
  );

  if (error) throw error;
  return data as ApplyAsProviderResult;
}
