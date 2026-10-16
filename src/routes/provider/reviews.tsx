import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { initials } from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/reviews")({
  component: ReviewsPage,
});

const DEMO_REVIEWS = [
  {
    id: "1",
    author: "Joy Akinyi",
    service: "Cornrows with Wanjiku",
    rating: 5,
    body: "Quick, neat and painless. Wanjiku is the best in Kilimani.",
    when: "Sat 10 Oct",
    reply: null as string | null,
  },
  {
    id: "2",
    author: "Grace Muthoni",
    service: "Knotless Braids, Small with Achieng",
    rating: 4,
    body: "Lovely braids, but I waited 20 minutes past my time.",
    when: "Thu 8 Oct",
    reply: "Sorry about the wait, Grace. We’ve added a buffer between long sessions. — Mercy",
  },
  {
    id: "3",
    author: "Wairimu Kinyua",
    service: "Wash and treatment with Wanjiku",
    rating: 5,
    body: "My scalp felt so good after. Booking again next month.",
    when: "Tue 6 Oct",
    reply: null,
  },
];

const TAGS = [
  ["On time", 64],
  ["Neat parts", 51],
  ["Friendly", 47],
  ["Clean space", 33],
] as const;

function ReviewsPage() {
  const data = usePortal();
  const [filter, setFilter] = useState<"all" | "reply" | "low">("all");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const dbReviews = data.reviews.map((r) => ({
    id: r.id,
    author: r.author_name,
    service: "Visit",
    rating: r.rating,
    body: r.body ?? "",
    when: new Date(r.created_at).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    reply: null as string | null,
  }));
  const list = (dbReviews.length ? dbReviews : DEMO_REVIEWS).filter((r) => {
    if (filter === "reply") return !r.reply;
    if (filter === "low") return r.rating <= 3;
    return true;
  });
  const rating = data.provider.rating ?? 4.8;
  const count = data.provider.review_count || 126;

  return (
    <ProviderShell data={data}>
      <div className="pt-4 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:pt-7">
        <div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["reply", "Needs a reply"],
                ["low", "3 stars and below"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-full px-4 py-2 type-body-s-medium",
                  filter === id ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="mt-5 space-y-4">
            {list.map((r) => (
              <li key={r.id} className="rounded-[20px] border border-border bg-card p-5">
                <div className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted type-body-s-semibold">
                    {initials(r.author)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="type-body-s-medium">{r.author}</p>
                      <p className="type-body-s text-muted-foreground">{r.when}</p>
                    </div>
                    <p className="type-body-s text-muted-foreground">{r.service}</p>
                    <p className="mt-1 text-gold">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </p>
                    <p className="mt-2 type-body-m">{r.body}</p>
                    {r.reply ? (
                      <div className="mt-3 rounded-2xl bg-muted p-3 type-body-s">
                        <p className="type-body-s-medium">Your reply</p>
                        <p className="mt-1">{r.reply}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <textarea
                          value={draft[r.id] ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                          placeholder="Reply publicly"
                          rows={2}
                          className="w-full rounded-2xl border border-border bg-background px-3 py-2 type-body-s outline-none"
                        />
                        <button
                          type="button"
                          className={buttonClass({ size: "s", className: "mt-2" })}
                        >
                          Post reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="mt-6 lg:mt-0">
          <div className="rounded-[20px] border border-border bg-card p-5">
            <p className="font-display text-[40px] leading-none">{rating}</p>
            <p className="mt-1 type-body-s text-muted-foreground">{count} reviews</p>
            <ul className="mt-4 space-y-2">
              {TAGS.map(([tag, n]) => (
                <li key={tag} className="flex justify-between type-body-s">
                  <span>{tag}</span>
                  <span className="text-muted-foreground">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 type-body-s text-muted-foreground">
              Members see your rating on Explore and on your page. Replies show under the review.
            </p>
          </div>
        </aside>
      </div>
    </ProviderShell>
  );
}
