import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/site/primitives";
import type { TeamsSeat } from "@/lib/teams-demo";
import type { TierId } from "@/lib/pricing";
import { ksh } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { initialsAvatar } from "./TeamsShell";

function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl bg-card p-6 shadow-raised sm:rounded-2xl">
        <h2 className="type-h3 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const TIERS: { id: TierId; label: string; detail: string }[] = [
  { id: "basic", label: "Basic", detail: "700 coins · Ksh 7,000" },
  { id: "intermediate", label: "Intermediate", detail: "1,500 coins · Ksh 15,000" },
  { id: "premium", label: "Premium", detail: "2,000 coins · Ksh 20,000" },
];

export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tier, setTier] = useState<TierId>("intermediate");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <Sheet open={open} title="Invite staff" onClose={onClose}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="type-body-m">Invite sent. They’ll get an SMS with a join link.</p>
          <button
            type="button"
            className={buttonClass({ variant: "primary", full: true })}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <p className="type-body-s text-muted-foreground">
            We text them a link. They join with their phone and their coins are ready. No card
            needed.
          </p>
          <label className="flex flex-col gap-2">
            <span className="type-body-s-medium">Phone number</span>
            <div className="flex gap-2">
              <span className="inline-flex min-h-[52px] items-center rounded-md border border-border bg-muted px-3 type-body-m">
                +254
              </span>
              <input
                required
                className="min-h-[52px] flex-1 rounded-md border border-border bg-card px-4 type-body-m outline-none focus:border-foreground"
                placeholder="0727 614 090"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="type-body-s-medium">Full name</span>
            <input
              required
              className="min-h-[52px] rounded-md border border-border bg-card px-4 type-body-m outline-none focus:border-foreground"
              placeholder="Ruth Chepkoech"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="type-body-s-medium">Team (optional)</span>
            <input
              className="min-h-[52px] rounded-md border border-border bg-card px-4 type-body-m outline-none focus:border-foreground"
              placeholder="Customer care"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="type-body-s-medium mb-1">Tier</legend>
            {TIERS.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border px-4 py-3",
                  tier === t.id ? "border-burgundy bg-blush-subtle" : "border-border bg-card",
                )}
              >
                <span>
                  <span className="block type-body-s-medium">{t.label}</span>
                  <span className="block type-caption text-muted-foreground">{t.detail}</span>
                </span>
                <input
                  type="radio"
                  name="tier"
                  checked={tier === t.id}
                  onChange={() => setTier(t.id)}
                  className="size-4 accent-burgundy"
                />
              </label>
            ))}
          </fieldset>
          <p className="rounded-md bg-muted px-4 py-3 type-body-s">
            Your plan goes to {ksh(261_000)}. This adds seat 21. {ksh(15_000)} a month from Sun 1
            Nov, plus {ksh(8_000)} for the rest of October.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className={buttonClass({ variant: "secondary", full: true })}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={buttonClass({ variant: "emphasis", full: true })}>
              Send invite
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}

