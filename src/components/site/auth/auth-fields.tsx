import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/site/primitives";

export const fieldClass =
  "w-full min-h-[50px] rounded-md border border-border bg-card px-4 py-3 type-body-m text-foreground outline-none transition-colors placeholder:text-disabled focus:border-burgundy";

export const labelClass = "type-body-s-medium text-foreground";

export function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string | null;
}) {
  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? <span className="type-caption text-destructive">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cn(fieldClass, className)} />;
}

export function AuthCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px]",
          checked ? "border-burgundy bg-blush" : "border-border bg-card",
        )}
      >
        {checked ? <Icon name="check" size={16} /> : null}
      </span>
      <span className="type-body-s text-foreground">{children}</span>
    </button>
  );
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  function setAt(i: number, char: string) {
    const next = digits.map((d, idx) => (idx === i ? char : d === " " ? "" : d));
    const joined = next.join("").replace(/\s/g, "").slice(0, length);
    onChange(joined);
  }

  return (
    <div className="flex w-full justify-between gap-1.5 sm:gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ?? ""}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i]?.trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            onChange(pasted);
            const focusAt = Math.min(pasted.length, length - 1);
            refs.current[focusAt]?.focus();
          }}
          className={cn(
            "h-14 w-11 rounded-md border bg-white text-center type-stat text-foreground outline-none sm:h-16 sm:w-14",
            error
              ? "border-destructive"
              : digits[i]?.trim()
                ? "border-foreground"
                : "border-border focus:border-2 focus:border-burgundy",
          )}
        />
      ))}
    </div>
  );
}

export function useResendTimer(seconds = 42) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  return {
    left,
    ready: left <= 0,
    label: left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : "Resend code",
    restart: () => setLeft(seconds),
  };
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex w-full rounded-full bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-full type-body-s-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
