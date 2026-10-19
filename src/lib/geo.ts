export type GeoPoint = { lat: number; lng: number };

export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lng).toFixed(5)}° ${ew}`;
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  state?: string;
};

/** Reverse-geocode a pin. No API key. Falls back to coordinates. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "16");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return fallback(lat, lng);
    const data = (await res.json()) as { address?: NominatimAddress; display_name?: string };
    const a = data.address;
    if (!a) return data.display_name?.split(",").slice(0, 2).join(", ") || fallback(lat, lng);
    const place = [a.road, a.neighbourhood || a.suburb].filter(Boolean).join(", ");
    const city = a.city || a.town || a.state;
    const line = [place, city].filter(Boolean).join(", ");
    return line || fallback(lat, lng);
  } catch {
    return fallback(lat, lng);
  }
}

function fallback(lat: number, lng: number): string {
  return `Pin · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

const KNOWN_AREAS = [
  "Westlands",
  "Kilimani",
  "Karen",
  "Lavington",
  "Kileleshwa",
  "CBD",
  "Parklands",
  "Langata",
  "Ngong",
];

export function areaFromAddress(address: string): string {
  const lower = address.toLowerCase();
  const hit = KNOWN_AREAS.find((area) => lower.includes(area.toLowerCase()));
  if (hit) return hit;
  const first = address.split(",")[0]?.trim();
  return first && first.length > 1 ? first : "Nairobi";
}
