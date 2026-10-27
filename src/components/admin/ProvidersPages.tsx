import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { adminReviewProvider } from "@/lib/admin-api";
import { fetchAdminDirectory, type LiveProvider } from "@/lib/admin-live";
import { fetchProviderFile, servicesListed, type ProviderFile } from "@/lib/admin-ops";
import {
  fetchStudioVisit,
  listDocuments,
  scheduleStudioVisit,
  signedDocumentUrl,
  type DocRow,
} from "@/lib/command-center";
import { announce } from "@/lib/notices";
import { sendTemplateEmail } from "@/lib/resend";
import type { TierId } from "@/lib/pricing";
import { statusTone } from "./nav";
import { FilterChips, Panel, StatusPill, Td, Th } from "./ui";

const CLASSES: TierId[] = ["basic", "intermediate", "premium"];

function statusLabel(status: string) {
  if (status === "applied") return "In review";
  return status;
}

export function ProvidersPage() {
  const [tab, setTab] = useState("All");
  const [live, setLive] = useState<LiveProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("All classes");
  const [areaFilter, setAreaFilter] = useState("All areas");

  useEffect(() => {
    void fetchAdminDirectory()
      .then((dir) => {
        if (!dir) {
          setError("Could not load providers.");
          return;
        }
        setLive(dir.providers);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load providers.");
      });
  }, []);

  const areas = ["All areas", ...new Set((live ?? []).map((row) => row.area))];
  const rows = (live ?? []).filter((provider) => {
    const status = provider.status.toLowerCase();
    if (tab === "Live" && status !== "live") return false;
    if (tab === "Applications" && status !== "applied") return false;
    if (tab === "Paused" && status !== "paused") return false;
    if (classFilter !== "All classes" && provider.class !== classFilter.toLowerCase()) return false;
    if (areaFilter !== "All areas" && provider.area !== areaFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          items={["All", "Live", "Applications", "Paused"]}
          active={tab}
          onChange={setTab}
        />
        <Link to="/providers/apply" className={buttonClass({ size: "s" })}>
          Provider application form
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 type-body-s"
        >
          <option>All classes</option>
          {CLASSES.map((item) => (
            <option key={item}>{item[0]!.toUpperCase() + item.slice(1)}</option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 type-body-s"
        >
          {areas.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </div>

      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Provider</Th>
                <Th>Class</Th>
                <Th>Payout</Th>
                <Th>Rating</Th>
                <Th>Visits</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((provider) => (
                <tr key={provider.slug} className="border-t border-border">
                  <Td>
                    <Link
                      to="/admin/providers/$slug"
                      params={{ slug: provider.slug }}
                      className="hover:underline"
                    >
                      <p className="type-body-s-semibold">{provider.name}</p>
                      <p className="type-caption text-muted-foreground">{provider.area}</p>
                    </Link>
                  </Td>
                  <Td>
                    <TierBadge tier={provider.class} />
                  </Td>
                  <Td>{provider.payout}</Td>
                  <Td>★ {provider.rating}</Td>
                  <Td>{provider.visits}</Td>
                  <Td>
                    <StatusPill tone={statusTone(provider.status)}>
                      {statusLabel(provider.status)}
                    </StatusPill>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td className="type-body-s text-muted-foreground">
                    {error ?? (live ? "Nothing in this filter." : "Loading providers…")}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          {live ? `${rows.length} providers from the database` : "Loading the live directory"}
        </p>
      </Panel>
    </div>
  );
}

export function ProviderApplicationPage({ slug }: { slug: string }) {
  const [file, setFile] = useState<ProviderFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [klass, setKlass] = useState<TierId>("basic");
  const [payout, setPayout] = useState("85");
  const [note, setNote] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [visitAt, setVisitAt] = useState("");
  const [visitNote, setVisitNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchProviderFile(slug)
      .then((next) => {
        if (cancelled) return;
        if (!next) {
          setError("This studio is not in the database.");
          return;
        }
        setFile(next);
        setKlass(next.class);
        setPayout(String(Math.round(Number(next.payoutPct) * 100)));
        setNote(next.reviewNote ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load studio");
      });
    void Promise.all([listDocuments(slug), fetchStudioVisit(slug)])
      .then(([files, visit]) => {
        if (cancelled) return;
        setDocs(files ?? []);
        setVisitNote(visit?.visitNote ?? "");
        setVisitAt(toLocalInput(visit?.visitAt ?? null));
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function saveVisit() {
    if (!visitAt) {
      toast.error("Choose a date and time");
      return;
    }
    setBusy(true);
    try {
      await scheduleStudioVisit(slug, new Date(visitAt).toISOString(), visitNote);
      toast.success("Studio visit saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the visit");
    } finally {
      setBusy(false);
    }
  }

  async function openDoc(path: string) {
    try {
      const url = await signedDocumentUrl(path);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the file");
    }
  }

  async function decide(decision: "approve" | "reject" | "ask_changes") {
    if (!file) return;
    const pct = Number(payout) / 100;
    if (!Number.isFinite(pct) || pct < 0.5 || pct > 0.95) {
      toast.error("Payout needs to be between 50% and 95%");
      return;
    }
    setBusy(true);
    try {
      const result = await adminReviewProvider({
        slug: file.slug,
        decision,
        classId: klass,
        payoutPct: pct,
        note,
      });
      const mailed = await mailDecision(result, decision, note);
      announce(
        decision === "approve"
          ? "provider_approved"
          : decision === "reject"
            ? "provider_rejected"
            : "provider_changes",
        file.slug,
      );
      const next = await fetchProviderFile(file.slug);
      if (next) setFile(next);
      toast.success(
        mailed.ok
          ? decision === "approve"
            ? `Approved. Confirmation sent to ${result.email}`
            : "Decision saved and emailed"
          : `Decision saved. Email was not sent${mailed.error ? `: ${mailed.error}` : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update application");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <p className="type-body-s text-destructive">{error}</p>;
  }
  if (!file) {
    return <p className="type-body-s text-muted-foreground">Loading this studio…</p>;
  }

  const listed = servicesListed(file);
  const applied = file.appliedAt
    ? new Date(file.appliedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/providers" className="type-body-s-semibold text-burgundy">
        ← Providers
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[28px] leading-[1.2]">{file.name}</h2>
            <StatusPill tone={statusTone(file.status)}>{statusLabel(file.status)}</StatusPill>
          </div>
          <p className="mt-1 type-body-s text-muted-foreground">
            {file.kind || "Studio"} · {file.area} · applied {applied}
          </p>
          <p className="mt-1 type-caption text-muted-foreground">
            {file.ref || "No reference"} · {file.email || "No email on file"} · {file.phone || "No phone"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className={buttonClass({ variant: "secondary", size: "s" })}
            onClick={() => decide("reject")}
          >
            Reject
          </button>
          <button
            type="button"
            disabled={busy}
            className={buttonClass({ variant: "secondary", size: "s" })}
            onClick={() => decide("ask_changes")}
          >
            Ask for changes
          </button>
          <button
            type="button"
            disabled={busy}
            className={buttonClass({ size: "s" })}
            onClick={() => decide("approve")}
          >
            Approve and go live
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h3 className="font-display text-[18px]">What they sent</h3>
          <ul className="mt-3 space-y-2">
            {listed.length === 0 && (
              <li className="type-body-s text-muted-foreground">No services listed yet.</li>
            )}
            {listed.map((line) => (
              <li key={line} className="type-body-s">
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Payout details · </span>
              {file.payoutMethod || "Not added"}
            </p>
            <p>
              <span className="text-muted-foreground">Address · </span>
              {file.address || "No pin yet"}
            </p>
            <p>
              <span className="text-muted-foreground">Home visits · </span>
              {file.homeVisits ? "Yes" : "No"}
            </p>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel>
            <h3 className="font-display text-[18px]">Checks</h3>
            {docs.length === 0 && (
              <p className="mt-2 type-body-s text-muted-foreground">No files uploaded with this application.</p>
            )}
            {docs.map((doc) => (
              <div key={doc.id} className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="type-body-s-semibold">{doc.label}</p>
                  <p className="type-caption text-muted-foreground">
                    {new Date(doc.at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <button type="button" className="type-body-s-semibold text-burgundy" onClick={() => void openDoc(doc.path)}>
                  Open
                </button>
              </div>
            ))}
          </Panel>
          <Panel>
            <h3 className="font-display text-[18px]">Studio visit</h3>
            <label className="mt-3 block">
              <span className="type-caption text-muted-foreground">When</span>
              <input
                type="datetime-local"
                value={visitAt}
                onChange={(event) => setVisitAt(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
              />
            </label>
            <label className="mt-3 block">
              <span className="type-caption text-muted-foreground">Note</span>
              <textarea
                value={visitNote}
                onChange={(event) => setVisitNote(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
              />
            </label>
            <button type="button" disabled={busy} className={buttonClass({ size: "s", className: "mt-3" })} onClick={() => void saveVisit()}>
              Save visit
            </button>
            {file.status === "live" && (
              <a href={`/provider?studio=${encodeURIComponent(file.slug)}`} className="mt-3 block type-body-s-semibold text-burgundy">
                Open this studio
              </a>
            )}
          </Panel>
          <Panel>
            <h3 className="font-display text-[18px]">Class and payout</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="block flex-1">
                <span className="type-caption text-muted-foreground">Class</span>
                <select
                  value={klass}
                  onChange={(event) => setKlass(event.target.value as TierId)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
                >
                  {CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {item[0]!.toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block flex-1">
                <span className="type-caption text-muted-foreground">Payout rate</span>
                <input
                  value={payout}
                  onChange={(event) => setPayout(event.target.value.replace(/[^\d.]/g, ""))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="type-caption text-muted-foreground">Note to the studio</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
              />
            </label>
            <p className="mt-2 type-caption text-muted-foreground">
              Approve, reject, or ask for changes updates this studio and emails {file.email || "the address on the form"}.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function mailDecision(
  result: {
    email: string | null;
    name: string;
    ref: string | null;
    class: TierId;
    payoutPct: number;
  },
  decision: "approve" | "reject" | "ask_changes",
  note: string,
) {
  if (!result.email) return { ok: false, error: "no email on the application" };
  const origin = window.location.origin;
  const statusUrl = `${origin}/providers/status?ref=${encodeURIComponent(result.ref ?? "")}&name=${encodeURIComponent(result.name)}`;
  const sent = await sendTemplateEmail({
    data: {
      to: result.email,
      template:
        decision === "approve"
          ? "provider-approved"
          : decision === "reject"
            ? "provider-rejected"
            : "provider-changes",
      data: {
        company: result.name,
        firstName: result.name.split(/\s+/)[0] || result.name,
        tier: result.class,
        payout: `${Math.round(Number(result.payoutPct) * 100)}% of the cash price`,
        reference: result.ref ?? "",
        message: note,
        ctaUrl: decision === "approve" ? `${origin}/sign-in?as=provider` : statusUrl,
      },
    },
  });
  if (!sent.ok) return { ok: false, error: sent.error ?? "send failed" };
  if (sent.skipped) return { ok: false, error: "email is not configured on the server" };
  return { ok: true };
}
