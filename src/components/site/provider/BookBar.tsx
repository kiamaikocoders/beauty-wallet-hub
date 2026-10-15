import { buttonClass } from "@/components/site/primitives";
import { num } from "@/lib/pricing";
import type { ProviderService } from "@/lib/provider-data";
import type { DayOption } from "./BookingCard";

export function BookBar({
  selected,
  day,
  time,
  onOpenSheet,
}: {
  selected: ProviderService | null;
  day: DayOption | undefined;
  time: string;
  onOpenSheet: () => void;
}) {
  const summary = selected
    ? `1 service · ${day?.label ?? ""} ${day?.day ?? ""}, ${time}`
    : "Add a service to book";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-caption text-muted-foreground">{summary}</p>
          <p className="type-stat text-foreground">
            {selected ? `${num(selected.coins)} coins` : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSheet}
          disabled={!selected}
          className={buttonClass({
            variant: "emphasis",
            className: "disabled:opacity-50",
          })}
        >
          Book with coins
        </button>
      </div>
    </div>
  );
}
