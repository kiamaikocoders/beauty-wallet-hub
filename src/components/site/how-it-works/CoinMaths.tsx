import { Responsive, Section, SectionHeading } from "@/components/site/primitives";
import { ksh, memberPrice, num, pct, type CoinRules, type TierId, TIER_ORDER } from "@/lib/pricing";

const EXAMPLES: {
  name: string;
  cashKsh: number;
  providerClass: TierId;
  metaDesktop: string;
  metaMobile: (cash: string) => string;
}[] = [
  {
    name: "Gel Manicure",
    cashKsh: 1500,
    providerClass: "basic",
    metaDesktop: "Basic provider · Polished Kilimani",
    metaMobile: (cash) => `Basic provider · Polished Kilimani · walk-in ${cash}`,
  },
  {
    name: "Knotless Braids, Medium",
    cashKsh: 6000,
    providerClass: "intermediate",
    metaDesktop: "Intermediate provider · Braid Bar Ngong Rd",
    metaMobile: (cash) => `Intermediate provider · Braid Bar Ngong Rd · walk-in ${cash}`,
  },
  {
    name: "Signature Hydra Facial",
    cashKsh: 9000,
    providerClass: "premium",
    metaDesktop: "Premium provider · The Karen Retreat",
    metaMobile: (cash) => `Premium provider · The Karen Retreat · walk-in ${cash}`,
  },
];

function priceLabel(cashKsh: number, memberTier: TierId, providerClass: TierId, rules: CoinRules) {
  const price = memberPrice(cashKsh, memberTier, providerClass, rules);
  if (price.kind === "included")
    return { short: num(price.coins), withUnit: `${num(price.coins)} coins` };
  return { short: "Unlock", withUnit: "Unlock" };
}

export function CoinMaths({ rules }: { rules: CoinRules }) {
  const interDisc = pct(rules.tiers.intermediate.discount);
  const premDisc = pct(rules.tiers.premium.discount);
  const roll = pct(rules.rolloverPct);

  const facts = [
    [`1 coin ≈ ${ksh(rules.kshPerCoin)}`, "of service value, on every tier"],
    [`${interDisc} / ${premDisc}`, "fewer coins for Intermediate / Premium"],
    [`${roll} rolls over`, "unused coins carry into next month"],
  ] as const;

  return (
    <Section className="bg-blush-subtle" inner="flex flex-col gap-6 py-14 lg:gap-8 lg:py-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <SectionHeading
          eyebrow="The coin maths"
          title="What a service costs on each tier"
          body={
            <Responsive
              mobile="Your tier decides how many coins a service takes."
              desktop="Every service has a walk-in price in Ksh. Your tier decides how many coins it takes."
            />
          }
          className="lg:w-[620px]"
        />
        <div className="flex flex-col gap-2.5 lg:w-[628px] lg:flex-row lg:gap-4">
          {facts.map(([title, body]) => (
            <div key={title} className="flex flex-1 flex-col gap-1.5 rounded-[18px] bg-white p-5">
              <p className="type-h3 text-foreground">{title}</p>
              <p className="type-body-s text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-[20px] border border-border bg-white lg:block">
        <div className="flex bg-muted type-eyebrow text-foreground">
          <p className="w-[718px] px-6 py-4">Service</p>
          <p className="w-[130px] py-4 text-right">Walk-in</p>
          {TIER_ORDER.map((t) => (
            <p key={t} className="w-[130px] py-4 text-right capitalize">
              {rules.tiers[t].name}
            </p>
          ))}
          <div className="w-6" />
        </div>
        {EXAMPLES.map((ex) => (
          <div key={ex.name} className="flex items-center border-t border-border py-[19px]">
            <div className="flex w-[718px] flex-col gap-0.5 px-6">
              <p className="type-body-m-medium text-foreground">{ex.name}</p>
              <p className="type-caption text-muted-foreground">{ex.metaDesktop}</p>
            </div>
            <p className="type-body-s w-[130px] text-right text-foreground">{ksh(ex.cashKsh)}</p>
            {TIER_ORDER.map((tier) => {
              const label = priceLabel(ex.cashKsh, tier, ex.providerClass, rules);
              return (
                <p key={tier} className="type-body-s-semibold w-[130px] text-right text-foreground">
                  {label.short}
                </p>
              );
            })}
            <div className="w-6" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 lg:hidden">
        {EXAMPLES.map((ex) => (
          <div
            key={ex.name}
            className="flex flex-col gap-1 rounded-[18px] border border-border bg-white p-[19px]"
          >
            <p className="type-body-m-medium text-foreground">{ex.name}</p>
            <p className="type-caption text-muted-foreground">{ex.metaMobile(ksh(ex.cashKsh))}</p>
            <div className="mt-1 flex gap-2 pt-1">
              {TIER_ORDER.map((tier) => {
                const label = priceLabel(ex.cashKsh, tier, ex.providerClass, rules);
                return (
                  <div key={tier} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="type-caption text-muted-foreground">{rules.tiers[tier].name}</p>
                    <p className="type-body-s-semibold text-foreground">{label.withUnit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="type-body-s text-muted-foreground">
        “Unlock” means a Basic or Intermediate member can still book that provider by adding extra
        coins.
      </p>
    </Section>
  );
}
