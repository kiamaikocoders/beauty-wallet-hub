import { Icon } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export function ArrivalPass({
  provider = "Arrival pass · Braid Bar Ngong Rd",
  pin = "7306",
  details = "Sat 10:00 · 528 coins on hold",
  className,
}: {
  provider?: string;
  pin?: string;
  details?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[343px] flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 pb-6 pt-8 shadow-soft",
        className,
      )}
    >
      <p className="type-eyebrow text-muted-foreground">{provider}</p>
      <p className="type-pin text-foreground">{pin}</p>
      <div className="rounded-md bg-background p-3">
        <img
          src="/images/how-it-works/arrival-qr.svg"
          alt=""
          width={168}
          height={168}
          className="size-[168px]"
        />
      </div>
      <p className="type-body-s text-muted-foreground">{details}</p>
      <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-burgundy">
        <Icon name="refresh" size={16} />
        <span className="type-button-s">Refresh PIN</span>
      </button>
    </div>
  );
}
