import { createFileRoute, Link } from "@tanstack/react-router";
import { FaqRow, TierCard } from "@/components/site/cards";
import { ComparePlans } from "@/components/site/pricing/ComparePlans";
import { pricingFaqs } from "@/components/site/pricing/faqs";
import { TopUpsAndRollover } from "@/components/site/pricing/TopUpsAndRollover";
import { SitePage } from "@/components/site/SitePage";
import { Responsive, Section, SectionHeading, buttonClass } from "@/components/site/primitives";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES } from "@/lib/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Beauty Wallet" },
      {
        name: "description",
        content:
          "Simple monthly plans with real service value. Prices in Ksh, billed monthly with M-Pesa or card.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { rules: await fetchRules() };
    } catch {
      return { rules: DEFAULT_RULES };
    }
  },
  component: Pricing,
});

function Pricing() {
  const { rules } = Route.useLoaderData();

  return (
    <SitePage>
      <Section inner="flex flex-col items-start gap-2.5 pb-10 pt-6 lg:items-center lg:gap-3.5 lg:pb-14 lg:pt-[72px] lg:text-center">
        <p className="type-eyebrow text-burgundy">Pricing</p>
        <h1 className="type-display-m text-foreground lg:max-w-[860px] lg:type-display-l">
          Simple monthly plans. Real service value.
        </h1>
        <p className="type-body-m text-muted-foreground lg:max-w-[667px] lg:type-body-l">
          <Responsive
            mobile="Prices in Ksh, billed monthly. Change tier or cancel anytime."
            desktop="Prices in Ksh, billed monthly with M-Pesa or card. Change tier or cancel anytime."
          />
        </p>
      </Section>

      <Section inner="flex flex-col gap-4 pb-14 lg:flex-row lg:items-start lg:gap-6 lg:pb-0">
        <TierCard tier="basic" rules={rules} className="hidden lg:flex lg:flex-1" />
        <TierCard
          tier="intermediate"
          rules={rules}
          className="order-first lg:order-none lg:flex-1"
        />
        <TierCard tier="basic" rules={rules} className="lg:hidden" />
        <TierCard tier="premium" rules={rules} className="lg:flex-1" />
      </Section>

      <ComparePlans rules={rules} />

      <TopUpsAndRollover rules={rules} />

      <Section inner="pb-14 lg:pb-24">
        <div className="flex flex-col gap-4 rounded-xl bg-blush-subtle px-5 py-8 lg:flex-row lg:items-center lg:justify-between lg:rounded-xl lg:px-10 lg:py-9">
          <div className="flex flex-col gap-2 lg:max-w-[911px]">
            <h2 className="type-h2 text-foreground">Pay your way</h2>
            <p className="type-body-m text-muted-foreground">
              <Responsive
                mobile="M-Pesa or any Visa or Mastercard card."
                desktop="Monthly plans and top-ups work with M-Pesa or any Visa or Mastercard debit or credit card."
              />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["M-Pesa", "Visa", "Mastercard"].map((label) => (
              <span
                key={label}
                className="type-body-s-semibold inline-flex min-h-[42px] items-center rounded-md border border-border bg-card px-[17px] text-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section inner="flex flex-col gap-5 py-14 lg:flex-row lg:items-start lg:gap-20 lg:pb-24 lg:pt-0">
        <div className="flex flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <SectionHeading
            eyebrow="FAQ"
            title="Billing questions"
            body={
              <span className="hidden lg:inline">
                Anything else? Our team replies within the hour.
              </span>
            }
          />
          <Link
            to="/contact"
            className={buttonClass({
              variant: "secondary",
              className: "hidden self-start lg:inline-flex",
            })}
          >
            Contact us
          </Link>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {pricingFaqs(rules).map((f, i) => (
            <FaqRow
              key={f.question}
              defaultOpen={i === 0}
              question={f.question}
              answer={f.answer}
            />
          ))}
        </div>
        <Link
          to="/contact"
          className={buttonClass({ variant: "secondary", full: true, className: "lg:hidden" })}
        >
          Contact us
        </Link>
      </Section>
    </SitePage>
  );
}
