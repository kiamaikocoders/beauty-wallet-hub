import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { adminAdjustCoins } from "@/lib/admin-api";
import { fetchAdminDirectory, type LiveMember } from "@/lib/admin-live";
import { fetchMemberFile, type MemberFile } from "@/lib/admin-ops";
import { setMemberStatus } from "@/lib/command-center";
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

  const rows = (live ?? []).filter((member) => {
    if (filter === "All") return true;
    if (filter === "Renewal issues") {
      return member.status.includes("fail") || member.status.toLowerCase().includes("renewal") || member.status === "cancelled";
    }
    return member.plan === filter.toLowerCase();
  });
  const issues = (live ?? []).filter((member) => member.status !== "active").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={String(live?.length ?? "…")} />
        <StatCard
          label="Renewal issues"
          value={String(issues)}
        />
        <StatCard
          label="Coins in these wallets"
          value={rows.reduce((sum, member) => sum + member.available, 0).toLocaleString("en-KE")}
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
  const [file, setFile] = useState<MemberFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [coins, setCoins] = useState("50");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    void fetchMemberFile(id)
      .then((next) => {
        if (!next) setError("This member is not in the database.");
        else {
          setFile(next);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load member");
      });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function pauseOrResume() {
    if (!file) return;
    const next = file.status === "paused" ? "active" : "paused";
    setBusy(true);
    try {
      await setMemberStatus(file.id, next);
      toast.success(next === "paused" ? "Plan paused" : "Plan resumed");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the plan");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!file) return;
    const amount = Number(coins) || 0;
    if (!reason.trim() || amount === 0) {
      toast.error("Enter coins and a reason");
      return;
    }
    setBusy(true);
    try {
      await adminAdjustCoins({
        memberKey: file.id,
        coins: mode === "add" ? amount : -amount,
        reason,
      });
      toast.success(mode === "add" ? `Added ${amount} coins` : `Removed ${amount} coins`);
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not adjust coins");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="type-body-s text-destructive">{error}</p>;
  if (!file) return <p className="type-body-s text-muted-foreground">Loading member…</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/members" className="type-body-s-semibold text-burgundy">
        ← Members
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[28px] leading-[1.2]">{file.name}</h2>
            <TierBadge tier={file.plan} />
            <StatusPill tone={statusTone(file.status)}>{file.status}</StatusPill>
          </div>
          <p className="mt-1 type-body-s text-muted-foreground">
            {file.area} · {file.email || "no email"} · {file.phone || "no phone"} · renews {file.renews}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={buttonClass({ variant: "secondary", size: "s" })} onClick={() => void pauseOrResume()}>
            {file.status === "paused" ? "Resume plan" : "Pause plan"}
          </button>
          <button type="button" className={buttonClass({ size: "s" })} onClick={() => setOpen(true)}>
            Adjust coins
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CardPanel>
          <p className="type-caption text-muted-foreground">Available</p>
          <p className="type-stat">{file.available.toLocaleString("en-KE")}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">On hold</p>
          <p className="type-stat">{file.onHold.toLocaleString("en-KE")}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">Visits</p>
          <p className="type-stat">{file.visits}</p>
        </CardPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel padding="p-0" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-[18px]">Coin ledger</h3>
          </div>
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <Th>When</Th>
                <Th>Type</Th>
                <Th>Note</Th>
                <Th className="text-right">Coins</Th>
              </tr>
            </thead>
            <tbody>
              {file.ledger.map((row, index) => (
                <tr key={row.at + index} className="border-t border-border">
                  <Td>{row.at}</Td>
                  <Td>{row.kind}</Td>
                  <Td>{row.note || "—"}</Td>
                  <Td className="text-right type-body-s-semibold">{row.coins}</Td>
                </tr>
              ))}
              {file.ledger.length === 0 && (
                <tr>
                  <Td className="type-body-s text-muted-foreground">No coin movements yet.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
        <Panel padding="p-0" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-[18px]">Recent visits</h3>
          </div>
          <ul>
            {file.bookings.map((booking, index) => (
              <li key={booking.when + index} className="border-t border-border px-5 py-3">
                <p className="type-body-s-semibold">{booking.provider}</p>
                <p className="type-caption text-muted-foreground">
                  {booking.when} · {booking.status} · {booking.coins} coins
                </p>
              </li>
            ))}
            {file.bookings.length === 0 && (
              <li className="px-5 py-4 type-body-s text-muted-foreground">No visits yet.</li>
            )}
          </ul>
        </Panel>
      </div>

      <ModalShell
        open={open}
        title={`Adjust coins for ${file.name.split(" ")[0]}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className={buttonClass({ variant: "secondary", size: "s" })} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className={buttonClass({ size: "s" })} disabled={busy} onClick={submit}>
              {mode === "add" ? `Add ${coins} coins` : `Remove ${coins} coins`}
            </button>
          </>
        }
      >
        <div className="flex gap-2">
          {(["add", "remove"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={buttonClass({ variant: mode === key ? "primary" : "secondary", size: "s" })}
            >
              {key === "add" ? "Add coins" : "Remove coins"}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="type-caption text-muted-foreground">Coins</span>
          <input
            value={coins}
            onChange={(event) => setCoins(event.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
          />
        </label>
        <label className="mt-3 block">
          <span className="type-caption text-muted-foreground">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
          />
        </label>
      </ModalShell>
    </div>
  );
}

