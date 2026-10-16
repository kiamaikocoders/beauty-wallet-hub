import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { APPLICATION, PROVIDERS } from "@/lib/admin-seed";
import { adminReviewProvider } from "@/lib/admin-api";
import { statusTone } from "./nav";
import { FilterChips, Panel, StatusPill, Td, Th } from "./ui";
import { useState } from "react";

export function ProvidersPage() {
  const [tab, setTab] = useState("Live · 68");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          items={["Live · 68", "Applications · 9", "Paused · 2"]}
          active={tab}
          onChange={setTab}
        />
        <Link
          to="/admin/providers/$slug"
          params={{ slug: "fade-district" }}
          className={buttonClass({ size: "s" })}
        >
          Invite a provider
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
          All classes
        </button>
        <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
          All areas
        </button>
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
                <Th>Visits, Oct</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((p) => (
                <tr key={p.slug} className="border-t border-border">
                  <Td>
                    <Link
                      to="/admin/providers/$slug"
                      params={{ slug: p.slug }}
                      className="hover:underline"
                    >
                      <p className="type-body-s-semibold">{p.name}</p>
                      <p className="type-caption text-muted-foreground">{p.area}</p>
                    </Link>
                  </Td>
                  <Td>
                    <TierBadge tier={p.class} />
                  </Td>
                  <Td>{p.payout}</Td>
                  <Td>★ {p.rating}</Td>
                  <Td>{p.visits}</Td>
                  <Td>
                    <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          Showing 7 of 68 · sorted by issues first
        </p>
      </Panel>

      {tab.startsWith("Applications") && (
        <Link
          to="/admin/providers/$slug"
          params={{ slug: "fade-district" }}
          className="type-body-s-semibold text-burgundy"
        >
          Open Fade District application →
        </Link>
      )}
    </div>
  );
}

export function ProviderApplicationPage({ slug }: { slug: string }) {
  const app = APPLICATION;
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approve" | "reject" | "ask_changes") {
    setBusy(true);
    try {
      await adminReviewProvider({
        slug: app.slug,
        decision,
        classId: "basic",
        payoutPct: 0.85,
      });
      toast.success(
        decision === "approve"
          ? "Approved and going live"
          : decision === "reject"
            ? "Application rejected"
            : "Asked for changes",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/providers" className="type-body-s-semibold text-burgundy">
        ← Applications
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-[28px] leading-[1.2]">{app.name}</h2>
          <p className="mt-1 type-body-s text-muted-foreground">{app.summary}</p>
          <p className="mt-1 type-caption text-muted-foreground">Slug: {slug}</p>
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
        <Panel padding="p-0" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-[18px]">Services they listed</h3>
          </div>
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <Th>Service</Th>
                <Th>Time</Th>
                <Th>Cash price</Th>
                <Th>Basic coins</Th>
              </tr>
            </thead>
            <tbody>
              {app.services.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <Td className="type-body-s-semibold">{s.name}</Td>
                  <Td>{s.time}</Td>
                  <Td>{s.cash}</Td>
                  <Td>{s.coins}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[18px]">Checks</h3>
              <StatusPill tone="success">4 of 4</StatusPill>
            </div>
            {app.checks.map((c) => (
              <div
                key={c.label}
                className="flex items-start justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
              >
                <div>
                  <p className="type-body-s-semibold">{c.label}</p>
                  <p className="type-caption text-muted-foreground">{c.detail}</p>
                </div>
                <StatusPill tone="success">OK</StatusPill>
              </div>
            ))}
          </Panel>

          <Panel>
            <h3 className="font-display text-[18px]">Class and payout</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="block flex-1">
                <span className="type-caption text-muted-foreground">Class</span>
                <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m">
                  <option>Basic</option>
                  <option>Intermediate</option>
                  <option>Premium</option>
                </select>
                <p className="mt-1 type-caption text-muted-foreground">{app.classNote}</p>
              </label>
              <label className="block flex-1">
                <span className="type-caption text-muted-foreground">Payout rate</span>
                <input
                  defaultValue="85%"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
                />
                <p className="mt-1 type-caption text-muted-foreground">{app.payoutNote}</p>
              </label>
            </div>
            <p className="mt-3 type-body-s text-destructive">{app.marginNote}</p>
          </Panel>

          <Panel>
            <h3 className="font-display text-[18px]">Photos</h3>
            <p className="mt-2 type-body-s text-muted-foreground">{app.photos} uploaded</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-muted" />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
