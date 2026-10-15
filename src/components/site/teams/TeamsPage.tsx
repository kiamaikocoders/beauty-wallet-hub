import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Icon, Responsive, Section, buttonClass, tierName } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { ksh, num, pct, type CoinRules, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const TEAM_SIZES = [
  "1 to 10 people",
  "11 to 50 people",
  "51 to 200 people",
  "200+ people",
] as const;

const EXAMPLE_SEATS: { tier: TierId; seats: number }[] = [
  { tier: "basic", seats: 8 },
  { tier: "intermediate", seats: 10 },
  { tier: "premium", seats: 2 },
];

const DASHBOARD_ROWS: {
  name: string;
  tier: TierId;
  used: number;
  total: number;
}[] = [
  { name: "Mercy Wambui", tier: "intermediate", used: 1120, total: 1500 },
  { name: "Kevin Ochieng", tier: "basic", used: 420, total: 700 },
  { name: "Grace Atieno", tier: "premium", used: 1640, total: 2000 },
  { name: "Daniel Kiprop", tier: "intermediate", used: 300, total: 1500 },
];

const BENEFITS = [
  {
    icon: "wallet",
    title: "One monthly invoice",
    body: "Pay for the whole team by M-Pesa or card. No expense claims to chase.",
  },
  {
    icon: "layers",
    title: "Choose tiers per person",
    body: "Mix Basic, Intermediate and Premium across roles and teams.",
  },
  {
    icon: "shield-check",
    title: "Usage, not bookings",
    body: "See seats and coins used. What each person books stays private.",
  },
] as const;

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="type-body-s-medium text-foreground">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={id !== "teams-notes"}
        className="min-h-[52px] w-full rounded-md border border-border bg-card px-[17px] type-body-m text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
      />
    </label>
  );
}

