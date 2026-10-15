import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Icon, buttonClass } from "@/components/site/primitives";
import { submitWaitlist } from "@/lib/coverage-data";
import { cn } from "@/lib/utils";

const AREAS = [
  "Mombasa · Nyali",
  "Kisumu",
  "Runda",
  "Parklands",
  "South B",
  "Other Nairobi",
] as const;

type Intent = "member" | "provider";

export function WaitlistForm() {
  const [intent, setIntent] = useState<Intent>("member");
  const [area, setArea] = useState<string>(AREAS[0]);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await submitWaitlist({ intent, area, phone });
      toast.success("You’re on the waitlist — we’ll text when we launch.");
      setPhone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join waitlist");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 lg:gap-6 lg:p-[37px]"
    >
      <div className="flex flex-col gap-2">
        <h2 className="type-h2 text-foreground">Join the waitlist</h2>
        <p className="type-body-m text-muted-foreground">
          We’ll text you the week we launch in your area.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="type-body-s-medium text-foreground">I want to</p>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(
            [
              { id: "member" as const, label: "Become a member" },
              { id: "provider" as const, label: "List my business" },
            ] as const
          ).map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setIntent(w.id)}
              className={cn(
                "type-body-s-medium flex min-h-11 flex-1 items-center justify-center rounded-full px-2 transition-colors",
                intent === w.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-foreground/5",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="type-body-s-medium text-foreground">City or area</span>
        <div className="relative">
          <select
            name="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="type-body-m min-h-[50px] w-full appearance-none rounded-md border border-border bg-card py-3 pl-4 pr-12 text-foreground outline-none focus:border-burgundy"
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={24}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
          />
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <span className="type-body-s-medium text-foreground">Phone number</span>
        <input
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="0733 902 114"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="type-body-m min-h-[50px] w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none placeholder:text-disabled focus:border-burgundy"
        />
      </label>

      <button
        type="submit"
        disabled={sending}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {sending ? "Joining…" : "Join the waitlist"}
      </button>

      <p className="type-caption text-muted-foreground">No spam. One message when we launch.</p>
    </form>
  );
}