export function ChangeTierSheet({
  open,
  seat,
  onClose,
}: {
  open: boolean;
  seat: TeamsSeat | null;
  onClose: () => void;
}) {
  const [tier, setTier] = useState<TierId>("intermediate");
  if (!seat) return null;
  return (
    <Sheet open={open} title={`Change ${seat.fullName.split(" ")[0]}’s tier`} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        {initialsAvatar(seat.initials)}
        <div>
          <p className="type-body-s-medium">
            {seat.fullName} · {seat.team}
          </p>
          <p className="type-caption text-muted-foreground">
            On Basic · {seat.coinsUsed} of {seat.coinsAllowance} coins used this month
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {TIERS.map((t) => (
          <label
            key={t.id}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-md border px-4 py-3",
              tier === t.id ? "border-burgundy bg-blush-subtle" : "border-border bg-card",
            )}
          >
            <span>
              <span className="block type-body-s-medium">{t.label}</span>
              <span className="block type-caption text-muted-foreground">{t.detail}</span>
            </span>
            <span className="type-caption text-muted-foreground">
              {t.id === seat.tier ? "Current" : t.id === "intermediate" ? "Starts next month" : ""}
            </span>
            <input
              type="radio"
              name="change-tier"
              checked={tier === t.id}
              onChange={() => setTier(t.id)}
              className="size-4 accent-burgundy"
            />
          </label>
        ))}
      </div>
      <p className="mt-4 type-body-s text-muted-foreground">
        The change starts on Sun 1 Nov, when your plan renews. Kevin keeps his Basic coins until
        then.
      </p>
      <p className="mt-2 type-body-s-medium">
        Monthly plan {ksh(246_000)} → {ksh(254_000)}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className={buttonClass({ variant: "secondary", full: true })}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={buttonClass({ variant: "emphasis", full: true })}
          onClick={onClose}
        >
          Confirm change
        </button>
      </div>
    </Sheet>
  );
}

export function MoveSeatSheet({
  open,
  seat,
  onClose,
}: {
  open: boolean;
  seat: TeamsSeat | null;
  onClose: () => void;
}) {
  const [when, setWhen] = useState<"now" | "leave">("now");
  const [passCoins, setPassCoins] = useState(true);
  if (!seat) return null;
  return (
    <Sheet open={open} title={`Move ${seat.fullName.split(" ")[0]}’s seat`} onClose={onClose}>
      <p className="mb-4 type-body-s text-muted-foreground">
        {seat.fullName} leaves on Fri 30 Oct. Give his Basic seat to someone new. Your invoice stays
        the same.
      </p>
      <label className="mb-3 flex flex-col gap-2">
        <span className="type-body-s-medium">New person’s phone</span>
        <div className="flex gap-2">
          <span className="inline-flex min-h-[52px] items-center rounded-md border border-border bg-muted px-3">
            +254
          </span>
          <input
            className="min-h-[52px] flex-1 rounded-md border border-border px-4 type-body-m outline-none"
            placeholder="0711 902 344"
          />
        </div>
      </label>
      <label className="mb-4 flex flex-col gap-2">
        <span className="type-body-s-medium">Full name</span>
        <input
          className="min-h-[52px] rounded-md border border-border px-4 type-body-m outline-none"
          placeholder="Samuel Mutua"
        />
      </label>
      <p className="type-body-s-medium mb-2">When</p>
      <div className="mb-4 flex gap-2">
        {(["now", "leave"] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWhen(w)}
            className={cn(
              "rounded-full px-4 py-2 type-body-s",
              when === w ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {w === "now" ? "Now" : "Fri 30 Oct"}
          </button>
        ))}
      </div>
      <p className="type-body-s-medium mb-2">Tom’s 140 unused coins</p>
      <label className="mb-2 flex items-start gap-3 rounded-md border border-border p-3">
        <input
          type="radio"
          checked={passCoins}
          onChange={() => setPassCoins(true)}
          className="mt-1 accent-burgundy"
        />
        <span>
          <span className="block type-body-s-medium">Pass them to Samuel</span>
          <span className="block type-caption text-muted-foreground">
            Samuel starts with 140 coins, then 700 on Sun 1 Nov
          </span>
        </span>
      </label>
      <label className="mb-6 flex items-start gap-3 rounded-md border border-border p-3">
        <input
          type="radio"
          checked={!passCoins}
          onChange={() => setPassCoins(false)}
          className="mt-1 accent-burgundy"
        />
        <span>
          <span className="block type-body-s-medium">Tom keeps them until he leaves</span>
          <span className="block type-caption text-muted-foreground">
            Samuel’s 700 coins start on Sun 1 Nov
          </span>
        </span>
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          className={buttonClass({ variant: "secondary", full: true })}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={buttonClass({ variant: "emphasis", full: true })}
          onClick={onClose}
        >
          Move seat
        </button>
      </div>
    </Sheet>
  );
}
