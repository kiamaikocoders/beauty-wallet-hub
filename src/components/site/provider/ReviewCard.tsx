import { Icon } from "@/components/site/primitives";
import { initials, reviewMeta, type ProviderReview } from "@/lib/provider-data";

export function ReviewCard({ review }: { review: ProviderReview }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-[21px]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <span className="type-body-s-semibold text-foreground">
            {initials(review.authorName)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-body-s-semibold text-foreground">{review.authorName}</p>
          <p className="type-caption text-muted-foreground">
            {reviewMeta(review.authorTier, review.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Icon
              key={i}
              name="star"
              size={16}
              className={i < review.rating ? "opacity-100" : "opacity-25"}
            />
          ))}
        </div>
      </div>
      <p className="type-body-s text-foreground">{review.body}</p>
    </article>
  );
}
