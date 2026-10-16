import { supabase } from "@/integrations/supabase/client";
import type { TierId } from "@/lib/pricing";

export type LiveMember = {
  id: string;
  name: string;
  area: string;
  plan: TierId;
  available: number;
  onHold: number;
  visits: number;
  renews: string;
  status: string;
  email: string | null;
};

export type LiveProvider = {
  slug: string;
  name: string;
  area: string;
  class: TierId;
  payout: string;
  rating: number;
  visits: number;
  status: string;
};

export type AdminDirectory = {
  stats: {
    members: number;
    providers: number;
    liveProviders: number;
    applications: number;
    bookingsThisMonth: number;
    coinsOutstanding: number;
  };
  members: LiveMember[];
  providers: LiveProvider[];
};

export async function fetchAdminDirectory(): Promise<AdminDirectory | null> {
  const { data, error } = await supabase.rpc("admin_directory" as never);
  if (error || !data) return null;
  return data as AdminDirectory;
}
