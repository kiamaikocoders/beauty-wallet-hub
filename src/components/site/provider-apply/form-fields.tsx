import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/site/primitives";

export const fieldClass =
  "w-full min-h-[50px] rounded-md border border-border bg-card px-4 py-3 type-body-m text-foreground outline-none transition-colors placeholder:text-disabled focus:border-burgundy";

export const labelClass = "type-body-s-medium text-foreground";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string | undefined;
}) {
  return (
    <Field label={label} {...(className !== undefined ? { className } : {})}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "appearance-none pr-12")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={24}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        />
      </div>
    </Field>
  );
}

export function RadioRow({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2.5">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <img
        src={checked ? "/images/icons/radio-on.svg" : "/images/icons/radio-off.svg"}
        alt=""
        width={22}
        height={22}
        className="size-[22px] shrink-0"
      />
      <span className="type-body-m text-foreground">{children}</span>
    </label>
  );
}
