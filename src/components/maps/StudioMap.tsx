import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import type { MemberPoint, StudioPoint } from "@/lib/admin-map";
import { MAP_STYLE_LIGHT, MAPBOX_TOKEN, NAIROBI } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const GOLD_FOREST: [number, string][] = [
  [0, "rgba(0,0,0,0)"],
  [0.2, "#f5e6c8"],
  [0.45, "#c6a15b"],
  [0.7, "#6b1d38"],
  [1, "#3d1020"],
];

export function StudioMap({
  studios,
  members,
  showStudios,
  showMembers,
}: {
  studios: StudioPoint[];
  members: MemberPoint[];
  showStudios: boolean;
  showMembers: boolean;
}) {
  const mapRef = useRef<MapRef>(null);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<StudioPoint | null>(null);

  useEffect(() => setMounted(true), []);

  const heat = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: members.map((m) => ({
        type: "Feature" as const,
        properties: { weight: 1 },
        geometry: { type: "Point" as const, coordinates: [m.lng, m.lat] },
      })),
    }),
    [members],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || studios.length === 0) return;
    const lngs = studios.map((s) => s.lng);
    const lats = studios.map((s) => s.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, maxZoom: 12, duration: 0 },
    );
  }, [studios, mounted]);

  if (!mounted) {
    return <div className="h-full min-h-[320px] rounded-[20px] bg-blush-subtle" />;
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="grid h-full min-h-[320px] place-items-center rounded-[20px] bg-blush-subtle px-6 text-center type-body-s text-muted-foreground">
        Set VITE_MAPBOX_ACCESS_TOKEN to load the studio map.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLE_LIGHT}
      initialViewState={NAIROBI}
      style={{ width: "100%", height: "100%", minHeight: 320, borderRadius: 20 }}
      attributionControl={false}
    >
      {showMembers && (
        <Source id="members" type="geojson" data={heat}>
          <Layer
            id="member-heat"
            type="heatmap"
            paint={{
              "heatmap-weight": ["get", "weight"],
              "heatmap-intensity": 1,
              "heatmap-radius": 28,
              "heatmap-opacity": 0.7,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                ...GOLD_FOREST.flat(),
              ],
            }}
          />
        </Source>
      )}
      {showStudios &&
        studios.map((studio) => (
          <Marker
            key={studio.id}
            longitude={studio.lng}
            latitude={studio.lat}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelected(studio);
            }}
          >
            <button
              type="button"
              className="block size-3.5 rounded-full border-2 border-white bg-burgundy shadow"
              aria-label={studio.name}
            />
          </Marker>
        ))}
      {selected && showStudios && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="top"
          onClose={() => setSelected(null)}
          closeButton
        >
          <p className="text-sm font-semibold">{selected.name}</p>
          <p className="text-xs text-neutral-600">
            {selected.area} · {selected.kind} · {selected.status}
          </p>
        </Popup>
      )}
      <NavigationControl position="top-right" showCompass={false} />
    </Map>
  );
}
