import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { listStaff, saveHours, saveStaff, type StaffRow } from "@/lib/command-center";
import { initials } from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/team")({
  component: TeamPage,
});

const DEFAULT_HOURS = [
  { days: "Mon to Fri", open: "08:00", close: "19:00" },
  { days: "Saturday", open: "08:00", close: "19:00" },
  { days: "Sunday", open: "10:00", close: "16:00" },
];

function TeamPage() {
  const data = usePortal();
  const [people, setPeople] = useState<StaffRow[]>([]);
  const [hours, setHours] = useState(
    data.provider.hours.length ? data.provider.hours : DEFAULT_HOURS,
  );
  const [name, setName] = useState("");
  const [role, setRole] = useState("Stylist");
  const [works, setWorks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listStaff(data.provider.slug)
      .then((rows) => setPeople(rows ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load the team"));
  }, [data.provider.slug]);

  async function addPerson() {
    setBusy(true);
    try {
      const saved = await saveStaff({
        slug: data.provider.slug,
        name,
        role,
        works,
        active: true,
      });
      setPeople((current) => [
        ...current,
        { id: saved.id, name: name.trim(), role: role.trim() || "Stylist", works: works.trim() || null, active: true },
      ]);
      setName("");
      setWorks("");
      toast.success("Team member saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this person");
    } finally {
      setBusy(false);
    }
  }

  async function persistHours() {
    setBusy(true);
    try {
      await saveHours(data.provider.slug, hours);
      toast.success("Hours saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save hours");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProviderShell data={data} title="Team and hours">
      <div className="pt-4 lg:pt-7">
        <p className="type-body-s text-muted-foreground">{people.length} people on this studio</p>
        <div className="mt-4 overflow-hidden rounded-[20px] border border-border bg-card">
          {people.length === 0 && (
            <p className="px-5 py-6 type-body-s text-muted-foreground">No team members saved yet.</p>
          )}
          <ul>
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 border-t border-border px-5 py-4 first:border-0">
                <span className="grid size-10 place-items-center rounded-full bg-muted type-body-s-semibold">
                  {initials(person.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="type-body-s-medium">{person.name}</p>
                  <p className="type-body-s text-muted-foreground">
                    {person.role}
                    {person.works ? ` · ${person.works}` : ""}
                  </p>
                </div>
                <p className="type-body-s-medium">{person.active ? "Active" : "Inactive"}</p>
              </li>
            ))}
          </ul>
        </div>

        <section className="mt-6 rounded-[20px] border border-border bg-card p-5">
          <h3 className="type-body-m-medium">Add someone</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-12 rounded-2xl border border-border bg-background px-4 outline-none" />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="h-12 rounded-2xl border border-border bg-background px-4 outline-none" />
            <input value={works} onChange={(e) => setWorks(e.target.value)} placeholder="Works" className="h-12 rounded-2xl border border-border bg-background px-4 outline-none" />
          </div>
          <button type="button" disabled={busy || name.trim().length < 2} className={buttonClass({ size: "s", className: "mt-4" })} onClick={() => void addPerson()}>
            Save team member
          </button>
        </section>

        <section className="mt-6 rounded-[20px] border border-border bg-card p-5">
          <h3 className="type-body-m-medium">Opening hours</h3>
          <ul className="mt-4 space-y-3">
            {hours.map((row, index) => (
              <li key={row.days} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center">
                <span className="type-body-s text-muted-foreground">{row.days}</span>
                <input
                  value={row.open}
                  onChange={(e) => setHours((current) => current.map((item, i) => (i === index ? { ...item, open: e.target.value } : item)))}
                  className="h-11 rounded-2xl border border-border bg-background px-3 outline-none"
                />
                <input
                  value={row.close}
                  onChange={(e) => setHours((current) => current.map((item, i) => (i === index ? { ...item, close: e.target.value } : item)))}
                  className="h-11 rounded-2xl border border-border bg-background px-3 outline-none"
                />
              </li>
            ))}
          </ul>
          <button type="button" disabled={busy} className={buttonClass({ size: "s", className: "mt-4" })} onClick={() => void persistHours()}>
            Save hours
          </button>
        </section>
      </div>
    </ProviderShell>
  );
}
