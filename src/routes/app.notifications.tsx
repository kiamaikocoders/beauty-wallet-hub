import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PushCard } from "@/components/app/PushCard";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { loadNotices, markAllNoticesRead, markNoticeRead, type Notice } from "@/lib/notices";

export const Route = createFileRoute("/app/notifications")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  component: NotificationsPage,
});

function whenLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NotificationsPage() {
  const { member, demo } = useMember();
  const [items, setItems] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    const load = () => {
      void loadNotices().then((rows) => {
        if (!cancelled) setItems(rows);
      });
    };
    load();
    window.addEventListener("focus", load);
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.clearInterval(timer);
    };
  }, [member]);

  if (!member) return null;
  const unread = (items ?? []).filter((item) => !item.readAt).length;

  return (
    <div>
      <PushCard signedIn={!demo} />
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="type-body-s text-muted-foreground">
          {items === null ? "Loading…" : `${unread} unread`}
        </p>
        <button
          type="button"
          className={buttonClass({ size: "s", variant: "ghost" })}
          disabled={!unread}
          onClick={() => {
            void markAllNoticesRead().then(() => loadNotices().then(setItems));
          }}
        >
          Mark all as read
        </button>
      </div>
      {items && items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-6 type-body-s text-muted-foreground">
          You’re up to date. Booking reminders, wallet updates and plan news land here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {(items ?? []).map((notice) => (
            <li key={notice.id}>
              <a
                href={notice.href}
                className="flex gap-3 px-4 py-4"
                onClick={() => {
                  if (!notice.readAt) void markNoticeRead(notice.id);
                }}
              >
                <span
                  className={`mt-2 size-2 shrink-0 rounded-full ${notice.readAt ? "bg-transparent" : "bg-burgundy"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="type-body-s-semibold">{notice.title}</span>
                    <span className="shrink-0 type-caption text-muted-foreground">
                      {whenLabel(notice.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block type-body-s text-muted-foreground">{notice.body}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
