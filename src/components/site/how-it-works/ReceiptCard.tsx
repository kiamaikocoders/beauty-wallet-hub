import { buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export function ReceiptCard({
  serviceLine,
  coinsReleased,
  walletBalance,
  className,
}: {
  serviceLine: string;
  coinsReleased: string;
  walletBalance: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[380px] flex-col gap-3.5 rounded-[20px] bg-white p-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <p className="type-h4 flex-1 text-foreground">Service complete</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="type-body-s-semibold text-success">Completed</span>
        </span>
      </div>
      <p className="type-body-s text-muted-foreground">{serviceLine}</p>
      <div className="h-px w-full bg-border" />
      {[
        ["Coins released to provider", coinsReleased],
        ["Wallet balance", walletBalance],
        ["Paid in cash at the salon", "Ksh 0"],
      ].map(([label, value]) => (
        <div key={label} className="flex items-center text-[14px] leading-[1.45]">
          <p className="flex-1 font-normal text-muted-foreground">{label}</p>
          <p className="shrink-0 font-semibold whitespace-nowrap text-foreground">{value}</p>
        </div>
      ))}
      <button type="button" className={buttonClass({ full: true })}>
        Rate your visit
      </button>
    </div>
  );
}
