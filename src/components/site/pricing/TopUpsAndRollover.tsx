import { CoinChip, Responsive, Section, SectionHeading } from "@/components/site/primitives";
import { ksh, num, pct, type CoinRules } from "@/lib/pricing";

const PACKS = [100, 250, 500] as const;

export function TopUpsAndRollover({ rules }: { rules: CoinRules }) {
  const roll = pct(rules.rolloverPct);
  const exampleLeft = 300;
  const rolled = Math.round(exampleLeft * rules.rolloverPct);
  const expired = exampleLeft - rolled;

  return (
    <Section inner="flex flex-col gap-14 py-14 lg:gap-0 lg:py-24">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-20">
        <div className="flex flex-1 flex-col gap-6 lg:max-w-[792px] lg:gap-10">
          <SectionHeading
            eyebrow="Top-ups"
            title={
              <Responsive
                mobile="Run low? Top up in seconds."
                desktop="Run low mid-month? Top up in seconds."
              />
            }
            body={
              <Responsive
                mobile={`${ksh(rules.kshPerCoin)} per coin, added instantly. Basic members can use extra coins to book a higher-tier provider.`}
                desktop={`Buy extra coins anytime at ${ksh(rules.kshPerCoin)} per coin. Basic members can also use extra coins to book a higher-tier provider.`}
              />
            }
          />
          <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-4">
            {PACKS.map((coins) => (
              <div
                key={coins}
                className="flex flex-1 flex-col gap-2.5 rounded-[18px] border border-border bg-white p-5"
              >
                <CoinChip>{num(coins)} coins</CoinChip>
                <p className="type-body-l text-foreground">{ksh(coins * rules.kshPerCoin)}</p>
                <p className="type-caption text-muted-foreground">Added to your wallet instantly</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[440px] lg:shrink-0 lg:gap-10">
          <SectionHeading
            eyebrow="Rollover"
            title="Unused coins roll over"
            body={`${roll} of what you don’t use carries into next month and lasts one more month.`}
          />
          <div className="flex flex-col gap-3.5 rounded-xl bg-primary p-7 text-primary-foreground">
            <p className="type-eyebrow text-gold">Example</p>
            <p className="type-h3 text-primary-foreground">
              {num(exampleLeft)} coins left on 31 Oct
            </p>
            <div className="flex gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="type-caption text-gold">{roll} rolls over</p>
                <p className="type-h3 text-primary-foreground">{num(rolled)} coins</p>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="type-caption text-gold">Usable until</p>
                <p className="type-h3 text-primary-foreground">30 Nov</p>
              </div>
            </div>
            <p className="type-body-s text-gold">
              The other {num(expired)} coins, 20% of what was left, are taken back when your new month starts.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
