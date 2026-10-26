import { supabase } from "@/integrations/supabase/client";

export type StudioPoint = {
  id: string;
  slug: string;
  name: string;
  area: string;
  kind: string;
  status: string;
  lat: number;
  lng: number;
  address: string | null;
  class?: string;
  rating?: number | null;
  phone?: string | null;
  ref?: string | null;
};

export type UnpinnedStudio = Omit<StudioPoint, "lat" | "lng">;

export type MemberPoint = {
  id: string;
  name: string;
  area: string;
  plan: string;
  status: string;
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
  unpinned: UnpinnedStudio[];
  missingPins: number;
  missingMemberPins: number;
};

const EMPTY: AdminMapData = {
  providers: [],
  members: [],
  neighbourhoods: [],
  unpinned: [],
  missingPins: 0,
  missingMemberPins: 0,
};

export type MapLayers = {
  studios: boolean;
  members: boolean;
  density: boolean;
};

export const DEFAULT_MAP_LAYERS: MapLayers = {
  studios: true,
  members: true,
  density: true,
};

export const STUDIO_STATUS_RING: Record<string, string> = {
  live: "#15803d",
  applied: "#d97706",
  paused: "#b91c1c",
  rejected: "#78716c",
};

export function studioFill(kind: string) {
  const value = kind.toLowerCase();
  if (value.includes("barber") || value.includes("fade") || value.includes("groom")) return "#1c1917";
  if (value.includes("nail")) return "#9f1239";
  if (value.includes("hair") || value.includes("braid")) return "#9a3412";
  if (value.includes("skin") || value.includes("facial")) return "#a16207";
  if (value.includes("spa") || value.includes("wellness") || value.includes("massage")) return "#0f766e";
  return "#6b1d38";
}

export async function fetchAdminMap(): Promise<AdminMapData> {
  const { data, error } = await supabase.rpc("admin_map_points" as never);
  if (error || !data || typeof data !== "object") return EMPTY;
  const row = data as Partial<AdminMapData>;
  return {
    providers: Array.isArray(row.providers) ? row.providers : [],
    members: Array.isArray(row.members) ? row.members : [],
    neighbourhoods: Array.isArray(row.neighbourhoods) ? row.neighbourhoods : [],
    unpinned: Array.isArray(row.unpinned) ? row.unpinned : [],
    missingPins: Number(row.missingPins ?? 0),
    missingMemberPins: Number(row.missingMemberPins ?? 0),
  };
}
