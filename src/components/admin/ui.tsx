import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/site/primitives";
import { TierBadge, tierName } from "@/components/site/primitives";
import type { TierId } from "@/lib/pricing";

export function AdminIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={`/images/icons/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Panel({
  children,
  className,
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={cn("rounded-[20px] border border-border bg-white", padding, className)}>
      {children}
    </div>
  );
}

export function CardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5", className)}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "success",
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "success" | "muted" | "warning";
  className?: string;
}) {
  return (
    <CardPanel className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <p className="type-caption text-muted-foreground">{label}</p>
      <p className="type-stat text-foreground">{value}</p>
      {delta && (
        <p
          className={cn(
            "type-caption",
            deltaTone === "success" && "text-success",
            deltaTone === "muted" && "text-muted-foreground",
            deltaTone === "warning" && "text-warning",
          )}
        >
          {delta}
        </p>
      )}
    </CardPanel>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}) {
  const tones = {
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-destructive-bg text-destructive",
    info: "bg-info-bg text-info",
    neutral: "bg-muted text-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 type-caption font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SearchField({
  placeholder,
  className,
  value,
  onChange,
  readOnly,
  title,
}: {
  placeholder: string;
  className?: string;
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  title?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-white px-4 lg:w-[300px]",
        readOnly && "cursor-not-allowed opacity-70",
        className,
      )}
      title={title}
    >
      <AdminIcon name="search" size={20} />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-disabled={readOnly || undefined}
        className="min-w-0 flex-1 bg-transparent type-body-m text-foreground outline-none placeholder:text-muted-foreground read-only:cursor-not-allowed"
      />
    </label>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left type-label-s text-muted-foreground first:pl-5 last:pr-5",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-3.5 type-body-s text-foreground first:pl-5 last:pr-5", className)}>
      {children}
    </td>
  );
}

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="font-display text-[18px] leading-[1.3] text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function FilterChips({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-full px-3.5 py-2 type-body-s-medium transition-colors",
            active === item
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function TierLabel({ tier }: { tier: TierId }) {
  return <TierBadge tier={tier} />;
}

export function MemberCell({
  name,
  area,
  plan,
  initials,
}: {
  name: string;
  area?: string;
  plan?: TierId;
  initials?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted type-label-s text-foreground">
        {initials ??
          name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
      </span>
      <div className="min-w-0">
        <p className="type-body-s-semibold truncate">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {area && <span className="type-caption text-muted-foreground">{area}</span>}
          {plan && <span className="type-caption text-muted-foreground">{tierName[plan]}</span>}
        </div>
      </div>
    </div>
  );
}

export function ModalShell({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 lg:items-center lg:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-[24px] border border-border bg-card shadow-raised lg:max-w-[480px] lg:rounded-[24px]">
        <div className="border-b border-border px-5 py-5">
          <h3 className="font-display text-[22px] leading-[1.25] text-foreground">{title}</h3>
          {subtitle && <p className="mt-1 type-body-s text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function GhostLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(buttonClass({ variant: "ghost", size: "s" }), className)}
    >
      {children}
    </button>
  );
}
