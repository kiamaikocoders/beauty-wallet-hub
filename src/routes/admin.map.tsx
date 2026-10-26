import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapKey } from "@/components/admin/MapKey";
import { StatusPill } from "@/components/admin/ui";
import { statusTone } from "@/components/admin/nav";
import { StudioMap, type MapSelection } from "@/components/maps/StudioMap";
import {
  DEFAULT_MAP_LAYERS,
  fetchAdminMap,
  type AdminMapData,
  type MapLayers,
  type MemberPoint,
  type StudioPoint,
  type UnpinnedStudio,
} from "@/lib/admin-map";
import { TierBadge } from "@/components/site/primitives";
import type { TierId } from "@/lib/pricing";

export const Route = createFileRoute("/admin/map")({
  component: AdminMapPage,
});

const EMPTY: AdminMapData = {
  providers: [],
  members: [],
  neighbourhoods: [],
  unpinned: [],
  missingPins: 0,
  missingMemberPins: 0,
};

function AdminMapPage() {
  const [data, setData] = useState<AdminMapData>(EMPTY);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_MAP_LAYERS);
  const [selected, setSelected] = useState<MapSelection | null>(null);
  const [pickedUnpinned, setPickedUnpinned] = useState<UnpinnedStudio | null>(null);
  const [keyOpen, setKeyOpen] = useState(true);

  useEffect(() => {
    void fetchAdminMap().then(setData);
  }, []);

  const studio = selected?.kind === "studio" ? data.providers.find((row) => row.id === selected.id) : null;
  const member = selected?.kind === "member" ? data.members.find((row) => row.id === selected.id) : null;

  function choose(next: MapSelection | null) {
    setPickedUnpinned(null);
    setSelected(next);
  }

  return (
    <div className="relative -mx-5 -mt-5 h-[calc(100dvh-4.5rem-7rem)] lg:-mx-10 lg:-mt-7 lg:h-[calc(100dvh-5.5rem)]">
      <StudioMap
        studios={data.providers}
        members={data.members}
        layers={layers}
        selected={selected}
        onSelect={choose}
      />
      <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4">
        <div className="pointer-events-auto absolute top-3 left-3 flex max-h-[calc(100%-1.5rem)] flex-col gap-2 sm:top-4 sm:left-4">
          <button
            type="button"
            className="w-fit rounded-full bg-white px-3 py-1.5 type-caption shadow lg:hidden"
            onClick={() => setKeyOpen((open) => !open)}
          >
            {keyOpen ? "Hide map key" : "Map key"}
          </button>
          {keyOpen && <MapKey layers={layers} onChange={setLayers} />}
        </div>

        {(studio || member || pickedUnpinned) && (
          <DetailCard
            studio={studio ?? null}
            member={member ?? null}
            unpinned={pickedUnpinned}
            onClose={() => {
              setSelected(null);
              setPickedUnpinned(null);
            }}
          />
        )}

        <aside className="pointer-events-auto absolute bottom-3 left-3 max-h-[32%] w-[min(100%-1.5rem,20rem)] overflow-y-auto rounded-[20px] border border-border bg-white p-4 shadow-lg sm:left-4 sm:bottom-4">
          <p className="type-eyebrow text-muted-foreground">
            {data.providers.length} studios · {data.members.length} members
          </p>
          {data.unpinned.length > 0 && (
            <p className="mt-1 type-caption text-warning">
              {data.missingPins} studios have no pin
              {data.missingMemberPins > 0 ? ` · ${data.missingMemberPins} members` : ""}
            </p>
          )}
          <ul className="mt-3 space-y-1">
            {layers.studios &&
              data.providers.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => choose({ kind: "studio", id: row.id })}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <span>
                      <span className="block type-body-s-semibold">{row.name}</span>
                      <span className="type-caption text-muted-foreground">{row.area}</span>
                    </span>
                    <StatusPill tone={statusTone(row.status)}>{row.status === "applied" ? "In review" : row.status}</StatusPill>
                  </button>
                </li>
              ))}
            {layers.members &&
              data.members.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => choose({ kind: "member", id: row.id })}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <span>
                      <span className="block type-body-s-semibold">{row.name}</span>
                      <span className="type-caption text-muted-foreground">{row.area}</span>
                    </span>
                    <span className="type-caption capitalize">{row.plan}</span>
                  </button>
                </li>
              ))}
            {data.unpinned.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setPickedUnpinned(row);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                >
                  <span>
                    <span className="block type-body-s-semibold">{row.name}</span>
                    <span className="type-caption text-muted-foreground">No pin · {row.area}</span>
                  </span>
                  <StatusPill tone={statusTone(row.status)}>{row.status === "applied" ? "In review" : row.status}</StatusPill>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function DetailCard({
  studio,
  member,
  unpinned,
  onClose,
}: {
  studio: StudioPoint | null;
  member: MemberPoint | null;
  unpinned: UnpinnedStudio | null;
  onClose: () => void;
}) {
  const title = studio?.name ?? member?.name ?? unpinned?.name ?? "";
  const rows: [string, string][] = studio
    ? [
        ["Kind", studio.kind],
        ["Area", studio.area],
        ["Status", studio.status === "applied" ? "In review" : studio.status],
        ["Address", studio.address || "No address yet"],
        ["Class", studio.class ?? "—"],
        ["Phone", studio.phone || "—"],
      ]
    : member
      ? [
          ["Area", member.area],
          ["Plan", member.plan],
          ["Status", member.status],
        ]
      : unpinned
        ? [
            ["Kind", unpinned.kind],
            ["Area", unpinned.area],
            ["Status", unpinned.status === "applied" ? "In review" : unpinned.status],
            ["Address", unpinned.address || "No pin and no address"],
            ["Phone", unpinned.phone || "—"],
            ["Reference", unpinned.ref || "—"],
          ]
        : [];

  return (
    <div className="pointer-events-auto absolute top-3 right-3 max-h-[min(52vh,28rem)] w-[min(100%-1.5rem,22rem)] overflow-y-auto rounded-[20px] border border-border bg-white p-5 shadow-lg sm:top-4 sm:right-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] leading-tight">{title}</h2>
          <p className="mt-1 type-caption text-muted-foreground">
            {studio || unpinned ? "Studio" : "Member"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="type-caption text-muted-foreground">
          Close
        </button>
      </div>
      {member && (
        <div className="mt-3">
          <TierBadge tier={member.plan as TierId} />
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-muted/60 p-2.5">
            <p className="type-caption text-muted-foreground">{label}</p>
            <p className="type-body-s-semibold capitalize">{value}</p>
          </div>
        ))}
      </div>
      {studio && (
        <Link
          to="/admin/providers/$slug"
          params={{ slug: studio.slug }}
          className="mt-4 inline-flex type-body-s-semibold text-burgundy"
        >
          Open studio
        </Link>
      )}
      {unpinned && (
        <Link
          to="/admin/providers/$slug"
          params={{ slug: unpinned.slug }}
          className="mt-4 inline-flex type-body-s-semibold text-burgundy"
        >
          Open studio
        </Link>
      )}
      {member && (
        <Link
          to="/admin/members/$id"
          params={{ id: member.id }}
          className="mt-4 inline-flex type-body-s-semibold text-burgundy"
        >
          Open member
        </Link>
      )}
    </div>
  );
}
