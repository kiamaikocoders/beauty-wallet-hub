import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { adminResolveDispute } from "@/lib/admin-api";
import { disputeNotice } from "@/lib/command-center";
import { announce } from "@/lib/notices";
import { notifyEmail } from "@/lib/resend";
import { fetchOpsBoard, type OpsBoard, type OpsDispute } from "@/lib/admin-ops";
import { fetchFinance, fetchPayoutLines, fetchRoster, writeAdminNote, type FinanceSnapshot, type PayoutLine } from "@/lib/command-center";
import { ksh } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
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

function bookingTab(bucket: string, tab: string) {
  if (tab.startsWith("Today")) return bucket === "today";
  if (tab.startsWith("Upcoming")) return bucket === "upcoming";
  if (tab.startsWith("Cancelled")) return bucket === "cancelled";
  if (tab.startsWith("No-show")) return bucket === "no_show";
  return true;
}

function prettyStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function BookingsPage() {
  const [board, setBoard] = useState<OpsBoard | null>(null);
  const [tab, setTab] = useState("Today");

  useEffect(() => {
    void fetchOpsBoard().then((next) => {
      if (next) setBoard(next);
    });
  }, []);

  const bookings = board?.bookings ?? [];
  const counts = {
    Today: bookings.filter((row) => row.bucket === "today").length,
    Upcoming: bookings.filter((row) => row.bucket === "upcoming").length,
    Cancelled: bookings.filter((row) => row.bucket === "cancelled").length,
    "No-shows": bookings.filter((row) => row.bucket === "no_show").length,
  };
  const tabs = [
    `Today · ${counts.Today}`,
    `Upcoming · ${counts.Upcoming}`,
    `Cancelled · ${counts.Cancelled}`,
    `No-shows · ${counts["No-shows"]}`,
  ];
  const active = tabs.find((item) => item.startsWith(tab)) ?? tabs[0]!;
  const rows = bookings.filter((booking) => bookingTab(booking.bucket, active));

  return (
    <div className="flex flex-col gap-5">
      <FilterChips items={tabs} active={active} onChange={(item) => setTab(item.split(" · ")[0] ?? item)} />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>When</Th>
                <Th>Member</Th>
                <Th>Service and provider</Th>
                <Th>Coins</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-t border-border">
                  <Td className="type-body-s-semibold">{booking.when}</Td>
                  <Td>
                    <p className="type-body-s-semibold">{booking.member}</p>
                    <TierBadge tier={booking.plan} className="mt-1" />
                  </Td>
                  <Td>
                    <p className="type-body-s-semibold">{booking.service}</p>
                    <p className="type-caption text-muted-foreground">{booking.provider}</p>
                  </Td>
                  <Td>{booking.coins}</Td>
                  <Td>
                    <StatusPill tone={statusTone(prettyStatus(booking.status))}>
                      {prettyStatus(booking.status)}
                    </StatusPill>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td className="type-body-s text-muted-foreground">
                    {board ? "No bookings in this list." : "Loading bookings…"}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          Latest {bookings.length} bookings in the database
        </p>
      </Panel>
    </div>
  );
}

const DECISIONS = [
  { id: "redo", title: "Free redo", detail: "No coins move" },
  { id: "half", title: "Refund half", detail: "Half the visit coins return to the member" },
  { id: "full", title: "Full refund", detail: "All visit coins return to the member" },
];

