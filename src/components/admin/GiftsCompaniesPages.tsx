import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { ksh } from "@/lib/pricing";
import {
  extendCompanyInvoice,
  fetchCompanies,
  fetchGifts,
  type CompanyRow,
  type GiftRow,
} from "@/lib/command-center";
import { statusTone } from "./nav";
import { FilterChips, Panel, StatCard, StatusPill, Td, Th } from "./ui";

export function GiftsPage() {
  const [rows, setRows] = useState<GiftRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    void fetchGifts()
      .then((next) => setRows(next ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load gifts"))
      .finally(() => setLoaded(true));
  }, []);

  const waiting = rows.filter((row) => row.status === "waiting" || row.status === "scheduled").length;
  const claimed = rows.filter((row) => row.status === "claimed").length;
  const visible = rows.filter((row) => filter === "All" || row.status === filter.toLowerCase());

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Gifts on record" value={String(rows.length)} delta="Recorded, not collected" deltaTone="muted" />
        <StatCard label="Waiting or scheduled" value={String(waiting)} delta="Claim still open" deltaTone="warning" />
        <StatCard label="Claimed" value={String(claimed)} delta="Marked claimed in the ledger" deltaTone="success" />
      </div>
      <FilterChips
        items={["All", "Waiting", "Scheduled", "Claimed", "Expired"]}
        active={filter}
        onChange={setFilter}
      />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Gift</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Plan</Th>
                <Th>Value</Th>
                <Th>Status</Th>
                <Th>Claim by</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((gift) => (
                <tr key={gift.id} className="border-t border-border">
                  <Td>
                    <Link to="/admin/gifts/$id" params={{ id: gift.id }} className="hover:underline">
                      <p className="type-body-s-semibold">{gift.code}</p>
                      <p className="type-caption text-muted-foreground">{gift.createdAt}</p>
                    </Link>
                  </Td>
                  <Td>{gift.fromName}</Td>
                  <Td>
                    <p>{gift.toName}</p>
                    <p className="type-caption text-muted-foreground">{gift.toPhone || "No phone"}</p>
                  </Td>
                  <Td>
                    <TierBadge tier={gift.tier} />
                  </Td>
                  <Td>{ksh(gift.priceKsh)}</Td>
                  <Td>
                    <StatusPill tone={statusTone(gift.status)}>{gift.status}</StatusPill>
                  </Td>
                  <Td>{gift.claimBy}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loaded && visible.length === 0 && (
          <p className="px-5 py-6 type-body-s text-muted-foreground">
            No gifts in this view. A gift appears here when someone records one on the gift page. Payment is not taken yet.
          </p>
        )}
      </Panel>
    </div>
  );
}

export function GiftDetailPage({ id }: { id: string }) {
  const [gift, setGift] = useState<GiftRow | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void fetchGifts()
      .then((rows) => {
        const found = (rows ?? []).find((row) => row.id === id);
        setGift(found ?? null);
        setMissing(!found);
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return <p className="type-body-s text-muted-foreground">That gift is not in the ledger.</p>;
  }
  if (!gift) return <p className="type-body-s text-muted-foreground">Loading gift…</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/gifts" className="type-body-s-semibold text-burgundy">
        ← Gifts
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[28px]">{gift.code}</h2>
        <StatusPill tone={statusTone(gift.status)}>{gift.status}</StatusPill>
      </div>
      <Panel>
        <ul className="space-y-2 type-body-s">
          <li>From {gift.fromName}</li>
          <li>
            To {gift.toName}
            {gift.toPhone ? ` · ${gift.toPhone}` : ""}
          </li>
          <li>
            {gift.tier} · {gift.coins.toLocaleString("en-KE")} coins · {ksh(gift.priceKsh)} recorded
          </li>
          <li>Claim by {gift.claimBy}</li>
          <li>Recorded {gift.createdAt}</li>
        </ul>
        <p className="mt-4 type-caption text-muted-foreground">
          This row is the gift record. M-Pesa and card collection are not connected, so the status stays waiting until a claim is recorded later.
        </p>
      </Panel>
    </div>
  );
}

export function CompaniesPage() {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchCompanies()
      .then((next) => setRows(next ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load companies"))
      .finally(() => setLoaded(true));
  }, []);

  const seats = rows.reduce((sum, row) => sum + row.seats, 0);
  const open = rows.reduce((sum, row) => sum + row.amountKsh, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Companies" value={String(rows.length)} delta="From the teams ledger" deltaTone="muted" />
        <StatCard label="Active seats" value={String(seats)} delta="Invited seats are separate" deltaTone="muted" />
        <StatCard label="Open invoices" value={ksh(open)} delta="Due or overdue" deltaTone="warning" />
      </div>
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Company</Th>
                <Th>Billing</Th>
                <Th>Active seats</Th>
                <Th>Invited</Th>
                <Th>Open</Th>
                <Th>Due</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((company) => (
                <tr key={company.id} className="border-t border-border">
                  <Td>
                    <Link to="/admin/companies/$id" params={{ id: company.id }} className="type-body-s-semibold hover:underline">
                      {company.name}
                    </Link>
                  </Td>
                  <Td>{company.email}</Td>
                  <Td>{company.seats}</Td>
                  <Td>{company.invited}</Td>
                  <Td>{ksh(company.amountKsh)}</Td>
                  <Td>{company.dueOn || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loaded && rows.length === 0 && (
          <p className="px-5 py-6 type-body-s text-muted-foreground">No companies have been created yet.</p>
        )}
      </Panel>
    </div>
  );
}

export function CompanyDetailPage({ id }: { id: string }) {
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [missing, setMissing] = useState(false);
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    void fetchCompanies()
      .then((rows) => {
        const found = (rows ?? []).find((row) => row.id === id) ?? null;
        setCompany(found);
        setMissing(!found);
      })
      .catch(() => setMissing(true));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function extend() {
    if (!due) return;
    setBusy(true);
    try {
      await extendCompanyInvoice(id, due);
      toast.success("Open invoices moved to the new due date");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move the due date");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <p className="type-body-s text-muted-foreground">That company is not in the ledger.</p>;
  if (!company) return <p className="type-body-s text-muted-foreground">Loading company…</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/companies" className="type-body-s-semibold text-burgundy">
        ← Companies
      </Link>
      <h2 className="font-display text-[28px]">{company.name}</h2>
      <Panel>
        <ul className="space-y-2 type-body-s">
          <li>{company.email}</li>
          <li>{company.phone}</li>
          <li>
            {company.seats} active seats · {company.invited} invited
          </li>
          <li>
            Open invoices {ksh(company.amountKsh)}
            {company.dueOn ? ` · soonest ${company.dueOn}` : ""}
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="type-caption text-muted-foreground">New due date</span>
            <input
              type="date"
              value={due}
              onChange={(event) => setDue(event.target.value)}
              className="mt-1 rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
            />
          </label>
          <button
            type="button"
            disabled={busy || !due || company.amountKsh === 0}
            className={buttonClass({ size: "s" })}
            onClick={() => void extend()}
          >
            Move open invoices
          </button>
        </div>
        {company.amountKsh === 0 && (
          <p className="mt-3 type-caption text-muted-foreground">There is no due or overdue invoice to move.</p>
        )}
      </Panel>
    </div>
  );
}
