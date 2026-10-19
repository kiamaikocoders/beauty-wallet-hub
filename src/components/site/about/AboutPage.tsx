import { Link } from "@tanstack/react-router";
import {
  Icon,
  Responsive,
  Section,
  SectionHeading,
  buttonClass,
} from "@/components/site/primitives";

const VALUES = [
  {
    icon: "shield-check",
    title: "Trust first",
    body: "Every provider is visited and vetted. Coins are held until the service is done.",
  },
  {
    icon: "wallet",
    title: "Fair to providers",
    body: "Clear agreed rates, weekly payouts and no cash to chase.",
  },
  {
    icon: "user",
    title: "For everyone",
    body: "Barbers and braiders, facials and fades. Built for men and women alike.",
  },
  {
    icon: "map-pin",
    title: "Made in Nairobi",
    body: "Launched in six neighbourhoods, with Mombasa and Kisumu next.",
  },
] as const;

const STATS = [
  { value: "68", label: "vetted providers" },
  { value: "6", label: "Nairobi neighbourhoods" },
  { value: "3", label: "simple tiers" },
  { value: "Ksh 0", label: "cash at the salon" },
] as const;

export function AboutPage() {
  return (
    <>
      <Section inner="flex flex-col gap-6 pb-14 pt-6 lg:gap-6 lg:pb-24 lg:pt-[72px]">
        <p className="type-eyebrow text-burgundy">About us</p>
        <h1 className="type-display-m text-foreground lg:type-display-l lg:max-w-[980px]">
          Beauty and grooming, planned like everything else that matters.
        </h1>
        <img
          src="/images/about/team.jpg"
          alt="The Beauty Wallet founding team around a table"
          className="h-[240px] w-full rounded-xl object-cover lg:h-[560px] lg:rounded-2xl"
        />
      </Section>

      <Section inner="flex flex-col gap-6 py-14 lg:flex-row lg:items-start lg:gap-[96px] lg:py-24">
        <SectionHeading
          eyebrow="Our story"
          title="Why we started"
          className="lg:w-[420px] lg:shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[20px] lg:max-w-[796px]">
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            Nairobi has brilliant stylists, barbers and therapists. But booking them is still mostly
            WhatsApp threads, cash on the day and prices that change with the mood.
          </p>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            We started Beauty Wallet so looking after yourself could be planned like rent or school
            fees: one monthly amount, clear value, and no awkward money moments at the chair.
          </p>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            For providers, that means members who have already paid, quieter days filled, and
            payouts that land every Friday.
          </p>
        </div>
      </Section>

      <Section inner="grid grid-cols-2 gap-x-4 gap-y-10 py-10 lg:grid-cols-4 lg:gap-8 lg:py-16">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <p className="type-stat text-foreground">{s.value}</p>
            <p className="type-body-s text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </Section>

      <Section inner="flex flex-col gap-8 py-14 lg:gap-12 lg:py-24">
        <SectionHeading
          eyebrow="What we believe"
          title="Four promises we build around"
          className="lg:max-w-[720px]"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-6"
            >
              <div className="flex size-12 items-center justify-center rounded-3xl bg-blush">
                <Icon name={v.icon} size={24} />
              </div>
              <h3 className="type-h4 text-foreground">{v.title}</h3>
              <p className="type-body-s text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section inner="pb-14 lg:pb-24">
        <div className="flex flex-col gap-6 rounded-xl bg-blush px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:rounded-[32px] lg:px-16 lg:py-14">
          <div className="flex flex-col gap-2 text-foreground lg:max-w-[875px] lg:gap-2">
            <h2 className="type-h1">We’re hiring in Nairobi</h2>
            <p className="type-body-m lg:type-body-l">
              <Responsive
                mobile="Partnerships, operations and engineering."
                desktop="Partnerships, operations and engineering. Help us build the way Kenya books beauty."
              />
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:hello@beautywallet.co.ke?subject=Open%20roles"
              className={buttonClass({ full: true, className: "lg:w-auto" })}
            >
              See open roles
            </a>
            <Link
              to="/contact"
              className={buttonClass({
                variant: "secondary",
                className: "hidden lg:inline-flex",
              })}
            >
              Contact us
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
