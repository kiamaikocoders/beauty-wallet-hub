import { supabase } from "@/integrations/supabase/client";

export type StudioPoint = {
  id: string;
  name: string;
  area: string;
  kind: string;
  status: string;
  lat: number;
  lng: number;
  address: string | null;
};

export type MemberPoint = {
  area: string;
  lat: number;
  lng: number;
};

export type NeighbourhoodCount = {
  area: string;
  members: number;
};

export type AdminMapData = {
  providers: StudioPoint[];
  members: MemberPoint[];
  neighbourhoods: NeighbourhoodCount[];
  missingPins: number;
};

const EMPTY: AdminMapData = {
  providers: [],
  members: [],
  neighbourhoods: [],
  missingPins: 0,
};

export async function fetchAdminMap(): Promise<AdminMapData> {
  const { data, error } = await supabase.rpc("admin_map_points" as never);
  if (error || !data || typeof data !== "object") return EMPTY;
  const row = data as Partial<AdminMapData>;
  return {
    providers: Array.isArray(row.providers) ? row.providers : [],
    members: Array.isArray(row.members) ? row.members : [],
    neighbourhoods: Array.isArray(row.neighbourhoods) ? row.neighbourhoods : [],
    missingPins: Number(row.missingPins ?? 0),
  };
}
