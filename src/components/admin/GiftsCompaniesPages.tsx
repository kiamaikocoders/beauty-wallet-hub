import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge } from "@/components/site/primitives";
import { COMPANIES, COMPANY_DETAIL, GIFT_DETAIL, GIFTS } from "@/lib/admin-seed";
import { adminExtendCompanyDueDate } from "@/lib/admin-api";
import { statusTone } from "./nav";
import { CardPanel, FilterChips, ModalShell, Panel, StatCard, StatusPill, Td, Th } from "./ui";

export function GiftsPage() {
  const [filter, setFilter] = useState("All");
  const rows = GIFTS.filter((gift) => {
    if (filter === "All") return true;
    const key = filter.split(" ")[0]?.toLowerCase() ?? "";
    return gift.status.toLowerCase().startsWith(key);
  });
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
          Export
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gifts sent in October"
          value="86"
          delta="Ksh 1,100,000 paid"
          deltaTone="muted"
        />
        <StatCard
          label="Claim rate"
          value="83%"
          delta="Claimed within 30 days"
          deltaTone="success"
        />
        <StatCard
          label="Waiting to be claimed"
          value="12"
          delta="3 expire this week"
          deltaTone="warning"
        />
        <StatCard
          label="Expired, not claimed"
          value="3"
          delta="Ksh 37,000 held"
          deltaTone="muted"
        />
      </div>
      <FilterChips
        items={["All", "Waiting · 12", "Scheduled", "Claimed", "Expired"]}
        active={filter}
        onChange={setFilter}
      />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Gift</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Plan</Th>
                <Th>Value</Th>
                <Th>Status</Th>
                <Th>Claim by / claimed</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-t border-border">
                  <Td>
                    <Link to="/admin/gifts/$id" params={{ id: g.id }} className="hover:underline">
                      <p className="type-body-s-semibold">{g.id}</p>
                      <p className="type-caption text-muted-foreground">{g.date}</p>
                    </Link>
                  </Td>
                  <Td>{g.from}</Td>
                  <Td>
                    <p>{g.to}</p>
                    <p className="type-caption text-muted-foreground">{g.channel}</p>
                  </Td>
                  <Td>
                    <TierBadge tier={g.plan} />
                  </Td>
                  <Td>{g.value}</Td>
                  <Td>
                    <StatusPill tone={statusTone(g.status)}>{g.status}</StatusPill>
                  </Td>
                  <Td>{g.claim}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="type-caption text-muted-foreground">
            Showing {rows.length} of {GIFTS.length} gifts on this list
          </p>
          <button type="button" className={buttonClass({ variant: "ghost", size: "s" })}>
            Load more
          </button>
        </div>
      </Panel>
    </div>
  );
}

