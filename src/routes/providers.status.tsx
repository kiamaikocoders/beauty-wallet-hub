import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon, Logo, buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/providers/status")({
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s['ref'] === "string" ? s['ref'] : "BW-PRV-2048",
    name: typeof s['name'] === "string" ? s['name'] : "Kinyozi Republic",
    area: typeof s['area'] === "string" ? s['area'] : "Westlands",
  }),
  head: () => ({
    meta: [
      { title: "Application status — Beauty Wallet" },
      {
        name: "description",
        content: "Track your Beauty Wallet provider application.",
      },
    ],
  }),
  component: ProviderStatusPage,
});

function ProviderStatusPage() {
  const { ref, name, area } = Route.useSearch();

  return (
    <div className="min-h-dvh w-full bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-5 lg:h-20 lg:px-12">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <span className="hidden h-6 w-px bg-border lg:block" />
          <p className="hidden type-body-s-medium text-foreground lg:block">Provider application</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-blush type-body-s-semibold">
            P
          </span>
          <span className="hidden type-body-s-medium lg:inline">Peter</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 px-5 py-8 lg:flex-row lg:gap-[48px] lg:px-0 lg:py-12">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="type-eyebrow text-burgundy">
              {name} · {area}
            </p>
            <h1 className="type-h1 text-foreground">Your application is in review</h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              We’ll visit your studio on Tue 13 Oct at 11:00. Here’s where things stand.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-warning-bg px-3 py-1.5">
                <span className="size-2 rounded-full bg-warning" />
                <span className="type-body-s-medium text-foreground">In review</span>
              </span>
              <span className="type-caption text-muted-foreground">Reference {ref}</span>
            </div>
          </div>

          <ol className="flex flex-col">
            <TimelineItem
              state="done"
              title="Applied online"
              body="Mon 5 Oct · Barber · Westlands"
            />
            <TimelineItem
              state="done"
              title="Intro call"
              body="Wed 7 Oct · with Faith from partnerships"
            />
            <TimelineItem
              state="now"
              title="Studio visit and vetting"
              body="Tue 13 Oct, 11:00 · Hygiene, quality and your rate band are agreed on the day."
              actions={
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={buttonClass({ size: "s" })}>
                    Reschedule
                  </button>
                  <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
                    Add directions
                  </button>
                </div>
              }
            />
            <TimelineItem
              state="todo"
              title="Go live"
              body="Members can book you as soon as your menu is approved."
              last
            />
          </ol>
        </div>

        <aside className="flex w-full flex-col gap-5 lg:w-[400px] lg:shrink-0">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="type-h4 text-foreground">Before your visit</h2>
            <ul className="mt-4 flex flex-col gap-4">
              <ChecklistItem done title="Business permit" body="permit-2026.pdf" />
              <ChecklistItem
                done={false}
                title="Owner ID (front and back)"
                body="Needed before your visit"
                action="Upload"
              />
              <ChecklistItem done title="Payout details" body="M-Pesa till added" />
              <ChecklistItem done={false} title="Studio photos" body="Optional · helps members choose" />
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="type-h4 text-foreground">Questions?</h2>
            <p className="mt-2 type-body-s text-muted-foreground">
              Call or WhatsApp partnerships on 0700 123 456, Monday to Saturday.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TimelineItem({
  state,
  title,
  body,
  actions,
  last,
}: {
  state: "done" | "now" | "todo";
  title: string;
  body: string;
  actions?: ReactNode;
  last?: boolean;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex w-7 flex-col items-center">
        {state === "done" ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-blush">
            <Icon name="check" size={16} />
          </span>
        ) : state === "now" ? (
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-burgundy">
            <span className="size-2.5 rounded-full bg-burgundy" />
          </span>
        ) : (
          <span className="size-7 rounded-full border border-border" />
        )}
        {!last ? <span className="my-1 w-0.5 flex-1 bg-border" /> : null}
      </div>
      <div className={cn("pb-8", last && "pb-0")}>
        <p className="type-body-s-semibold text-foreground">{title}</p>
        <p className="type-body-s text-muted-foreground">{body}</p>
        {actions}
      </div>
    </li>
  );
}

function ChecklistItem({
  done,
  title,
  body,
  action,
}: {
  done: boolean;
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          done ? "bg-blush" : "bg-muted",
        )}
      >
        <Icon name={done ? "check" : "plus"} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-body-s-semibold text-foreground">{title}</p>
        <p className="type-caption text-muted-foreground">{body}</p>
      </div>
      {action ? (
        <button type="button" className={buttonClass({ size: "s", variant: "secondary" })}>
          {action}
        </button>
      ) : null}
    </li>
  );
}
