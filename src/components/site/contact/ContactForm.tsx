import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Icon, buttonClass } from "@/components/site/primitives";
import { submitContactMessage, type ContactWho } from "@/lib/contact-data";
import { cn } from "@/lib/utils";

const TOPICS = [
  "Billing and coins",
  "Bookings and refunds",
  "Your subscription",
  "Provider partnerships",
  "Something else",
] as const;

const WHO: { id: ContactWho; label: string }[] = [
  { id: "member", label: "Member" },
  { id: "provider", label: "Provider" },
  { id: "other", label: "Other" },
];

export function ContactForm() {
  const [who, setWho] = useState<ContactWho>("member");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await submitContactMessage({ who, fullName, phone, topic, message });
      toast.success("Message sent — we’ll reply shortly.");
      setFullName("");
      setPhone("");
      setMessage("");
      setTopic(TOPICS[0]);
      setWho("member");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-[18px] rounded-2xl border border-border bg-card p-6 lg:p-10"
    >
      <h2 className="type-h2 text-foreground">Send us a message</h2>

      <div className="flex flex-col gap-2">
        <p className="type-body-s-medium text-foreground">I am a</p>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {WHO.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWho(w.id)}
              className={cn(
                "type-body-s-medium flex min-h-11 flex-1 items-center justify-center rounded-full px-2 transition-colors",
                who === w.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-foreground/5",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-body-s-medium text-foreground">Full name</span>
          <input
            required
            name="fullName"
            autoComplete="name"
            placeholder="Amani Wanjiru"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="type-body-m min-h-[50px] w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none placeholder:text-disabled focus:border-burgundy"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-body-s-medium text-foreground">Phone number</span>
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0722 481 205"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="type-body-m min-h-[50px] w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none placeholder:text-disabled focus:border-burgundy"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="type-body-s-medium text-foreground">Topic</span>
        <div className="relative">
          <select
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="type-body-m min-h-[50px] w-full appearance-none rounded-md border border-border bg-card py-3 pl-4 pr-12 text-foreground outline-none focus:border-burgundy"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
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
        <span className="type-body-s-medium text-foreground">Message</span>
        <textarea
          required
          name="message"
          maxLength={1000}
          rows={5}
          placeholder="Hi, my November renewal went through on M-Pesa but my coins haven’t updated yet. Thank you!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="type-body-m min-h-[140px] w-full resize-y rounded-md border border-border bg-card px-4 py-3.5 text-foreground outline-none placeholder:text-disabled focus:border-burgundy"
        />
        <span className="type-caption text-right text-muted-foreground">
          {message.length} / 1000
        </span>
      </label>

      <button
        type="submit"
        disabled={sending}
        className={buttonClass({ variant: "emphasis", className: "self-start" })}
      >
        {sending ? "Sending…" : "Send message"}
      </button>

      <p className="type-caption text-muted-foreground">
        By sending this you agree to our{" "}
        <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
