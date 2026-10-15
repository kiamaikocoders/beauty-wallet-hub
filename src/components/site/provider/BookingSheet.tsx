import * as Dialog from "@radix-ui/react-dialog";
import { Icon, buttonClass } from "@/components/site/primitives";
import { duration, ksh, num } from "@/lib/pricing";
import type { ProviderService } from "@/lib/provider-data";
import type { DayOption, TimeOption } from "./BookingCard";
import { cn } from "@/lib/utils";

export function BookingSheet({
  open,
  onOpenChange,
  selected,
  days,
  times,
  dateKey,
  time,
  onDate,
  onTime,
  joinHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-[18px] overflow-y-auto rounded-t-[28px] bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <div className="flex items-start justify-center pb-1.5 pt-2.5">
            <div className="h-[5px] w-10 rounded-[3px] bg-foreground" />
          </div>
          <div className="flex items-center">
            <Dialog.Title className="type-h3 flex-1 text-foreground">Pick a time</Dialog.Title>
            <Dialog.Close className="flex size-11 items-center justify-center" aria-label="Close">
              <Icon name="x" />
            </Dialog.Close>
          </div>

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
          ) : null}

          <div className="flex justify-between gap-2">
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
                  <span
                    className={cn("type-caption", active ? "text-gold" : "text-muted-foreground")}
                  >
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

          <div className="flex flex-wrap gap-2.5">
            {times.map((t) => {
              const active = t === time;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTime(t)}
                  className={cn(
                    "type-body-s-medium flex h-11 w-[110px] items-center justify-center rounded-md",
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

          <div className="flex items-center gap-2">
            <Icon name="lock" />
            <p className="type-caption text-muted-foreground">
              Coins are held, not spent, until your PIN check-in.
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
            Confirm · {selected ? `${num(selected.coins)} coins` : "—"}
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
