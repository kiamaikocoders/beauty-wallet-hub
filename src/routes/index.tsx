import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import {
  FaqRow,
  ServiceCard,
  StepCard,
  TestimonialCard,
  TierCard,
  WalletCard,
} from "@/components/site/cards";
import {
  CheckIcon,
  Icon,
  Responsive,
  Section,
  SectionHeading,
  buttonClass,
} from "@/components/site/primitives";
import { HOME_FAQS } from "@/content/faqs";
import { fetchPopularServices, fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES, pct } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beauty Wallet — One monthly wallet for every cut, braid, facial and fade" },
      {
        name: "description",
        content:
          "Subscribe in Ksh, receive coins every month, and spend them at vetted salons, barbers and spas across Nairobi. No cash on site.",
      },
      {
        property: "og:title",
        content: "Beauty Wallet — Curated beauty & grooming, styled securely",
      },
      {
        property: "og:description",
        content:
          "One monthly wallet for every cut, braid, facial and fade. Pay with M-Pesa or card.",
      },
    ],
  }),
  loader: async () => {
    try {
      const rules = await fetchRules();
      return { rules, services: await fetchPopularServices(rules) };
    } catch {
      return { rules: DEFAULT_RULES, services: [] };
    }
  },
  component: Home,
});

const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kileleshwa", "CBD"];

