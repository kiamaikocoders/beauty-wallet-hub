import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { initials } from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const data = usePortal();
  const [filter, setFilter] = useState<"all" | "low">("all");
  const reviews = data.reviews.map((review) => ({
    id: review.id,
    author: review.author_name,
    rating: review.rating,
    body: review.body ?? "",
    when: new Date(review.created_at).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  }));
  const list = reviews.filter((review) => (filter === "low" ? review.rating <= 3 : true));
  const count = reviews.length;
  const rating =
    count === 0 ? "—" : (reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1);

  return (
    <ProviderShell data={data}>
      <div className="pt-4 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:pt-7">
        <div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
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
          {list.length === 0 && (
            <p className="mt-5 type-body-s text-muted-foreground">No reviews yet. A visit review will show here.</p>
          )}
          <ul className="mt-5 space-y-4">
            {list.map((review) => (
              <li key={review.id} className="rounded-[20px] border border-border bg-card p-5">
                <div className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted type-body-s-semibold">
                    {initials(review.author)}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="type-body-s-medium">{review.author}</p>
                      <p className="type-body-s text-muted-foreground">{review.when}</p>
                    </div>
                    <p className="mt-1 text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    <p className="mt-2 type-body-m">{review.body || "No written comment."}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <aside className="mt-6 lg:mt-0">
          <div className="rounded-[20px] border border-border bg-card p-5">
            <p className="font-display text-[40px] leading-none">{rating}</p>
            <p className="mt-1 type-body-s text-muted-foreground">
              {count} review{count === 1 ? "" : "s"} on this studio
            </p>
          </div>
        </aside>
      </div>
    </ProviderShell>
  );
}
