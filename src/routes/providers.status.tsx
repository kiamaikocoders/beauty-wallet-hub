import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, Logo, buttonClass } from "@/components/site/primitives";
import { fetchApplicationStatus, statusHeadline, type ApplicationStatus } from "@/lib/admin-ops";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/providers/status")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : "",
    name: typeof search["name"] === "string" ? search["name"] : "",
    area: typeof search["area"] === "string" ? search["area"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Application status — Beauty Wallet" },
      { name: "description", content: "Track your Beauty Wallet provider application." },
    ],
  }),
  component: ProviderStatusPage,
});

function ProviderStatusPage() {
  const { ref, name, area } = Route.useSearch();
  const [row, setRow] = useState<ApplicationStatus | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchApplicationStatus(ref);
        if (cancelled) return;
        setRow(next);
        setMissing(!next);
      } catch {
        if (!cancelled) setMissing(true);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ref]);

  const studio = row?.name || name || "Your studio";
  const place = row?.area || area || "";
  const status = row?.status ?? "applied";
  const headline = row ? statusHeadline(status, row.reviewNote) : ref ? "Checking your application" : "Open the link from your email";

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
      </header>

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 px-5 py-8 lg:flex-row lg:gap-[48px] lg:px-0 lg:py-12">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="type-eyebrow text-burgundy">
              {studio}
              {place ? ` · ${place}` : ""}
            </p>
            <h1 className="type-h1 text-foreground">{headline}</h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              {status === "live"
                ? "Members can book you. Sign in with the email on this application to open the studio."
                : status === "rejected"
                  ? "This application is closed. The note below is what we sent."
                  : row?.reviewNote
                    ? "We need the change in the note before this studio can go live."
                    : "We’ll update this page as soon as the decision is saved. You don’t need to refresh."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-warning-bg px-3 py-1.5">
                <span className="size-2 rounded-full bg-warning" />
                <span className="type-body-s-medium text-foreground">
                  {status === "applied" ? "In review" : status === "live" ? "Live" : status}
                </span>
              </span>
              <span className="type-caption text-muted-foreground">Reference {ref || "—"}</span>
            </div>
          </div>

          {missing && ref && (
            <p className="type-body-s text-destructive">We couldn’t find {ref}. Check the reference from your email.</p>
          )}

          <ol className="flex flex-col">
            <TimelineItem state="done" title="Applied online" body={row?.kind || "Application received"} />
            <TimelineItem
              state={status === "applied" && !row?.reviewNote ? "now" : "done"}
              title="Review"
              body={row?.reviewNote || "Partnerships reads the form, the services and the pin."}
            />
            <TimelineItem
              state={status === "live" ? "done" : status === "rejected" ? "now" : "todo"}
              title={status === "rejected" ? "Closed" : "Go live"}
              body={
                status === "live"
                  ? "The studio is bookable."
                  : "Members can book you after approval."
              }
              last
              actions={
                status === "live" ? (
                  <Link to="/sign-in" search={{ as: "provider" }} className={buttonClass({ size: "s", className: "mt-3" })}>
                    Sign in to the studio
                  </Link>
                ) : null
              }
            />
          </ol>
        </div>

        <aside className="flex w-full flex-col gap-5 lg:w-[400px] lg:shrink-0">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="type-h4 text-foreground">Studio visit</h2>
            <p className="mt-2 type-body-s text-muted-foreground">
              {row?.visitAt
                ? new Date(row.visitAt).toLocaleString("en-KE", { dateStyle: "full", timeStyle: "short" })
                : "No visit is on the calendar yet."}
            </p>
            {row?.visitNote && <p className="mt-2 type-body-s">{row.visitNote}</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="type-h4 text-foreground">Latest note</h2>
            <p className="mt-2 type-body-s text-muted-foreground">
              {row?.reviewNote || "No note yet. A decision shows up here and in your email."}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="type-h4 text-foreground">This page stays current</h2>
            <p className="mt-2 type-body-s text-muted-foreground">
              It checks the application every few seconds. Approval, a requested change, or a rejection replaces the waiting state.
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
