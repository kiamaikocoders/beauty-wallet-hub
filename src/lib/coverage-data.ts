import { supabase } from "@/integrations/supabase/client";

export type AreaCount = { area: string; count: number };

export async function fetchLiveAreas(): Promise<AreaCount[]> {
  const { data, error } = await supabase.from("providers").select("area").eq("status", "live");
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const area = row.area?.trim();
    if (!area) continue;
    map.set(area, (map.get(area) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area));
}

export async function submitWaitlist(args: {
  intent: "member" | "provider";
  area: string;
  phone: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc(
    "submit_waitlist" as never,
    {
      p_intent: args.intent,
      p_area: args.area,
      p_phone: args.phone,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as string;
}
