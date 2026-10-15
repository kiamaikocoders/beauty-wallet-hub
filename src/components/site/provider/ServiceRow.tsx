import { Icon } from "@/components/site/primitives";
import { duration, ksh, num } from "@/lib/pricing";
import type { ProviderService } from "@/lib/provider-data";
import { cn } from "@/lib/utils";

export function ServiceRow({
  service,
  selected,
  onToggle,
}: {
  service: ProviderService;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-5 border-b border-border py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="type-body-m-medium text-foreground">{service.name}</p>
        <p className="type-caption text-muted-foreground">
          {duration(service.minutes)} · walk-in {ksh(service.cashKsh)}
        </p>
      </div>
      <p className="type-body-s-semibold shrink-0 whitespace-nowrap text-foreground">
        {num(service.coins)} coins
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={selected ? `Remove ${service.name}` : `Add ${service.name}`}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-blush" : "border border-foreground bg-white",
        )}
      >
        <Icon name={selected ? "check" : "plus"} />
      </button>
    </div>
  );
}