export function TeamsPage({ rules }: { rules: CoinRules }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState<(typeof TEAM_SIZES)[number]>("11 to 50 people");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const exampleRows = EXAMPLE_SEATS.map((row) => ({
    ...row,
    monthly: row.seats * rules.tiers[row.tier].priceKsh,
  }));
  const exampleTotalSeats = exampleRows.reduce((s, r) => s + r.seats, 0);
  const exampleTotalKsh = exampleRows.reduce((s, r) => s + r.monthly, 0);
  const rollover = pct(rules.rolloverPct);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.rpc(
      "submit_teams_enquiry" as never,
      {
        p_company_name: company,
        p_work_email: email,
        p_team_size: teamSize,
        p_phone: phone,
        p_notes: notes || null,
      } as never,
    );
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setCompany("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  return (
    <>
      <Section inner="flex flex-col gap-5 pb-10 pt-5 lg:gap-16 lg:pb-14 lg:pt-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-16">
          <div className="order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1">
            <p className="type-eyebrow text-burgundy">For teams</p>
            <h1 className="type-display-m text-foreground lg:type-display-l">
              Beauty and grooming as a staff benefit.
            </h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              <Responsive
                mobile="A monthly coin wallet for your team. One invoice, no receipts to chase."
                desktop="Give your team a monthly coin wallet for salons, barbers and spas across Nairobi. One invoice, no receipts to chase."
              />
            </p>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3">
              <a
                href="/teams/signup"
                className={buttonClass({ variant: "emphasis", className: "w-full lg:w-auto" })}
              >
                Request a proposal
              </a>
              <Link
                to="/how-it-works"
                className={buttonClass({
                  variant: "ghost",
                  className: "hidden lg:inline-flex",
                })}
              >
                How it works
              </Link>
            </div>
          </div>
          <img
            src="/images/teams/hero.jpg"
            alt="A team enjoying grooming as a staff benefit"
            className="order-1 h-[262px] w-full rounded-xl object-cover lg:order-2 lg:h-[420px] lg:w-[560px] lg:shrink-0"
          />
        </div>
      </Section>

      <Section inner="flex flex-col gap-5 pb-10 lg:flex-row lg:gap-5 lg:pb-14">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-[25px]"
          >
            <span className="flex size-12 items-center justify-center rounded-3xl bg-blush">
              <Icon name={b.icon} size={24} />
            </span>
            <h2 className="type-h4 text-foreground">{b.title}</h2>
            <p className="type-body-s text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </Section>

      <Section inner="flex flex-col gap-6 pb-10 lg:flex-row lg:items-start lg:gap-6 lg:pb-14">
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-7">
          <p className="type-eyebrow text-muted-foreground">Example</p>
          <h2 className="type-h3 text-foreground">A team of twenty, mixed tiers</h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3.5 text-left type-caption text-muted-foreground">Tier</th>
                  <th className="py-3.5 text-left type-caption text-muted-foreground">Seats</th>
                  <th className="py-3.5 text-right type-caption text-muted-foreground">
                    Per month
                  </th>
                </tr>
              </thead>
              <tbody>
                {exampleRows.map((row) => (
                  <tr key={row.tier} className="border-b border-border">
                    <td className="py-4 type-body-s-medium text-foreground">
                      {tierName[row.tier]}
                    </td>
                    <td className="py-4 type-body-m text-foreground">{row.seats}</td>
                    <td className="py-4 text-right type-body-m text-foreground">
                      {ksh(row.monthly)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-4 type-body-s-semibold text-foreground">Total</td>
                  <td className="pt-4 type-body-m text-foreground">{exampleTotalSeats}</td>
                  <td className="pt-4 text-right type-body-s-semibold text-foreground">
                    {ksh(exampleTotalKsh)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="type-caption text-muted-foreground">
            Each person gets their tier’s coins every month and the same {rollover} rollover as any
            member.
          </p>
        </div>

        <div className="flex w-full flex-col rounded-xl border border-border bg-card p-7 lg:w-[500px] lg:shrink-0">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="type-eyebrow text-muted-foreground">Company dashboard</p>
              <p className="type-h3 text-foreground">Savannah Logistics</p>
            </div>
            <div className="text-right">
              <p className="type-h3 text-foreground">20</p>
              <p className="type-caption text-muted-foreground">active seats</p>
            </div>
          </div>
          {DASHBOARD_ROWS.map((row) => {
            const width = Math.round((row.used / row.total) * 100);
            return (
              <div key={row.name} className="flex flex-col gap-2 border-t border-border py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="type-body-s-semibold text-foreground">{row.name}</span>
                  <span className="type-caption text-muted-foreground">{tierName[row.tier]}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-burgundy" style={{ width: `${width}%` }} />
                </div>
                <p className="type-caption text-muted-foreground">
                  {num(row.used)} of {num(row.total)} coins used
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="enquiry"
        inner="flex flex-col gap-6 pb-16 lg:flex-row lg:items-start lg:gap-6 lg:pb-24"
      >
        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-card p-5 lg:p-8"
        >
          <div className="flex flex-col gap-2.5">
            <h2 className="type-h2 text-foreground lg:type-h1">Request a proposal</h2>
            <p className="type-body-m text-muted-foreground">
              <Responsive
                mobile="We reply within one working day."
                desktop="Tell us about your team. We reply within one working day."
              />
            </p>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
            <Field
              label="Company name"
              id="teams-company"
              value={company}
              onChange={setCompany}
              placeholder="Savannah Logistics Ltd"
              className="flex-1"
            />
            <Field
              label="Work email"
              id="teams-email"
              value={email}
              onChange={setEmail}
              placeholder="hr@savannahlogistics.co.ke"
              type="email"
              className="flex-1"
            />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
            <label className="flex flex-1 flex-col gap-2">
              <span className="type-body-s-medium text-foreground">Team size</span>
              <span className="relative">
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value as (typeof TEAM_SIZES)[number])}
                  className="min-h-[52px] w-full appearance-none rounded-md border border-border bg-card px-[17px] pr-12 type-body-m text-foreground outline-none focus:border-foreground"
                >
                  {TEAM_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <Icon
                  name="chevron-down"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </span>
            </label>
            <Field
              label="Your phone number"
              id="teams-phone"
              value={phone}
              onChange={setPhone}
              placeholder="0722 456 789"
              type="tel"
              className="flex-1"
            />
          </div>
          <Field
            label="Anything we should know?"
            id="teams-notes"
            value={notes}
            onChange={setNotes}
            placeholder="Optional"
            className="hidden lg:flex"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className={buttonClass({
              variant: "emphasis",
              className: "w-full self-start lg:w-auto",
            })}
          >
            {status === "sending" ? "Sending…" : "Request a proposal"}
          </button>
          {status === "sent" && (
            <p className="type-body-s text-foreground">
              Thanks — we’ll reply within one working day.
            </p>
          )}
          {status === "error" && (
            <p className="type-body-s text-destructive">
              Something went wrong. Try again or email teams@beautywallet.co.ke.
            </p>
          )}
        </form>

        <aside className="flex w-full flex-col gap-3.5 rounded-xl bg-primary p-7 text-primary-foreground lg:w-[380px] lg:shrink-0">
          <h3 className="type-h3 text-primary-foreground">Prefer to talk?</h3>
          <p className="type-body-s text-gold">
            Call or email and we will build a plan around your team.
          </p>
          <a
            href="tel:0700123456"
            className="mt-2 flex min-h-11 items-center gap-2.5 type-body-s-semibold text-primary-foreground"
          >
            <Icon name="phone-light" size={24} />
            0700 123 456
          </a>
          <a
            href="mailto:teams@beautywallet.co.ke"
            className="flex min-h-11 items-center gap-2.5 type-body-s-semibold text-primary-foreground"
          >
            <Icon name="mail-light" size={24} />
            teams@beautywallet.co.ke
          </a>
        </aside>
      </Section>
    </>
  );
}
