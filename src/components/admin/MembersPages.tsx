import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { MEMBER_DETAIL, MEMBERS } from "@/lib/admin-seed";
import { adminAdjustCoins } from "@/lib/admin-api";
import { fetchAdminDirectory, type LiveMember } from "@/lib/admin-live";
import { statusTone } from "./nav";
import {
  CardPanel,
  FilterChips,
  MemberCell,
  ModalShell,
  Panel,
  StatCard,
  StatusPill,
  Td,
  Th,
} from "./ui";

export function MembersPage() {
  const [filter, setFilter] = useState("All");
  const [live, setLive] = useState<LiveMember[] | null>(null);

  useEffect(() => {
    void fetchAdminDirectory().then((dir) => {
      if (dir) setLive(dir.members);
    });
  }, []);

  const rows = (live ?? MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    area: m.area,
    plan: m.plan,
    available: Number(String(m.available).replace(/,/g, "")) || 0,
    onHold: Number(String(m.onHold).replace(/,/g, "")) || 0,
    visits: Number(m.visits) || 0,
    renews: m.renews,
    status: m.status,
    email: null,
  }))).filter((m) => {
    if (filter === "All") return true;
    if (filter === "Renewal issues") return m.status.includes("fail") || m.status.toLowerCase().includes("renewal");
    return m.plan === filter.toLowerCase();
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
          Export
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active members" value="1,284" delta="+96 this month" />
        <StatCard
          label="Renewal issues"
          value="23"
          delta="Ksh 287,000 to collect"
          deltaTone="warning"
        />
        <StatCard
          label="Cancelled in October"
          value="31"
          delta="2.4% of members"
          deltaTone="muted"
        />
      </div>
      <FilterChips
        items={["All", "Basic", "Intermediate", "Premium", "Renewal issues"]}
        active={filter}
        onChange={setFilter}
      />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Member</Th>
                <Th>Plan</Th>
                <Th>Available</Th>
                <Th>On hold</Th>
                <Th>Visits</Th>
                <Th>Renews</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <Td>
                    <Link to="/admin/members/$id" params={{ id: m.id }}>
                      <MemberCell
                      name={m.name}
                      area={m.area}
                      initials={m.name.slice(0, 2).toUpperCase()}
                    />
                    </Link>
                  </Td>
                  <Td>
                    <TierBadge tier={m.plan} />
                  </Td>
                  <Td className="type-body-s-semibold">{m.available}</Td>
                  <Td>{m.onHold}</Td>
                  <Td>{m.visits}</Td>
                  <Td>{m.renews}</Td>
                  <Td>
                    <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export function MemberDetailPage({ id }: { id: string }) {
  const m = MEMBER_DETAIL;
  const [liveName, setLiveName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetchAdminDirectory().then((dir) => {
      const row = dir?.members.find((member) => member.id === id);
      if (row) setLiveName(`${row.name} · ${row.email ?? "no email"} · ${row.available} coins · ${row.status}`);
    });
  }, [id]);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [coins, setCoins] = useState(String(m.adjust.coins));
  const [reason, setReason] = useState(m.adjust.reason);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const n = Number(coins) || 0;
      await adminAdjustCoins({
        memberKey: id || m.id,
        coins: mode === "add" ? n : -n,
        reason,
      });
      toast.success(mode === "add" ? `Add ${n} coins` : `Remove ${n} coins`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not adjust coins");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/members" className="type-body-s-semibold text-burgundy">
        ← Members
      </Link>
      {liveName ? (
        <p className="type-body-s text-foreground">Live account: {liveName}</p>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[28px] leading-[1.2]">{m.name}</h2>
            <TierBadge tier={m.plan} />
          </div>
          <p className="mt-1 type-body-s text-muted-foreground">{m.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
            Pause plan
          </button>
          <button
            type="button"
            className={buttonClass({ size: "s" })}
            onClick={() => setOpen(true)}
          >
            Adjust coins
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CardPanel>
          <p className="type-caption text-muted-foreground">Available</p>
          <p className="type-stat">{m.available}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">On hold</p>
          <p className="type-stat">{m.onHold}</p>
          <p className="type-caption text-muted-foreground">{m.holdNote}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">Projected rollover</p>
          <p className="type-stat">{m.rollover}</p>
          <p className="type-caption text-muted-foreground">{m.rolloverNote}</p>
        </CardPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel padding="p-0" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-[18px]">Coin ledger, October</h3>
          </div>
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Detail</Th>
                <Th className="text-right">Coins</Th>
              </tr>
            </thead>
            <tbody>
              {m.ledger.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <Td>{row.date}</Td>
                  <Td>{row.type}</Td>
                  <Td>{row.detail}</Td>
                  <Td className="text-right type-body-s-semibold">{row.coins}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel>
            <h3 className="font-display text-[18px]">Plan</h3>
            {[
              ["Plan", m.planCard.plan],
              ["Price", m.planCard.price],
              ["Renews", m.planCard.renews],
              ["Pays with", m.planCard.paysWith],
            ].map(([label, value]) => (
              <div
                key={label}
                className="mt-3 flex justify-between gap-3 border-t border-border pt-3 first:mt-4"
              >
                <span className="type-body-s text-muted-foreground">{label}</span>
                <span className="type-body-s-semibold">{value}</span>
              </div>
            ))}
          </Panel>
          <Panel>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[18px]">Open dispute</h3>
              <StatusPill tone="info">{m.dispute.status}</StatusPill>
            </div>
            <p className="mt-3 type-body-s-semibold">{m.dispute.title}</p>
            <p className="type-caption text-muted-foreground">{m.dispute.detail}</p>
            <Link
              to="/admin/disputes"
              className="mt-3 inline-block type-body-s-semibold text-burgundy"
            >
              Open
            </Link>
          </Panel>
        </div>
      </div>

      <ModalShell
        open={open}
        title={`Adjust coins for ${m.name.split(" ")[0]}`}
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
              onClick={submit}
            >
              {mode === "add" ? `Add ${coins} coins` : `Remove ${coins} coins`}
            </button>
          </>
        }
      >
        <div className="flex gap-2">
          {(["add", "remove"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={buttonClass({
                variant: mode === k ? "primary" : "secondary",
                size: "s",
              })}
            >
              {k === "add" ? "Add coins" : "Remove coins"}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="type-caption text-muted-foreground">Coins</span>
          <input
            value={coins}
            onChange={(e) => setCoins(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
          />
        </label>
        <label className="mt-3 block">
          <span className="type-caption text-muted-foreground">Reason</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
          />
        </label>
        <p className="mt-2 type-caption text-muted-foreground">
          Amani sees this in her wallet. It’s also kept in the audit log.
        </p>
        <p className="mt-3 type-body-s-semibold">Available after</p>
        <p className="type-body-s text-muted-foreground">{m.adjust.after}</p>
      </ModalShell>
    </div>
  );
}
