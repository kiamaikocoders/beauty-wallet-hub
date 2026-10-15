import { Icon, buttonClass } from "@/components/site/primitives";
import { duration, ksh, num } from "@/lib/pricing";
import type { ProviderService } from "@/lib/provider-data";
import { cn } from "@/lib/utils";

export type DayOption = { key: string; label: string; day: number; iso: string };
export type TimeOption = string;

export function BookingCard({
  selected,
  days,
  times,
  dateKey,
  time,
  onDate,
  onTime,
  joinHref,
}: {
  selected: ProviderService | null;
  days: DayOption[];
  times: TimeOption[];
  dateKey: string;
  time: string;
  onDate: (key: string) => void;
  onTime: (t: string) => void;
  joinHref: string;
}) {
  return (
    <aside className="flex w-full flex-col gap-3.5 rounded-xl border border-border bg-white p-7 shadow-[0_12px_32px_rgba(23,20,23,0.08)] lg:sticky lg:top-8">
      <h2 className="type-h3 text-foreground">Your booking</h2>

      {selected ? (
        <div className="flex items-center rounded-[14px] bg-blush-subtle p-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="type-body-m-medium text-foreground">{selected.name}</p>
            <p className="type-caption text-muted-foreground">
              {duration(selected.minutes)} · walk-in {ksh(selected.cashKsh)}
            </p>
          </div>
          <p className="type-body-s-semibold shrink-0 whitespace-nowrap text-foreground">
            {num(selected.coins)} coins
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] bg-muted p-3.5">
          <p className="type-body-s text-muted-foreground">Add a service to continue.</p>
        </div>
      )}

      <p className="type-body-s-semibold text-foreground">Date</p>
      <div className="flex gap-2 overflow-x-auto">
        {days.map((d) => {
          const active = d.key === dateKey;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDate(d.key)}
              className={cn(
                "flex h-16 w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[14px]",
                active ? "bg-primary" : "border border-border bg-white",
              )}
            >
              <span className={cn("type-caption", active ? "text-gold" : "text-muted-foreground")}>
                {d.label}
              </span>
              <span
                className={cn(
                  "font-sans text-[28px] font-medium leading-[1.15] tracking-[-0.14px]",
                  active ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {d.day}
              </span>
            </button>
          );
        })}
      </div>

      <p className="type-body-s-semibold text-foreground">Time</p>
      <div className="flex flex-wrap gap-2">
        {times.map((t) => {
          const active = t === time;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTime(t)}
              className={cn(
                "type-body-s-medium flex h-11 w-[76px] items-center justify-center rounded-md",
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-white text-foreground",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex items-center">
        <p className="type-body-m flex-1 text-muted-foreground">Total</p>
        <p className="type-stat text-foreground">
          {selected ? `${num(selected.coins)} coins` : "—"}
        </p>
      </div>

      <a
        href={selected ? joinHref : undefined}
        aria-disabled={!selected}
        className={buttonClass({
          variant: "emphasis",
          full: true,
          ...(!selected ? { className: "pointer-events-none opacity-50" } : {}),
        })}
      >
        Book with coins
      </a>

      <div className="flex items-center gap-2">
        <Icon name="lock" />
        <p className="type-caption text-muted-foreground">
          Coins are held, not spent, until your PIN check-in.
        </p>
      </div>
    </aside>
  );
}
