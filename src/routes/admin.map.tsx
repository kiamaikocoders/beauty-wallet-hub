import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudioMap } from "@/components/maps/StudioMap";
import { FilterChips, Panel, StatCard } from "@/components/admin/ui";
import { fetchAdminMap, type AdminMapData } from "@/lib/admin-map";

export const Route = createFileRoute("/admin/map")({
  component: AdminMapPage,
});

const EMPTY: AdminMapData = {
  providers: [],
  members: [],
  neighbourhoods: [],
  missingPins: 0,
};

function AdminMapPage() {
  const [data, setData] = useState<AdminMapData>(EMPTY);
  const [filter, setFilter] = useState("Studios and members");

  useEffect(() => {
    void fetchAdminMap().then(setData);
  }, []);

  const showStudios = filter !== "Members";
  const showMembers = filter !== "Studios";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Studios on the map" value={String(data.providers.length)} />
        <StatCard
          label="Missing a pin"
          value={String(data.missingPins)}
          deltaTone={data.missingPins > 0 ? "warning" : "muted"}
        />
        <StatCard label="Members" value={String(data.members.length)} />
        <StatCard label="Neighbourhoods" value={String(data.neighbourhoods.length)} />
      </div>
      <FilterChips
        items={["Studios and members", "Studios", "Members"]}
        active={filter}
        onChange={setFilter}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel padding="p-0" className="h-[520px] overflow-hidden">
          <StudioMap
            studios={data.providers}
            members={data.members}
            showStudios={showStudios}
            showMembers={showMembers}
          />
        </Panel>
        <Panel className="max-h-[520px] overflow-auto">
          {showStudios && (
            <section>
              <p className="type-eyebrow text-muted-foreground">Studios</p>
              <ul className="mt-3 space-y-3">
                {data.providers.map((studio) => (
                  <li key={studio.id}>
                    <p className="type-body-s-semibold">{studio.name}</p>
                    <p className="type-caption text-muted-foreground">
                      {studio.area} · {studio.status}
                    </p>
                  </li>
                ))}
                {data.providers.length === 0 && (
                  <li className="type-body-s text-muted-foreground">No studio pins yet.</li>
                )}
              </ul>
            </section>
          )}
          {showMembers && (
            <section className={showStudios ? "mt-6" : ""}>
              <p className="type-eyebrow text-muted-foreground">Members by neighbourhood</p>
              <ul className="mt-3 space-y-3">
                {data.neighbourhoods.map((row) => (
                  <li key={row.area} className="flex items-center justify-between gap-3">
                    <span className="type-body-s">{row.area}</span>
                    <span className="type-body-s-semibold">{row.members}</span>
                  </li>
                ))}
                {data.neighbourhoods.length === 0 && (
                  <li className="type-body-s text-muted-foreground">No member pins yet.</li>
                )}
              </ul>
            </section>
          )}
        </Panel>
      </div>
    </div>
  );
}
