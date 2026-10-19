import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl, type MapMouseEvent } from "react-map-gl/mapbox";
import { buttonClass } from "@/components/site/primitives";
import { describePin, detectPin, type SavedPin } from "@/lib/location";
import { MAP_STYLE_LIGHT, MAPBOX_TOKEN, NAIROBI } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export function LocationPin({
  value,
  onChange,
  title,
  helper,
  note,
}: {
  value: SavedPin | null;
  onChange: (pin: SavedPin) => void;
  title: string;
  helper: string;
  note: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  async function useMyLocation() {
    setBusy(true);
    setError(null);
    try {
      const pin = await detectPin();
      onChange(pin);
      if (pin.approximate) {
        setError("Location was blocked, so the pin is in Nairobi CBD. Tap the map to move it.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this location.");
    } finally {
      setBusy(false);
    }
  }

  async function onMapClick(event: MapMouseEvent) {
    const lat = event.lngLat.lat;
    const lng = event.lngLat.lng;
    setBusy(true);
    setError(null);
    try {
      onChange(await describePin(lat, lng));
    } finally {
      setBusy(false);
    }
  }

  const view = value
    ? { longitude: value.lng, latitude: value.lat, zoom: 14 }
    : NAIROBI;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="type-h4 text-foreground">{title}</h2>
        <p className="type-caption text-muted-foreground">{helper}</p>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="h-[220px] w-full bg-blush-subtle">
          {mounted && MAPBOX_TOKEN ? (
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle={MAP_STYLE_LIGHT}
              initialViewState={view}
              longitude={view.longitude}
              latitude={view.latitude}
              zoom={view.zoom}
              onClick={(event) => void onMapClick(event)}
              style={{ width: "100%", height: "100%" }}
              attributionControl={false}
            >
              {value && (
                <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
                  <span className="block size-4 rounded-full border-2 border-white bg-burgundy shadow" />
                </Marker>
              )}
              <NavigationControl position="top-right" showCompass={false} />
            </Map>
          ) : (
            <div className="grid h-full place-items-center px-6 text-center type-body-s text-muted-foreground">
              {MAPBOX_TOKEN
                ? "Loading map…"
                : "Map needs VITE_MAPBOX_ACCESS_TOKEN before a pin can be dropped."}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="type-body-s-semibold">{value?.area ?? "No pin yet"}</p>
            <p className="type-caption text-muted-foreground">
              {value?.address ?? "Use your location, or tap the map."}
            </p>
          </div>
          <p className="type-caption text-muted-foreground">{note}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void useMyLocation()}
            className={buttonClass({ variant: "secondary", size: "s", className: "self-start" })}
          >
            {busy ? "Finding you…" : "Use my location"}
          </button>
          {error && <p className="type-caption text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