function Home() {
  const { rules, services } = Route.useLoaderData();
  const rollover = pct(rules.rolloverPct);

  return (
    <SitePage>
      {/* Hero */}
      <Section inner="flex flex-col gap-5 pb-14 pt-6 lg:gap-14 lg:pb-24 lg:pt-16 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:gap-7">
          <p className="type-eyebrow text-burgundy">
            <Responsive
              mobile="Curated beauty & grooming"
              desktop="Curated beauty & grooming, styled securely"
            />
          </p>
          <h1 className="type-display-m text-foreground lg:type-display-l">
            One monthly wallet for every cut, braid, facial and fade.
          </h1>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            <Responsive
              mobile="Subscribe in Ksh, get coins every month, and spend them at vetted salons, barbers and spas across Nairobi. No cash on site."
              desktop="Subscribe in Ksh, receive coins every month, and spend them at vetted salons, barbers and spas across Nairobi. No cash on site. Coins only leave your wallet when the service is done."
            />
          </p>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3">
            <Link
              to="/pricing"
              className={buttonClass({ variant: "emphasis", className: "w-full lg:w-auto" })}
            >
              Choose your plan
            </Link>
            <Link
              to="/how-it-works"
              className={buttonClass({ variant: "secondary", className: "w-full lg:w-auto" })}
            >
              See how it works
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:gap-6">
            {[
              ["Vetted providers", "Vetted providers"],
              ["Zero cash on site", "Zero cash on site"],
              ["M-Pesa or card", "Pay with M-Pesa or card"],
            ].map(([m, d]) => (
              <li key={d} className="flex items-center gap-1.5 lg:gap-2">
                <CheckIcon size={18} />
                <span className="type-body-s-medium whitespace-nowrap text-foreground">
                  <Responsive mobile={m} desktop={d} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:hidden">
          <img
            src="/images/home/hero.jpg"
            alt="A member relaxing during a facial"
            className="h-[280px] w-full rounded-xl object-cover"
          />
          <WalletCard
            className="relative -mt-[90px] w-full"
            coins="1,520"
            value="≈ Ksh 15,200 in service value"
            onHold="308 coins"
            rollover="152 coins"
            rolloverLabel={`Rolls over (${rollover})`}
            renews="1 Nov"
          />
        </div>
        <div className="relative mx-auto hidden h-[600px] w-[680px] shrink-0 lg:block">
          <img
            src="/images/home/hero.jpg"
            alt="A member relaxing during a facial"
            className="absolute left-[60px] top-0 h-[560px] w-[620px] rounded-[32px] object-cover"
          />
          <WalletCard
            className="absolute left-0 top-[330px] w-[360px]"
            coins="1,520"
            value="≈ Ksh 15,200 in service value"
            onHold="308 coins"
            rollover="152 coins"
            rolloverLabel={`Rolls over (${rollover})`}
            renews="1 Nov"
          />
          <div className="absolute left-[452px] top-[28px] flex items-center gap-2.5 rounded-full bg-card py-2.5 pl-3 pr-4 shadow-soft">
            <Icon name="qr-code" size={20} />
            <div className="flex flex-col whitespace-nowrap">
              <p className="type-body-s-semibold text-foreground">Arrival PIN 4821</p>
              <p className="type-caption text-muted-foreground">Today 14:00 · Crown Atelier</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Coverage strip */}
      <Section
        className="bg-muted"
        inner="flex flex-wrap items-start gap-x-3.5 gap-y-1.5 py-[18px] lg:items-center lg:justify-center lg:gap-7 lg:py-[22px]"
      >
        <p className="type-eyebrow whitespace-nowrap text-foreground">Now in Nairobi</p>
        {AREAS.map((a) => (
          <p key={a} className="type-body-s whitespace-nowrap text-muted-foreground lg:type-body-m">
            {a}
          </p>
        ))}
        <Link
          to="/coverage"
          className="type-body-s-medium hidden whitespace-nowrap text-burgundy lg:inline"
        >
          Mombasa and Kisumu coming soon
        </Link>
      </Section>

      {/* How it works */}
      <Section inner="flex flex-col gap-4 py-14 lg:gap-12 lg:py-24">
        <div className="flex items-end justify-between">
          <SectionHeading
            eyebrow="How it works"
            title="Beauty you can plan, like any other bill"
            className="lg:w-[720px]"
          />
          <Link
            to="/how-it-works"
            className={buttonClass({ variant: "ghost", className: "hidden lg:inline-flex" })}
          >
            Read the full guide
          </Link>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          <StepCard icon="wallet" number="01" title="Subscribe and get coins">
            <Responsive
              mobile="Pick a tier. Coins land in your wallet every month, each worth about Ksh 10."
              desktop="Pick Basic, Intermediate or Premium. Coins land in your wallet every month, each worth about Ksh 10 of service value."
            />
          </StepCard>
          <StepCard icon="search" number="02" title="Book vetted providers">
            <Responsive
              mobile="Choose salons, barbers and spas in your tier. Bundle services in one visit to save coins."
              desktop="Choose salons, barbers and spas in your tier. Bundle hair, beard and a facial in one visit to save coins and time."
            />
          </StepCard>
          <StepCard icon="qr-code" number="03" title="Arrive with your pass">
            <Responsive
              mobile="Show your 4-digit PIN. Coins only go to the provider once your service is done."
              desktop="Show your 4-digit PIN. Coins stay on hold and only go to the provider once your service is done."
            />
          </StepCard>
        </div>
      </Section>

      {/* Pricing */}
      <Section
        className="bg-card"
        inner="flex flex-col gap-4 py-14 lg:items-center lg:gap-12 lg:py-24"
      >
        <SectionHeading
          eyebrow="Plans"
          title="Pick the wallet that fits your month"
          body={
            <Responsive
              mobile="Prices in Ksh. Change tier or cancel anytime."
              desktop="Prices in Ksh. Change tier or cancel anytime. Every plan gets coins on the same day each month."
            />
          }
          className="lg:w-[720px] lg:items-center lg:text-center"
        />
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <TierCard tier="basic" rules={rules} className="lg:flex-1" />
          <TierCard
            tier="intermediate"
            rules={rules}
            className="order-first lg:order-none lg:flex-1"
          />
          <TierCard tier="premium" rules={rules} className="lg:flex-1" />
        </div>
        <p className="type-body-s text-center text-muted-foreground lg:hidden">
          Run out mid-month? Top up anytime. {rollover} of unused coins roll over.
        </p>
        <div className="hidden items-center gap-6 lg:flex">
          <p className="type-body-s whitespace-pre text-muted-foreground">
            {`Run out mid-month? Top up coins anytime.  ·  ${rollover} of unused coins roll over to next month.`}
          </p>
          <Link
            to="/pricing"
            hash="compare"
            className={buttonClass({ variant: "ghost", size: "s" })}
          >
            Compare plans in detail
          </Link>
        </div>
      </Section>

      {/* Marketplace */}
      <Section inner="flex flex-col gap-7 py-14 lg:gap-10 lg:py-24">
        <div className="flex items-end justify-between">
          <SectionHeading
            eyebrow="Explore"
            title="Popular right now in Nairobi"
            body={
              <Responsive
                mobile="Walk-in price in Ksh, your price in coins."
                desktop="Walk-in price in Ksh, your price in coins. Coin prices shown for members of each service’s tier."
              />
            }
            className="lg:w-[720px]"
          />
          <Link
            to="/explore"
            className={buttonClass({ variant: "secondary", className: "hidden lg:inline-flex" })}
          >
            Explore all services
          </Link>
        </div>
        <div className="-mr-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-5 [scrollbar-width:none] lg:mr-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pr-0">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              className="w-[264px] shrink-0 snap-start lg:w-auto"
            />
          ))}
        </div>
        <Link
          to="/explore"
          className={buttonClass({ variant: "secondary", full: true, className: "lg:hidden" })}
        >
          Explore all services
        </Link>
      </Section>

      {/* Testimonials */}
      <Section
        className="bg-blush-subtle"
        inner="flex flex-col gap-4 py-14 lg:flex-row lg:items-start lg:gap-12 lg:py-24"
      >
        <div className="flex flex-col gap-4 lg:w-[400px] lg:shrink-0 lg:gap-10">
          <SectionHeading eyebrow="Members" title="Loved by regulars, men and women" />
          <dl className="flex gap-3 lg:flex-col lg:gap-5">
            {[
              ["68", "vetted providers", "vetted providers in Nairobi"],
              ["4.8 / 5", "average rating", "average service rating"],
              ["Ksh 0", "cash at the salon", "cash handled at the salon"],
            ].map(([v, m, d]) => (
              <div key={d} className="flex min-w-0 flex-1 flex-col lg:flex-none lg:gap-0.5">
                <dt className="type-stat order-1 whitespace-nowrap text-foreground">{v}</dt>
                <dd className="type-caption order-2 text-muted-foreground lg:type-body-s">
                  <Responsive mobile={m} desktop={d} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <TestimonialCard
            quote={
              <Responsive
                mobile="“I used to lose a whole Saturday at the salon. Now I book braids and a facial in one go.”"
                desktop="“I used to lose a whole Saturday at the salon. Now I book braids and a facial in one go and walk out without touching my wallet.”"
              />
            }
            name="Amani Wanjiru"
            meta="Intermediate member · Kilimani"
            avatar="/images/people/amani-wanjiru.png"
          />
          <TestimonialCard
            quote={
              <Responsive
                mobile="“My fade every two weeks and a beard sculpt, sorted for the month. I just show my PIN.”"
                desktop="“My fade every two weeks and a beard sculpt, sorted for the month. The barber gets paid, I just show my PIN.”"
              />
            }
            name="Brian Otieno"
            meta="Basic member · Westlands"
            avatar="/images/people/brian-otieno.png"
          />
        </div>
      </Section>

      {/* For providers */}
      <Section
        className="bg-primary"
        inner="flex flex-col gap-[22px] py-14 lg:flex-row lg:items-center lg:gap-[72px] lg:py-24"
      >
        <img
          src="/images/people/peter-mwangi.jpg"
          alt="Peter Mwangi, owner of Kinyozi Republic, in his barbershop"
          className="h-[280px] w-full rounded-xl object-cover lg:h-[520px] lg:w-[600px] lg:shrink-0 lg:rounded-[28px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[22px] lg:gap-7">
          <SectionHeading
            tone="dark"
            eyebrow="For providers"
            title="Fill your chairs, not your marketing budget."
            body={
              <Responsive
                mobile="We bring pre-paid members to your door. You do what you do best."
                desktop="Join a network of vetted salons, barbers and spas. We bring pre-paid members to your door. You do what you do best."
              />
            }
            className="lg:w-[560px]"
          />
          <ul className="flex flex-col gap-3 lg:gap-3.5">
            {[
              ["Steady demand from members near you", "Steady demand from members near you"],
              [
                "Just check the PIN, no cash or coins",
                "No cash or coins to handle, just check the PIN",
              ],
              ["Weekly payouts to M-Pesa or bank", "Weekly payouts to M-Pesa or your bank"],
              ["Free to list, no setup fees", "Free to list, no setup fees"],
            ].map(([m, d]) => (
              <li key={d} className="flex items-center gap-2.5 lg:gap-3">
                <CheckIcon tone="gold" size={18} className="lg:hidden" />
                <CheckIcon tone="gold" size={20} className="hidden lg:block" />
                <span className="type-body-m text-primary-foreground">
                  <Responsive mobile={m} desktop={d} />
                </span>
              </li>
            ))}
          </ul>
          <figure className="flex flex-col gap-1.5 border-l-2 border-primary-raised pl-4">
            <blockquote className="type-h3 text-primary-foreground">
              “Tuesdays used to be dead. Now my chairs are full before lunch.”
            </blockquote>
            <figcaption className="type-caption text-gold">
              <Responsive
                mobile="Peter Mwangi, Kinyozi Republic, Westlands"
                desktop="Peter Mwangi, owner, Kinyozi Republic, Westlands"
              />
            </figcaption>
          </figure>
          <div className="flex items-center gap-5">
            <Link
              to="/providers/apply"
              className={buttonClass({ variant: "gold", className: "w-full lg:w-auto" })}
            >
              Apply as a provider
            </Link>
            <a
              href="/sign-in?as=provider"
              className="type-body-s-semibold hidden whitespace-nowrap text-gold lg:inline"
            >
              Provider sign in →
            </a>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section inner="flex flex-col gap-5 py-14 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
        <div className="flex flex-col gap-6 lg:w-[420px] lg:shrink-0">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            body={
              <span className="hidden lg:inline">
                Everything about coins, tiers and how bookings work.
              </span>
            }
          />
          <Link
            to="/help"
            className={buttonClass({
              variant: "secondary",
              className: "hidden self-start lg:inline-flex",
            })}
          >
            Visit the help centre
          </Link>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {HOME_FAQS.map((f, i) => (
            <FaqRow
              key={f.question.desktop}
              defaultOpen={i === 0}
              question={<Responsive mobile={f.question.mobile} desktop={f.question.desktop} />}
              answer={f.answer}
            />
          ))}
        </div>
        <Link
          to="/help"
          className={buttonClass({ variant: "secondary", full: true, className: "lg:hidden" })}
        >
          Visit the help centre
        </Link>
      </Section>

      {/* Final CTA */}
      <Section inner="pb-14 lg:pb-24">
        <div className="flex flex-col gap-4 rounded-xl bg-blush px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:rounded-[32px] lg:p-16">
          <div className="flex flex-col gap-4 text-foreground lg:w-[640px] lg:gap-3">
            <h2 className="type-h1">Your monthly glow-up, sorted.</h2>
            <p className="type-body-m lg:type-body-l">
              Join in two minutes with your phone number. Pay with M-Pesa or card.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pricing" className={buttonClass({ className: "w-full lg:w-auto" })}>
              Choose your plan
            </Link>
            <Link
              to="/explore"
              className={buttonClass({ variant: "secondary", className: "hidden lg:inline-flex" })}
            >
              Explore services
            </Link>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
