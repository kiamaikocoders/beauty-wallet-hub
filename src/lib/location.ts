import { supabase } from "@/integrations/supabase/client";
import { areaFromAddress, reverseGeocode, type GeoPoint } from "@/lib/geo";
import { NAIROBI_CBD } from "@/lib/mapbox";

export type SavedPin = GeoPoint & {
  address: string;
  area: string;
  approximate: boolean;
};

export function requestCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  });
}

/** Browser location, then Nominatim. Falls back to a Nairobi CBD pin. */
export async function detectPin(): Promise<SavedPin> {
  let lat: number = NAIROBI_CBD.latitude;
  let lng: number = NAIROBI_CBD.longitude;
  let approximate = true;
  try {
    const pos = await requestCurrentPosition();
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
    approximate = false;
  } catch {
    approximate = true;
  }
  const address = await reverseGeocode(lat, lng);
  return { lat, lng, address, area: areaFromAddress(address), approximate };
}

export async function describePin(lat: number, lng: number): Promise<SavedPin> {
  const address = await reverseGeocode(lat, lng);
  return { lat, lng, address, area: areaFromAddress(address), approximate: false };
}

export async function saveMyLocation(pin: SavedPin): Promise<void> {
  const { error } = await supabase.rpc(
    "save_my_location" as never,
    {
      p_lat: pin.lat,
      p_lng: pin.lng,
      p_address: pin.address,
      p_area: pin.area,
    } as never,
  );
  if (error) throw error;
}
