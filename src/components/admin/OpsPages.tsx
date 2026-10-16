import { useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import {
  BOOKINGS,
  DISPUTE_DETAIL,
  DISPUTES,
  FINANCE,
  PAYOUTS,
  SETTINGS,
  ADMIN_USER,
} from "@/lib/admin-seed";
import { adminApprovePayoutRun, adminResolveDispute } from "@/lib/admin-api";
import { statusTone } from "./nav";
import {
  CardPanel,
  FilterChips,
  ModalShell,
  Panel,
  SectionTitle,
  StatCard,
  StatusPill,
  Td,
  Th,
} from "./ui";

export function BookingsPage() {
  const [tab, setTab] = useState("Today · 164");
  return (
    <div className="flex flex-col gap-5">
      <FilterChips
        items={["Today · 164", "Upcoming · 1,206", "Cancelled · 38", "No-shows · 6"]}
        active={tab}
        onChange={setTab}
      />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Time</Th>
                <Th>Member</Th>
                <Th>Service and provider</Th>
                <Th>Coins</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {BOOKINGS.map((b, i) => (
                <tr key={i} className="border-t border-border">
                  <Td className="type-body-s-semibold">{b.time}</Td>
                  <Td>
                    <p className="type-body-s-semibold">{b.member}</p>
                    <TierBadge tier={b.plan} className="mt-1" />
                  </Td>
                  <Td>
                    <p className="type-body-s-semibold">{b.service}</p>
                    <p className="type-caption text-muted-foreground">{b.provider}</p>
                  </Td>
                  <Td>{b.coins}</Td>
                  <Td>
                    <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          Showing 7 of 164 today, newest first
        </p>
      </Panel>
    </div>
  );
}

export function DisputesPage() {
  const [selected, setSelected] = useState(DISPUTES[0]?.code ?? "D-1042");
  const [decision, setDecision] = useState("full");
  const [note, setNote] = useState(DISPUTE_DETAIL.note);
  const [busy, setBusy] = useState(false);
  const d = DISPUTE_DETAIL;

  async function resolve() {
    setBusy(true);
    try {
      await adminResolveDispute({
        code: selected,
        decision: decision as "redo" | "half" | "full",
        note,
      });
      toast.success("Resolve and tell both");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resolve dispute");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill tone="warning">Open · 4</StatusPill>
        <p className="type-body-s text-muted-foreground">Reply within 24 hours</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel padding="p-0" className="overflow-hidden">
          {DISPUTES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelected(item.code)}
              className={`flex w-full flex-col gap-1 border-b border-border px-5 py-4 text-left last:border-b-0 ${
                selected === item.code ? "bg-muted/50" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="type-body-s-semibold">
                  {item.code} · {item.member}
                </p>
                <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
              </div>
              <p className="type-caption text-muted-foreground">{item.when}</p>
              <p className="type-body-s">{item.service}</p>
              <p className="type-caption text-muted-foreground">{item.coins}</p>
            </button>
          ))}
        </Panel>

        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[22px]">{d.title}</h2>
            <StatusPill tone="info">{d.status}</StatusPill>
          </div>
          {[
            ["Visit", d.visit],
            ["Provider", d.provider],
            ["PIN given", d.pin],
            ["Paid", d.paid],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-t border-border pt-3">
              <span className="type-body-s text-muted-foreground">{k}</span>
              <span className="text-right type-body-s-semibold">{v}</span>
            </div>
          ))}
          <div className="rounded-md bg-muted p-4">
            <p className="type-body-s-semibold">{d.memberMsg.who}</p>
            <p className="mt-1 type-body-s">{d.memberMsg.body}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted type-label-s">
                {d.providerMsg.initials}
              </span>
              <p className="type-body-s-semibold">{d.providerMsg.who}</p>
            </div>
            <p className="mt-2 type-body-s">{d.providerMsg.body}</p>
          </div>
          <div>
            <p className="type-body-s-semibold">Decision</p>
            <div className="mt-2 flex flex-col gap-2">
              {d.decisions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    decision === opt.id ? "border-foreground bg-muted/40" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === opt.id}
                    onChange={() => setDecision(opt.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block type-body-s-semibold">{opt.title}</span>
                    <span className="type-caption text-muted-foreground">{opt.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="type-caption text-muted-foreground">Note to both</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className={buttonClass({ className: "self-start" })}
            onClick={resolve}
          >
            Resolve and tell both
          </button>
        </Panel>
      </div>
    </div>
  );
}

export function PayoutsPage() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("482");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    try {
      await adminApprovePayoutRun({ runDate: "2026-10-13", code });
      toast.success("Approve Ksh 2,684,300");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not approve run");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" className={buttonClass({ size: "s" })} onClick={() => setOpen(true)}>
          Approve run
        </button>
      </div>
      <div>
        <h2 className="font-display text-[22px]">Tuesday run · 13 Oct</h2>
        <p className="mt-1 type-body-s text-muted-foreground">{PAYOUTS.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PAYOUTS.cards.map((c) => (
          <CardPanel key={c.label}>
            <p className="type-caption text-muted-foreground">{c.label}</p>
            <p className="type-h3">{c.value}</p>
            <p className="type-caption text-muted-foreground">{c.sub}</p>
          </CardPanel>
        ))}
      </div>
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Provider</Th>
                <Th>Visits</Th>
                <Th>Earned</Th>
                <Th>Adjusted</Th>
                <Th>Payout</Th>
                <Th>To</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS.rows.map((r) => (
                <tr key={r.provider} className="border-t border-border">
                  <Td className="type-body-s-semibold">{r.provider}</Td>
                  <Td>{r.visits}</Td>
                  <Td>{r.earned}</Td>
                  <Td>{r.adjusted}</Td>
                  <Td className="type-body-s-semibold">{r.payout}</Td>
                  <Td>{r.to}</Td>
                  <Td>
                    <StatusPill tone={r.hold ? "error" : "success"}>{r.status}</StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          Showing issues first, then 4 of 64 ready providers
        </p>
      </Panel>

      <ModalShell
        open={open}
        title="Approve the 13 Oct run?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className={buttonClass({ variant: "secondary", size: "s" })}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClass({ size: "s" })}
              disabled={busy}
              onClick={approve}
            >
              Approve Ksh 2,684,300
            </button>
          </>
        }
      >
        {[
          ["Providers", PAYOUTS.approve.providers],
          ["Total", PAYOUTS.approve.total],
          ["Held back", PAYOUTS.approve.held],
          ["Sends", PAYOUTS.approve.sends],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-border py-3">
            <span className="type-body-s text-muted-foreground">{k}</span>
            <span className="text-right type-body-s-semibold">{v}</span>
          </div>
        ))}
        <label className="mt-4 block">
          <span className="type-caption text-muted-foreground">
            Code from your authenticator app
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 tracking-[0.3em] type-body-m"
            placeholder="4 8 2 _ _ _"
          />
        </label>
        <p className="mt-3 type-caption text-muted-foreground">{PAYOUTS.approve.note}</p>
      </ModalShell>
    </div>
  );
}

export function FinancePage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
          Download report
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FINANCE.stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} delta={s.sub} deltaTone="muted" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="Revenue and payouts, Ksh millions" />
          <div className="mt-6 flex h-48 items-end gap-6">
            {[
              { m: "Jul", rev: 70, pay: 40 },
              { m: "Aug", rev: 78, pay: 44 },
              { m: "Sep", rev: 86, pay: 48 },
              { m: "Oct so far", rev: 92, pay: 52 },
            ].map((b) => (
              <div key={b.m} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t-md bg-burgundy" style={{ height: `${b.rev}%` }} />
                  <div className="w-1/3 rounded-t-md bg-blush" style={{ height: `${b.pay}%` }} />
                </div>
                <span className="type-caption text-muted-foreground">{b.m}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 type-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-burgundy" /> Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blush" /> Provider payouts
            </span>
          </div>
        </Panel>
        <Panel padding="p-0" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-display text-[18px]">Margin by plan and class</h3>
            <span className="type-body-s-semibold text-muted-foreground">9.1% overall</span>
          </div>
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <Th>Member plan → provider class</Th>
                <Th>Visits</Th>
                <Th>Margin</Th>
              </tr>
            </thead>
            <tbody>
              {FINANCE.marginRows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <Td>
                    {r.member} → {r.provider}
                  </Td>
                  <Td>{r.visits}</Td>
                  <Td>
                    <StatusPill
                      tone={r.tone === "bad" ? "error" : r.tone === "warn" ? "warning" : "success"}
                    >
                      {r.margin}
                    </StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Panel>
        <SectionTitle
          title="Coin liability"
          action={
            <span className="type-body-s-semibold text-muted-foreground">1 coin = Ksh 10</span>
          }
        />
        <div className="mt-2">
          {FINANCE.liability.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
            >
              <span className="type-body-s text-muted-foreground">{row.label}</span>
              <span className="type-body-s">{row.coins}</span>
              <span className="type-body-s-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <SectionTitle
          title="Admins and roles"
          action={
            <button type="button" className={buttonClass({ size: "s" })}>
              Invite admin
            </button>
          }
        />
        <div className="mt-4 flex flex-col gap-3">
          {SETTINGS.admins.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              {a.avatar ? (
                <img src={ADMIN_USER.avatar} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-muted type-label-s">
                  {a.initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="type-body-s-semibold">{a.name}</p>
                <p className="type-caption text-muted-foreground">{a.detail}</p>
              </div>
              <StatusPill tone="neutral">{a.role}</StatusPill>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionTitle
          title="Audit log"
          action={
            <button type="button" className={buttonClass({ variant: "ghost", size: "s" })}>
              See all
            </button>
          }
        />
        <div className="mt-2">
          {SETTINGS.audit.map((row, i) => (
            <div key={i} className="flex gap-3 border-t border-border py-3 first:border-t-0">
              <span className="w-16 shrink-0 type-caption text-muted-foreground">{row.when}</span>
              <div>
                <p className="type-body-s-semibold">{row.who}</p>
                <p className="type-body-s text-muted-foreground">{row.what}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Platform rules" />
        {SETTINGS.rules.map((r) => (
          <div
            key={r.label}
            className="mt-3 flex justify-between gap-3 border-t border-border pt-3"
          >
            <span className="type-body-s text-muted-foreground">{r.label}</span>
            <span className="text-right type-body-s-semibold">{r.value}</span>
          </div>
        ))}
        <p className="mt-4 type-caption text-muted-foreground">
          Rule changes need two admins and reach members and providers 30 days ahead.
        </p>
      </Panel>

      <Panel>
        <SectionTitle title="Security" />
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <span className="type-body-s">Two-factor code for every admin</span>
            <input type="checkbox" defaultChecked className="size-4" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <span className="type-body-s">Sign out after 30 minutes idle</span>
            <input type="checkbox" defaultChecked className="size-4" />
          </label>
        </div>
      </Panel>
    </div>
  );
}
