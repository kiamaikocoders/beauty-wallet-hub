import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon, buttonClass, tierName } from "@/components/site/primitives";
import { AREAS, type ExploreFilters } from "@/lib/explore-data";
import { TIER_ORDER, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Draft = {
  area?: string | undefined;
  tier?: TierId | undefined;
  coinsMin: number;
  coinsMax: number;
  home: boolean;
  today: boolean;
  before8: boolean;
};

export function FiltersSheet({
  open,
  onOpenChange,
  filters,
  resultCount,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExploreFilters;
  resultCount: number;
  onApply: (next: Record<string, string | number | boolean | undefined>) => void;
}) {
  const draft: Draft = {
    area: filters.area,
    tier: filters.tier,
    coinsMin: filters.coinsMin ?? 50,
    coinsMax: filters.coinsMax ?? 600,
    home: !!filters.home,
    today: !!filters.today,
    before8: !!filters.before8,
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-[28px] bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <div className="flex items-start justify-center pb-1.5 pt-2.5">
            <div className="h-[5px] w-10 rounded-[3px] bg-foreground" />
          </div>
          <div className="flex items-center">
            <Dialog.Title className="type-h3 flex-1 text-foreground">Filters</Dialog.Title>
            <Dialog.Close
              className="flex size-11 items-center justify-center"
              aria-label="Close filters"
            >
              <Icon name="x" />
            </Dialog.Close>
          </div>

          <FiltersForm
            key={`${open}-${filters.area}-${filters.tier}-${filters.home}-${filters.today}`}
            initial={draft}
            resultCount={resultCount}
            onClear={() => {
              onApply({
                area: undefined,
                tier: undefined,
                coinsMin: undefined,
                coinsMax: undefined,
                home: undefined,
                today: undefined,
                before8: undefined,
              } as Record<string, string | number | boolean | undefined>);
              onOpenChange(false);
            }}
            onShow={(next) => {
              onApply({
                area: next.area,
                tier: next.tier,
                coinsMin: next.coinsMin !== 50 ? next.coinsMin : undefined,
                coinsMax: next.coinsMax !== 600 ? next.coinsMax : undefined,
                home: next.home || undefined,
                today: next.today || undefined,
                before8: next.before8 || undefined,
              });
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FiltersForm({
  initial,
  resultCount,
  onClear,
  onShow,
}: {
  initial: Draft;
  resultCount: number;
  onClear: () => void;
  onShow: (draft: Draft) => void;
}) {
  const [area, setArea] = useState(initial.area);
  const [tier, setTier] = useState(initial.tier);
  const [coinsMin, setCoinsMin] = useState(initial.coinsMin);
  const [coinsMax, setCoinsMax] = useState(initial.coinsMax);
  const [home, setHome] = useState(initial.home);
  const [today, setToday] = useState(initial.today);
  const [before8, setBefore8] = useState(initial.before8);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-2">
      <section className="flex flex-col gap-3">
        <h3 className="type-body-s-semibold text-foreground">Area</h3>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(area === a ? undefined : a)}>
              {a}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="type-body-s-semibold text-foreground">Provider tier</h3>
        <div className="flex flex-wrap gap-2">
          {TIER_ORDER.map((t) => (
            <Chip key={t} active={tier === t} onClick={() => setTier(tier === t ? undefined : t)}>
              {tierName[t]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="type-body-s-semibold text-foreground">Price in coins</h3>
        <div className="flex items-center justify-between">
          <span className="type-caption text-muted-foreground">{coinsMin} coins</span>
          <span className="type-caption text-muted-foreground">{coinsMax} coins</span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="coins-min">
            Minimum coins
          </label>
          <input
            id="coins-min"
            type="range"
            min={50}
            max={600}
            step={10}
            value={coinsMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCoinsMin(Math.min(v, coinsMax));
            }}
            className="w-full accent-burgundy"
          />
          <label className="sr-only" htmlFor="coins-max">
            Maximum coins
          </label>
          <input
            id="coins-max"
            type="range"
            min={50}
            max={600}
            step={10}
            value={coinsMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCoinsMax(Math.max(v, coinsMin));
            }}
            className="w-full accent-burgundy"
          />
        </div>
      </section>

      <ToggleRow
        title="Home and office visits"
        subtitle="Premium members only"
        checked={home}
        onChange={setHome}
      />
      <ToggleRow
        title="Available today"
        subtitle="Show providers with slots before 8 pm"
        checked={today || before8}
        onChange={(v) => {
          setToday(v);
          setBefore8(v);
        }}
      />

      <div className="mt-auto flex gap-2.5 pt-2">
        <button
          type="button"
          className={buttonClass({ variant: "secondary", full: true })}
          onClick={onClear}
        >
          Clear all
        </button>
        <button
          type="button"
          className={buttonClass({ full: true })}
          onClick={() => onShow({ area, tier, coinsMin, coinsMax, home, today, before8 })}
        >
          Show {resultCount} services
        </button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "type-body-s-medium inline-flex h-11 items-center rounded-full px-4",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center gap-3 text-left"
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="type-body-s-semibold text-foreground">{title}</span>
        <span className="type-caption text-muted-foreground">{subtitle}</span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-burgundy" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow-soft transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
