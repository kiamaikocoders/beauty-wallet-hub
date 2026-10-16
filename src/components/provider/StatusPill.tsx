import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type BookingStatus } from "@/lib/provider-portal-data";

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-body-s-medium",
        STATUS_TONE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABEL[status]}
    </span>
  );
}
