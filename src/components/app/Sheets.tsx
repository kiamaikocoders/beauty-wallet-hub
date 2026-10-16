import { Link } from "@tanstack/react-router";
import { buttonClass } from "@/components/site/primitives";
import { coinsLabel } from "@/lib/app-data";
import { ksh, num } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-primary/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 shadow-raised lg:max-w-md lg:rounded-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function NotEnoughCoinsSheet({
  open,
  onClose,
  serviceName,
  providerName,
  minutes,
  baseCoins,
  unlockCoins,
  available,
  demo,
}: {
  open: boolean;
  onClose: () => void;
  serviceName: string;
  providerName: string;
  minutes: number;
  baseCoins: number;
  unlockCoins: number;
  available: number;
  demo: string | null;
}) {
  const total = baseCoins + unlockCoins;
  const short = Math.max(0, total - available);
  const pack = short <= 100 ? 100 : short <= 250 ? 250 : 500;
  return (
    <BottomSheet open={open} onClose={onClose}>
      <p className="type-eyebrow text-burgundy">Not enough coins</p>
      <h2 className="mt-2 type-h2">{serviceName}</h2>
      <p className="mt-1 type-body-s text-muted-foreground">
        {providerName} · {minutes} min
      </p>
      <div className="mt-5 space-y-2 rounded-xl bg-muted p-4 type-body-s">
        <Row l="Price at Basic rate" r={coinsLabel(baseCoins)} />
        {unlockCoins > 0 && <Row l="Unlock fee (10%)" r={coinsLabel(unlockCoins)} />}
        <Row l="You have" r={coinsLabel(available)} />
        <Row l="Short by" r={<span className="text-burgundy">{coinsLabel(short)}</span>} />
      </div>
      <p className="mt-5 type-body-s-semibold">Top up to book now</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[100, 250, 500].map((c) => (
          <div
            key={c}
            className={cn(
              "rounded-lg border p-3 text-center",
              c === pack ? "border-burgundy bg-blush-subtle" : "border-border",
            )}
          >
            <p className="type-body-s-semibold">{c} coins</p>
            <p className="type-caption text-muted-foreground">{ksh(c * 10)}</p>
          </div>
        ))}
      </div>
      <Link
        to="/app/wallet/top-up"
        search={{ coins: pack, ...(demo ? { demo } : {}) } as never}
        className={buttonClass({ full: true, className: "mt-5" })}
      >
        Top up {pack} coins · {ksh(pack * 10)}
      </Link>
      <Link
        to="/app/plan"
        search={(demo ? { demo } : {}) as never}
        className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
      >
        See Intermediate plan, no unlock fees
      </Link>
    </BottomSheet>
  );
}

export function SlotTakenSheet({
  open,
  onClose,
  whenLabel,
  stylist,
  alternatives,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  whenLabel: string;
  stylist: string;
  alternatives: { label: string; meta: string; coins: number; value: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="type-h2">That time was just taken</h2>
      <p className="mt-2 type-body-s text-muted-foreground">
        Someone booked {whenLabel} with {stylist} a moment ago. No coins were held from your wallet.
      </p>
      <p className="mt-5 type-body-s-semibold">Closest times</p>
      <ul className="mt-3 space-y-2">
        {alternatives.map((a) => (
          <li key={a.value}>
            <button
              type="button"
              onClick={() => onPick(a.value)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left"
            >
              <span>
                <span className="block type-body-s-semibold">{a.label}</span>
                <span className="type-caption text-muted-foreground">{a.meta}</span>
              </span>
              <span className="type-body-s-semibold">{num(a.coins)} coins</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className={buttonClass({ variant: "secondary", full: true, className: "mt-4" })}
      >
        Pick another time
      </button>
    </BottomSheet>
  );
}

export function CancelSheet({
  open,
  onClose,
  late,
  serviceName,
  whereWhen,
  coins,
  available,
  providerName,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  late: boolean;
  serviceName: string;
  whereWhen: string;
  coins: number;
  available: number;
  providerName: string;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const toProvider = late ? Math.round(coins / 2) : 0;
  const returned = coins - toProvider;
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="type-h2">{late ? "Cancel within 24 hours?" : "Cancel this booking?"}</h2>
      <p className="mt-2 type-body-s-semibold">{serviceName}</p>
      <p className="type-body-s text-muted-foreground">{whereWhen}</p>
      <p className="mt-4 type-body-s text-muted-foreground">
        {late
          ? `Your visit starts in under 24 hours. Half of the held coins go to ${providerName} for the time they reserved for you.`
          : "All held coins come back to your wallet."}
      </p>
      <div className="mt-4 space-y-2 rounded-xl bg-muted p-4 type-body-s">
        {late && <Row l={`To ${providerName}`} r={coinsLabel(toProvider)} />}
        <Row l="Back to your wallet" r={coinsLabel(returned)} />
        <Row l="Available after" r={`${num(available)} → ${num(available + returned)} coins`} />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className={buttonClass({ variant: "emphasis", full: true, className: "mt-5" })}
      >
        {late ? `Cancel and give up ${toProvider} coins` : "Yes, cancel booking"}
      </button>
      <button
        type="button"
        onClick={onClose}
        className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
      >
        Keep booking
      </button>
    </BottomSheet>
  );
}

function Row({ l, r }: { l: string; r: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{l}</span>
      <span className="type-body-s-semibold">{r}</span>
    </div>
  );
}