export function DisputesPage() {
  const [rows, setRows] = useState<OpsDispute[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [decision, setDecision] = useState("full");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    void fetchOpsBoard().then((board) => {
      if (!board) return;
      setRows(board.disputes);
      setLoaded(true);
      setSelected((current) => current ?? board.disputes.find((row) => row.status !== "resolved")?.code ?? board.disputes[0]?.code ?? null);
    });
  }

  useEffect(() => {
    load();
  }, []);

  const current = rows.find((row) => row.code === selected) ?? null;
  const open = rows.filter((row) => row.status !== "resolved").length;

  async function resolve() {
    if (!current) return;
    setBusy(true);
    try {
      const result = await adminResolveDispute({
        code: current.code,
        decision: decision as "redo" | "half" | "full",
        note,
      });
      const notice = await disputeNotice(current.code);
      const origin = window.location.origin;
      const coins = String(notice?.refundCoins ?? result.refundCoins ?? 0);
      if (notice?.memberEmail) {
        notifyEmail({
          to: notice.memberEmail,
          template: "dispute-member",
          data: {
            firstName: notice.memberName.split(/\s+/)[0] || notice.memberName,
            code: notice.code,
            provider: notice.providerName,
            message: note || notice.note || notice.reason,
            coinsReturned: coins,
            ctaUrl: `${origin}/app/wallet`,
          },
        });
      }
      if (notice?.providerEmail) {
        notifyEmail({
          to: notice.providerEmail,
          template: "dispute-studio",
          data: {
            company: notice.providerName,
            fullName: notice.memberName,
            code: notice.code,
            message: note || notice.note || notice.reason,
            coinsReturned: coins,
            ctaUrl: `${origin}/provider`,
          },
        });
      }
      announce("dispute_resolved", current.code);
      const mailed = [notice?.memberEmail, notice?.providerEmail].filter(Boolean).length;
      toast.success(
        result && "refundCoins" in result && Number(result.refundCoins) > 0
          ? `Resolved. ${result.refundCoins} coins returned. ${mailed} email${mailed === 1 ? "" : "s"} queued.`
          : `Dispute resolved. ${mailed} email${mailed === 1 ? "" : "s"} queued.`,
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve dispute");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill tone={open > 0 ? "warning" : "success"}>Open · {open}</StatusPill>
        <p className="type-body-s text-muted-foreground">Decisions update the dispute and the member wallet</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel padding="p-0" className="overflow-hidden">
          {rows.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setSelected(item.code);
                setNote("");
              }}
              className={`flex w-full flex-col gap-1 border-b border-border px-5 py-4 text-left last:border-b-0 ${
                selected === item.code ? "bg-muted/50" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="type-body-s-semibold">
                  {item.code} · {item.member}
                </p>
                <StatusPill tone={statusTone(item.status)}>{prettyStatus(item.status)}</StatusPill>
              </div>
              <p className="type-caption text-muted-foreground">{item.when}</p>
              <p className="type-body-s">{item.service}</p>
              <p className="type-caption text-muted-foreground">{item.coins} coins</p>
            </button>
          ))}
          {loaded && rows.length === 0 && (
            <p className="px-5 py-6 type-body-s text-muted-foreground">No disputes in the database.</p>
          )}
          {!loaded && <p className="px-5 py-6 type-body-s text-muted-foreground">Loading disputes…</p>}
        </Panel>

        <Panel className="flex flex-col gap-4">
          {!current && <p className="type-body-s text-muted-foreground">Select a dispute.</p>}
          {current && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-[22px]">{current.reason}</h2>
                <StatusPill tone={statusTone(current.status)}>{prettyStatus(current.status)}</StatusPill>
              </div>
              {[
                ["Member", current.member],
                ["Provider", current.provider],
                ["Service", current.service],
                ["Coins", String(current.coins)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-t border-border pt-3">
                  <span className="type-body-s text-muted-foreground">{label}</span>
                  <span className="text-right type-body-s-semibold">{value}</span>
                </div>
              ))}
              <div className="rounded-md bg-muted p-4">
                <p className="type-body-s-semibold">{current.member}</p>
                <p className="mt-1 type-body-s">{current.memberMessage || "No member note."}</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="type-body-s-semibold">{current.provider}</p>
                <p className="mt-2 type-body-s">{current.providerMessage || "No provider reply yet."}</p>
              </div>
              {current.status !== "resolved" && (
                <>
                  <div>
                    <p className="type-body-s-semibold">Decision</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {DECISIONS.map((option) => (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                            decision === option.id ? "border-foreground bg-muted/40" : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name="decision"
                            checked={decision === option.id}
                            onChange={() => setDecision(option.id)}
                            className="mt-1"
                          />
                          <span>
                            <span className="block type-body-s-semibold">{option.title}</span>
                            <span className="type-caption text-muted-foreground">{option.detail}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="type-caption text-muted-foreground">Note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
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
                    Resolve
                  </button>
                </>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function PayoutsPage() {
  const [week, setWeek] = useState("");
  const [rows, setRows] = useState<PayoutLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchPayoutLines()
      .then((board) => {
        setWeek(board?.weekStart ?? "");
        setRows(board?.rows ?? []);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load payouts"))
      .finally(() => setLoaded(true));
  }, []);

  const total = rows.reduce((sum, row) => sum + row.earned, 0);
  const visits = rows.reduce((sum, row) => sum + row.visits, 0);

  async function markReviewed() {
    setBusy(true);
    try {
      await writeAdminNote("review_payout_week", { week, total, visits });
      toast.success("This week is marked reviewed. Nothing was sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-body-s-semibold">Week of {week || "—"}</p>
          <p className="type-caption text-muted-foreground">
            Earned on completed and no-show visits. This is a ledger, not a transfer.
          </p>
        </div>
        <button type="button" disabled={busy} className={buttonClass({ size: "s" })} onClick={() => void markReviewed()}>
          Mark week reviewed
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Calculated payout" value={ksh(total)} delta={`${visits} visits`} deltaTone="muted" />
        <StatCard label="Live studios" value={String(rows.length)} delta="Including studios with no visits" deltaTone="muted" />
      </div>
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Studio</Th>
                <Th>Visits</Th>
                <Th>Earned</Th>
                <Th>Payout details</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-t border-border">
                  <Td>
                    <Link to="/admin/providers/$slug" params={{ slug: row.slug }} className="type-body-s-semibold hover:underline">
                      {row.name}
                    </Link>
                  </Td>
                  <Td>{row.visits}</Td>
                  <Td>{ksh(row.earned)}</Td>
                  <Td>{row.method}</Td>
                  <Td>
                    <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loaded && rows.length === 0 && (
          <p className="px-5 py-6 type-body-s text-muted-foreground">No live studios to calculate.</p>
        )}
      </Panel>
    </div>
  );
}

export function FinancePage() {
  const [board, setBoard] = useState<FinanceSnapshot | null>(null);

  useEffect(() => {
    void fetchFinance()
      .then(setBoard)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load finance"));
  }, []);

  const max = Math.max(1, ...(board?.months ?? []).map((month) => Math.max(month.cash, month.payout)));

  return (
    <div className="flex flex-col gap-5">
      <p className="type-body-s text-muted-foreground">
        These figures are the value of visits already booked. They are not money collected or paid out.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visit value this month" value={ksh(board?.cashKshMonth ?? 0)} delta="Menu prices" deltaTone="muted" />
        <StatCard label="Studio share this month" value={ksh(board?.payoutKshMonth ?? 0)} delta="Calculated payout" deltaTone="muted" />
        <StatCard label="Coins spent" value={(board?.coinsSpentMonth ?? 0).toLocaleString("en-KE")} delta={`${board?.visitsMonth ?? 0} visits`} deltaTone="muted" />
        <StatCard label="Coins still in wallets" value={(board?.coinsOutstanding ?? 0).toLocaleString("en-KE")} delta={`${(board?.coinsOnHold ?? 0).toLocaleString("en-KE")} on hold`} deltaTone="warning" />
      </div>
      <Panel>
        <SectionTitle title="Visit value by month" />
        <div className="mt-4 flex h-40 items-end gap-4">
          {(board?.months ?? []).map((month) => (
            <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end gap-1">
                <div className="flex-1 rounded-t bg-burgundy" style={{ height: `${Math.max(4, (month.cash / max) * 112)}px` }} />
                <div className="flex-1 rounded-t bg-gold" style={{ height: `${Math.max(4, (month.payout / max) * 112)}px` }} />
              </div>
              <span className="type-caption text-muted-foreground">{month.month}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 type-caption text-muted-foreground">Burgundy is menu value. Gold is the studio share.</p>
      </Panel>
      <Panel padding="p-0" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-[18px]">This month by plan and class</h3>
        </div>
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <Th>Member plan</Th>
              <Th>Studio class</Th>
              <Th>Visits</Th>
              <Th>Margin</Th>
            </tr>
          </thead>
          <tbody>
            {(board?.mix ?? []).map((row) => (
              <tr key={`${row.member}-${row.provider}`} className="border-t border-border">
                <Td>{row.member}</Td>
                <Td>{row.provider}</Td>
                <Td>{row.visits}</Td>
                <Td>{ksh(row.marginKsh)}</Td>
              </tr>
            ))}
            {board && board.mix.length === 0 && (
              <tr>
                <Td className="type-body-s text-muted-foreground">No visits this month.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function SettingsPage() {
  const [admins, setAdmins] = useState<{ name: string; email: string | null }[]>([]);

  useEffect(() => {
    void fetchRoster()
      .then((rows) => setAdmins(rows ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load admins"));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/sign-in?as=admin";
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <SectionTitle title="Admins" />
        <ul className="mt-3">
          {admins.map((admin) => (
            <li key={admin.email ?? admin.name} className="border-t border-border py-3 first:border-t-0">
              <p className="type-body-s-semibold">{admin.name}</p>
              <p className="type-caption text-muted-foreground">{admin.email || "No email"}</p>
            </li>
          ))}
          {admins.length === 0 && <li className="type-body-s text-muted-foreground">No admin profiles found.</li>}
        </ul>
        <button type="button" className={buttonClass({ variant: "secondary", size: "s", className: "mt-4" })} onClick={() => void signOut()}>
          Sign out
        </button>
      </Panel>
      <Panel>
        <SectionTitle title="Operations" />
        <div className="mt-3 flex flex-col gap-2">
          <Link to="/admin/health" className="type-body-s-semibold text-burgundy">
            Health board
          </Link>
          <Link to="/admin/audit" className="type-body-s-semibold text-burgundy">
            Full audit log
          </Link>
          <Link to="/admin/rates" className="type-body-s-semibold text-burgundy">
            Rate bands
          </Link>
        </div>
        <p className="mt-4 type-caption text-muted-foreground">
          Payment collection and SMS stay off this page until those connections are added.
        </p>
      </Panel>
    </div>
  );
}
