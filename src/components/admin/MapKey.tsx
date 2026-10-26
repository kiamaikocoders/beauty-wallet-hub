import { STUDIO_STATUS_RING, studioFill, type MapLayers } from "@/lib/admin-map";

const LAYERS: { key: keyof MapLayers; label: string; hint: string }[] = [
  { key: "studios", label: "Studios", hint: "Colour is the kind of studio. The ring is status." },
  { key: "members", label: "Members", hint: "Gold dots. Click one for the member." },
  { key: "density", label: "Density", hint: "Where studios or members cluster." },
];

const KINDS = ["Barber", "Hair", "Nails", "Skin", "Wellness", "Other"];

const STATUSES = [
  { id: "live", label: "Live", hint: "Bookable" },
  { id: "applied", label: "In review", hint: "Waiting on you" },
  { id: "paused", label: "Paused", hint: "Hidden from members" },
  { id: "rejected", label: "Closed", hint: "Application ended" },
];

export function MapKey({
  layers,
  onChange,
}: {
  layers: MapLayers;
  onChange: (next: MapLayers) => void;
}) {
  return (
    <section aria-label="Map key" className="max-h-[min(46vh,28rem)] w-[min(100%,20rem)] overflow-y-auto rounded-[20px] border border-border bg-white p-4 shadow-lg">
      <h2 className="font-display text-sm">Map key</h2>
      <p className="mt-1 type-caption text-muted-foreground">
        Click a pin for the studio or member. Density is the heat under the pins.
      </p>
      <h3 className="mt-3 type-eyebrow text-muted-foreground">Layers</h3>
      <div className="mt-2 space-y-2">
        {LAYERS.map((layer) => (
          <label key={layer.key} className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-1"
              checked={layers[layer.key]}
              onChange={(event) => onChange({ ...layers, [layer.key]: event.target.checked })}
            />
            <span>
              <span className="block type-body-s-semibold">{layer.label}</span>
              <span className="block type-caption text-muted-foreground">{layer.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <h3 className="mt-4 type-eyebrow text-muted-foreground">Studio colour</h3>
      <ul className="mt-2 grid grid-cols-2 gap-1.5">
        {KINDS.map((kind) => (
          <li key={kind} className="flex items-center gap-2 type-caption">
            <span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: studioFill(kind) }} />
            {kind}
          </li>
        ))}
      </ul>
      <h3 className="mt-4 type-eyebrow text-muted-foreground">Status ring</h3>
      <ul className="mt-2 space-y-1.5">
        {STATUSES.map((status) => (
          <li key={status.id} className="flex items-center gap-2 type-caption">
            <span
              className="size-2.5 rounded-full bg-white"
              style={{ boxShadow: `0 0 0 2px ${STUDIO_STATUS_RING[status.id]}` }}
            />
            <span className="font-medium">{status.label}</span>
            <span className="text-muted-foreground">· {status.hint}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 type-eyebrow text-muted-foreground">Members</h3>
      <p className="mt-1 flex items-center gap-2 type-caption text-muted-foreground">
        <span className="size-2.5 rounded-full bg-[#c6a15b] ring-2 ring-white" />
        Gold dot · plan and area on click
      </p>
    </section>
  );
}
