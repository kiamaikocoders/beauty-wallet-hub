import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import type { HeatmapLayerSpecification } from "mapbox-gl";
import {
  STUDIO_STATUS_RING,
  studioFill,
  type MapLayers,
  type MemberPoint,
  type StudioPoint,
} from "@/lib/admin-map";
import { MAP_STYLE_LIGHT, MAPBOX_TOKEN, NAIROBI } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type HeatPaint = NonNullable<HeatmapLayerSpecification["paint"]>;

const HEAT: HeatPaint = {
  "heatmap-radius": 36,
  "heatmap-intensity": 1.05,
  "heatmap-opacity": 0.72,
  "heatmap-weight": 0.85,
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(198,161,91,0)",
    0.2,
    "#f5e6c8",
    0.45,
    "#c6a15b",
    0.72,
    "#6b1d38",
    1,
    "#3d1020",
  ],
};

export type MapSelection =
  | { kind: "studio"; id: string }
  | { kind: "member"; id: string };

export function StudioMap({
  studios,
  members,
  layers,
  selected,
  onSelect,
}: {
  studios: StudioPoint[];
  members: MemberPoint[];
  layers: MapLayers;
  selected: MapSelection | null;
  onSelect: (next: MapSelection | null) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const studio = selected?.kind === "studio" ? studios.find((row) => row.id === selected.id) : null;
  const member = selected?.kind === "member" ? members.find((row) => row.id === selected.id) : null;

  const heat = useMemo(() => {
    const points = layers.members
      ? members.map((row) => [row.lng, row.lat] as const)
      : studios.map((row) => [row.lng, row.lat] as const);
    return {
      type: "FeatureCollection" as const,
      features: points.map(([lng, lat]) => ({
        type: "Feature" as const,
        properties: { weight: 1 },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      })),
    };
  }, [layers.members, members, studios]);

  const focus = useMemo(() => {
    const points: [number, number][] = [];
    if (layers.studios) studios.forEach((row) => points.push([row.lng, row.lat]));
    if (layers.members) members.forEach((row) => points.push([row.lng, row.lat]));
    return points;
  }, [layers.members, layers.studios, members, studios]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mounted || !map || focus.length === 0) return;
    const lngs = focus.map((point) => point[0]);
    const lats = focus.map((point) => point[1]);
    if (Math.min(...lngs) === Math.max(...lngs) && Math.min(...lats) === Math.max(...lats)) {
      map.flyTo({ center: [lngs[0]!, lats[0]!], zoom: 13, duration: 600 });
      return;
    }
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 72, maxZoom: 13, duration: 600 },
    );
  }, [focus, mounted]);

  useEffect(() => {
    const map = mapRef.current;
    const point = studio ?? member;
    if (!map || !point) return;
    map.flyTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 });
  }, [studio, member]);

  if (!mounted) {
    return <div className="h-full min-h-[28rem] w-full animate-pulse bg-blush-subtle" />;
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="grid h-full min-h-[28rem] place-items-center bg-blush-subtle px-6 text-center type-body-s text-muted-foreground">
        Set VITE_MAPBOX_ACCESS_TOKEN to load the operations map.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLE_LIGHT}
      initialViewState={NAIROBI}
      style={{ width: "100%", height: "100%" }}
      attributionControl
      onClick={() => onSelect(null)}
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      {layers.density && (
        <Source id="density" type="geojson" data={heat}>
          <Layer id="density-heat" type="heatmap" paint={HEAT} />
        </Source>
      )}
      {layers.members &&
        members.map((row) => (
          <Marker
            key={row.id}
            longitude={row.lng}
            latitude={row.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              onSelect({ kind: "member", id: row.id });
            }}
          >
            <button
              type="button"
              aria-label={`${row.name}, member`}
              className="grid size-6 place-items-center"
            >
              <span className="size-2.5 rounded-full bg-[#c6a15b] ring-2 ring-white shadow" />
            </button>
          </Marker>
        ))}
      {layers.studios &&
        studios.map((row) => (
          <Marker
            key={row.id}
            longitude={row.lng}
            latitude={row.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              onSelect({ kind: "studio", id: row.id });
            }}
          >
            <button type="button" aria-label={`${row.name}, ${row.kind}`} className="relative grid size-7 place-items-center">
              {row.status === "applied" && (
                <span className="absolute size-6 animate-ping rounded-full bg-amber-400/50" />
              )}
              <span
                className="relative size-3.5 rounded-full ring-2 ring-white"
                style={{
                  background: studioFill(row.kind),
                  boxShadow: `0 0 0 2.5px ${STUDIO_STATUS_RING[row.status] ?? "#6b1d38"}`,
                }}
              />
            </button>
          </Marker>
        ))}
      {studio && layers.studios && (
        <Popup longitude={studio.lng} latitude={studio.lat} anchor="bottom" offset={18} closeButton={false} closeOnClick={false}>
          <p className="text-sm font-semibold">{studio.name}</p>
          <p className="text-xs text-neutral-600">
            {studio.area} · {studio.kind} · {studio.status}
          </p>
        </Popup>
      )}
      {member && layers.members && (
        <Popup longitude={member.lng} latitude={member.lat} anchor="bottom" offset={14} closeButton={false} closeOnClick={false}>
          <p className="text-sm font-semibold">{member.name}</p>
          <p className="text-xs text-neutral-600">
            {member.area} · {member.plan} · {member.status}
          </p>
        </Popup>
      )}
    </Map>
  );
}
