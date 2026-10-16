import { Link } from "@tanstack/react-router";
import { TierBadge, buttonClass } from "@/components/site/primitives";
import { duration, ksh, num, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useMember } from "./MemberContext";

export function AppServiceCard({
  service,
  className,
  cta,
}: {
  service: {
    id: string;
    name: string;
    minutes: number;
    cashKsh: number;
    coins: number;
    imageUrl?: string | null;
    tier: TierId;
    area: string;
    providerName: string;
    providerSlug: string;
    priceKind?: "included" | "unlock" | "upgrade";
  };
  className?: string;
  cta?: string;
}) {
  const { demo } = useMember();
  const unlock = service.priceKind === "unlock";
  const upgrade = service.priceKind === "upgrade";
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="relative flex h-[150px] items-start bg-muted pl-3 pt-3">
        {service.imageUrl && (
          <img src={service.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <TierBadge tier={service.tier} className="relative" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="type-caption text-muted-foreground">
          {service.area} · {duration(service.minutes)}
        </p>
        <h3 className="type-h3 text-foreground">{service.name}</h3>
        <p className="type-body-s text-muted-foreground">{service.providerName}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col whitespace-nowrap">
            <p className="type-caption text-muted-foreground">{ksh(service.cashKsh)}</p>
            <p className="type-body-s-semibold text-foreground">
              {upgrade ? `${num(service.coins)} on Premium` : `${num(service.coins)} coins`}
              {unlock ? " + unlock" : ""}
            </p>
          </div>
          <Link
            to="/app/p/$slug"
            params={{ slug: service.providerSlug }}
            search={{ service: service.id, ...(demo ? { demo } : {}) } as never}
            className={buttonClass({ size: "s", variant: upgrade ? "secondary" : "primary" })}
          >
            {cta ?? (upgrade ? "Upgrade" : unlock ? "Unlock" : "Book")}
          </Link>
        </div>
      </div>
    </article>
  );
}
