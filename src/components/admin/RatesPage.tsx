import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { buttonClass, tierName } from "@/components/site/primitives";
import { adminUpdatePayoutBand } from "@/lib/admin-api";
import { loadPayoutBands } from "@/lib/command-center";
import type { TierId } from "@/lib/pricing";
import { Panel, SectionTitle, StatusPill } from "./ui";

type Band = { class: TierId; min_pct: number; max_pct: number; default_pct: number };

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

export function RatesPage() {
  const [bands, setBands] = useState<Band[]>([]);
  const [selected, setSelected] = useState<TierId>("basic");
  const [lowest, setLowest] = useState("");
  const [highest, setHighest] = useState("");
  const [usual, setUsual] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function applyBand(band: Band) {
    setSelected(band.class);
    setLowest(String(Math.round(band.min_pct * 1000) / 10));
    setHighest(String(Math.round(band.max_pct * 1000) / 10));
    setUsual(String(Math.round(band.default_pct * 1000) / 10));
  }

  useEffect(() => {
    void loadPayoutBands()
      .then((rows) => {
        const next = rows as Band[];
        setBands(next);
        const first = next.find((row) => row.class === "basic") ?? next[0];
        if (first) applyBand(first);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load bands"))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    const min = Number(lowest) / 100;
    const max = Number(highest) / 100;
    const fallback = Number(usual) / 100;
    if (!(min > 0 && fallback >= min && max >= fallback && max <= 1)) {
      toast.error("Keep the usual rate between the lowest and highest, and at most 100%");
      return;
    }
    setBusy(true);
    try {
      await adminUpdatePayoutBand({ classId: selected, minPct: min, maxPct: max, defaultPct: fallback });
      const rows = (await loadPayoutBands()) as Band[];
      setBands(rows);
      const current = rows.find((row) => row.class === selected);
      if (current) applyBand(current);
      toast.success(`${tierName[selected]} band saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the band");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <SectionTitle
          title="Payout bands"
          action={
            <Link to="/admin/audit" className={buttonClass({ variant: "secondary", size: "s" })}>
              Change history
            </Link>
          }
        />
        <p className="mt-2 type-body-s text-muted-foreground">
          Each class has a lowest, usual, and highest share of the cash price. New studios start on the usual rate. Saving writes the band now.
        </p>
        {loaded && bands.length === 0 && (
          <p className="mt-4 type-body-s text-muted-foreground">No payout bands are stored.</p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="text-left type-label-s text-muted-foreground">
                <th className="pb-3">Class</th>
                <th className="pb-3">Lowest</th>
                <th className="pb-3">Usual</th>
                <th className="pb-3">Highest</th>
              </tr>
            </thead>
            <tbody>
              {bands.map((band) => (
                <tr key={band.class} className="border-t border-border">
                  <td className="py-3">
                    <button type="button" className="type-body-s-semibold" onClick={() => applyBand(band)}>
                      {tierName[band.class]}
                    </button>
                    {band.class === selected && (
                      <StatusPill tone="info" className="ml-2">
                        Editing
                      </StatusPill>
                    )}
                  </td>
                  <td className="py-3 type-body-s">{pct(band.min_pct)}</td>
                  <td className="py-3 type-body-s">{pct(band.default_pct)}</td>
                  <td className="py-3 type-body-s">{pct(band.max_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <h3 className="font-display text-[18px]">Edit {tierName[selected]}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PercentField label="Lowest %" value={lowest} onChange={setLowest} />
          <PercentField label="Usual %" value={usual} onChange={setUsual} />
          <PercentField label="Highest %" value={highest} onChange={setHighest} />
        </div>
        <button type="button" disabled={busy} className={buttonClass({ className: "mt-5" })} onClick={() => void save()}>
          Save {tierName[selected]} band
        </button>
      </Panel>
    </div>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="type-caption text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
      />
    </label>
  );
}