export function GiftDetailPage({ id }: { id: string }) {
  const g = GIFT_DETAIL;
  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/gifts" className="type-body-s-semibold text-burgundy">
        ← Gifts
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[28px]">Gift {id || g.id}</h2>
        <StatusPill tone="success">{g.status}</StatusPill>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          {[
            ["Plan", g.plan],
            ["Paid", g.paid],
            ["Payment ref", g.paymentRef],
            ["From", g.from],
            ["To", g.to],
            ["Claimed", g.claimed],
            ["Use by", g.useBy],
            ["Coins used", g.coinsUsed],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <span className="type-body-s text-muted-foreground">{k}</span>
              <span className="text-right type-body-s-semibold">{v}</span>
            </div>
          ))}
          <div className="mt-2 rounded-md bg-muted p-4">
            <p className="type-caption text-muted-foreground">Message</p>
            <p className="mt-1 type-body-m">{g.message}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
              Resend receipt
            </button>
            <a href="/admin/members/amani" className={buttonClass({ size: "s" })}>
              Open Nadia’s wallet
            </a>
          </div>
        </Panel>
        <Panel>
          <h3 className="font-display text-[18px]">Timeline</h3>
          <div className="mt-4 space-y-4">
            {g.timeline.map((t) => (
              <div key={t.title} className="border-l-2 border-gold pl-4">
                <p className="type-body-s-semibold">{t.title}</p>
                <p className="type-caption text-muted-foreground">{t.when}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function companyMatches(status: string, filter: string) {
  if (filter === "All") return true;
  if (filter.startsWith("Active")) return status.startsWith("Active");
  if (filter.startsWith("Setting")) return status.toLowerCase().includes("setting");
  return /overdue|paused|unpaid/i.test(status);
}

export function CompaniesPage() {
  const [filter, setFilter] = useState("All");
  const [extendOpen, setExtendOpen] = useState(false);
  const [due, setDue] = useState(COMPANY_DETAIL.extend.defaultDate);
  const [resume, setResume] = useState(true);
  const [reason, setReason] = useState(COMPANY_DETAIL.extend.reason);
  const [busy, setBusy] = useState(false);

  async function extend() {
    setBusy(true);
    try {
      await adminExtendCompanyDueDate({
        companyId: "westlands-creative",
        dueDate: due,
        resumeCoins: resume,
        reason,
      });
      toast.success(`Extend to ${due}`);
      setExtendOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not extend due date");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" className={buttonClass({ size: "s" })}>
          Set up a company
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Companies" value="5" delta="1 setting up" deltaTone="muted" />
        <StatCard label="Seats" value="223" delta="133 staff joined" deltaTone="muted" />
        <StatCard
          label="Monthly invoices"
          value="Ksh 2,607,000"
          delta="Next run Sun 1 Nov"
          deltaTone="muted"
        />
        <StatCard label="Overdue" value="1" delta="Ksh 56,000 · coins paused" deltaTone="warning" />
      </div>
      <FilterChips
        items={["All", "Active 3", "Setting up 1", "Overdue 1"]}
        active={filter}
        onChange={setFilter}
      />
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-muted/60">
              <tr>
                <Th>Company</Th>
                <Th>Seats</Th>
                <Th>Monthly</Th>
                <Th>Pays with</Th>
                <Th>Status</Th>
                <Th>Next invoice</Th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.filter((c) => companyMatches(c.status, filter)).map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <Td>
                    <Link
                      to="/admin/companies/$id"
                      params={{ id: c.id }}
                      className="hover:underline"
                    >
                      <p className="type-body-s-semibold">{c.name}</p>
                      <p className="type-caption text-muted-foreground">{c.hr}</p>
                    </Link>
                  </Td>
                  <Td>
                    <p>{c.seats}</p>
                    <p className="type-caption text-muted-foreground">{c.joined}</p>
                  </Td>
                  <Td>{c.monthly}</Td>
                  <Td>{c.pays}</Td>
                  <Td>
                    <StatusPill tone={statusTone(c.status)}>{c.status}</StatusPill>
                  </Td>
                  <Td>
                    {c.id === "westlands-creative" ? (
                      <button
                        type="button"
                        className="type-body-s-semibold text-burgundy"
                        onClick={() => setExtendOpen(true)}
                      >
                        {c.next}
                      </button>
                    ) : (
                      c.next
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 type-caption text-muted-foreground">
          5 companies · 223 seats · 1 overdue
        </p>
      </Panel>

      <ModalShell
        open={extendOpen}
        title="Extend due date"
        subtitle={COMPANY_DETAIL.extend.company}
        onClose={() => setExtendOpen(false)}
        footer={
          <>
            <button
              type="button"
              className={buttonClass({ variant: "secondary", size: "s" })}
              onClick={() => setExtendOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClass({ size: "s" })}
              disabled={busy}
              onClick={extend}
            >
              Extend to {due}
            </button>
          </>
        }
      >
        <p className="type-body-s-semibold">{COMPANY_DETAIL.extend.invoice}</p>
        <StatusPill tone="error" className="mt-2">
          Paused for non-payment
        </StatusPill>
        <p className="mt-3 type-body-s text-muted-foreground">{COMPANY_DETAIL.extend.pauseNote}</p>
        <p className="mt-4 type-caption text-muted-foreground">New due date</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMPANY_DETAIL.extend.dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDue(d)}
              className={buttonClass({ variant: due === d ? "primary" : "secondary", size: "s" })}
            >
              {d}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-md border border-border p-3">
          <input
            type="checkbox"
            checked={resume}
            onChange={(e) => setResume(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block type-body-s-semibold">Resume staff coins now</span>
            <span className="type-caption text-muted-foreground">
              Coins come back today. Pauses again if unpaid on Fri 23 Oct.
            </span>
          </span>
        </label>
        <label className="mt-3 block">
          <span className="type-caption text-muted-foreground">Reason (only admins see this)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m"
          />
        </label>
      </ModalShell>
    </div>
  );
}

export function CompanyDetailPage({ id }: { id: string }) {
  const c = COMPANY_DETAIL;
  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/companies" className="type-body-s-semibold text-burgundy">
        ← Companies
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[28px]">{c.name}</h2>
            <StatusPill tone="success">{c.status}</StatusPill>
          </div>
          <p className="mt-1 type-body-s text-muted-foreground">{c.summary}</p>
          <p className="mt-1 type-caption text-muted-foreground">Id: {id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
            Pause company
          </button>
          <Link to="/admin/companies" className={buttonClass({ variant: "secondary", size: "s" })}>
            Extend due date
          </Link>
          <button type="button" className={buttonClass({ size: "s" })}>
            Adjust seats
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardPanel>
          <p className="type-caption text-muted-foreground">Seats</p>
          <p className="type-stat">{c.seats}</p>
          <p className="type-caption text-muted-foreground">{c.seatsNote}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">Coins used in October</p>
          <p className="type-stat">{c.coinsUsed}</p>
          <p className="type-caption text-muted-foreground">{c.coinsNote}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">Monthly</p>
          <p className="type-stat">{c.monthly}</p>
          <p className="type-caption text-muted-foreground">{c.nextInvoice}</p>
        </CardPanel>
        <CardPanel>
          <p className="type-caption text-muted-foreground">Paid to date</p>
          <p className="type-stat">{c.paidToDate}</p>
          <p className="type-caption text-muted-foreground">{c.paidNote}</p>
        </CardPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-[18px]">Seats by tier</h3>
          {c.tiers.map((t) => (
            <div
              key={t.tier}
              className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"
            >
              <TierBadge tier={t.tier} />
              <span className="type-body-s">{t.seats}</span>
              <span className="type-body-s-semibold">{t.amount}</span>
            </div>
          ))}
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[18px]">Invoices</h3>
            <button type="button" className={buttonClass({ variant: "ghost", size: "s" })}>
              View all
            </button>
          </div>
          {c.invoices.map((inv) => (
            <div
              key={inv.id}
              className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3"
            >
              <div>
                <p className="type-body-s-semibold">{inv.label}</p>
                <p className="type-caption text-muted-foreground">{inv.detail}</p>
              </div>
              <span className="type-body-s-semibold">{inv.amount}</span>
            </div>
          ))}
        </Panel>
        <Panel>
          <h3 className="font-display text-[18px]">HR admins</h3>
          {c.hrs.map((h) => (
            <div key={h.name} className="mt-3 flex items-center gap-3 border-t border-border pt-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted type-label-s">
                {h.initials ??
                  h.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-s-semibold">{h.name}</p>
                <p className="type-caption text-muted-foreground">{h.phone}</p>
              </div>
              <StatusPill tone="neutral">{h.role}</StatusPill>
            </div>
          ))}
        </Panel>
        <Panel>
          <h3 className="font-display text-[18px]">Account</h3>
          {c.account.map((a) => (
            <div
              key={a.label}
              className="mt-3 flex justify-between gap-3 border-t border-border pt-3"
            >
              <span className="type-body-s text-muted-foreground">{a.label}</span>
              <span className="text-right type-body-s-semibold">{a.value}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
