import { Link } from "@tanstack/react-router";
import { FaqRow, StepCard } from "@/components/site/cards";
import {
  CheckIcon,
  Responsive,
  Section,
  SectionHeading,
  buttonClass,
} from "@/components/site/primitives";
import { ksh } from "@/lib/pricing";
import type { PayoutBand } from "@/lib/providers-data";
import { examplePayout } from "@/lib/providers-data";
import { PROVIDER_FAQS, REQUIREMENTS, STEPS } from "./content";

export function ProvidersMarketing({ bands }: { bands: PayoutBand[] }) {
  const example = examplePayout(bands);

  return (
    <>
      <Section
        className="bg-primary"
        inner="flex flex-col gap-8 pb-0 pt-10 lg:flex-row lg:items-center lg:gap-[72px] lg:pb-0 lg:pt-[72px]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:gap-[22px]">
          <p className="type-eyebrow text-gold">For providers</p>
          <h1 className="type-display-m text-primary-foreground lg:type-display-l">
            Grow your salon with prepaid members.
          </h1>
          <p className="type-body-m text-gold lg:type-body-l">
            <Responsive
              mobile="Members who have already paid for their month. You do the work, we handle payments."
              desktop="Beauty Wallet sends you members who have already paid for their month. You do the work you love, we handle payments and fill your quiet days."
            />
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <Link
              to="/providers/apply"
              className={buttonClass({ variant: "gold", className: "w-full lg:w-auto" })}
            >
              Apply to join
            </Link>
            <a
              href="/sign-in?as=provider"
              className="type-body-s-medium text-center text-gold lg:text-left"
            >
              Already a provider? Sign in →
            </a>
          </div>
        </div>
        <img
          src="/images/providers/wanjiku-hero.jpg"
          alt="A salon professional in a pink apron standing in a modern studio"
          className="h-[280px] w-full rounded-xl object-cover lg:h-[500px] lg:w-[600px] lg:shrink-0 lg:rounded-[28px]"
        />
      </Section>

      <Section
        className="bg-primary"
        inner="grid grid-cols-2 gap-x-4 gap-y-6 pb-12 pt-8 lg:grid-cols-4 lg:gap-8 lg:pb-12 lg:pt-8"
      >
        {[
          ["Ksh 0", "to list your business"],
          ["Weekly", "payouts to M-Pesa or bank"],
          ["4-digit PIN", "check-in, no cash handling"],
          ["68", "Nairobi providers on board"],
        ].map(([stat, label]) => (
          <div key={stat} className="flex flex-col gap-1">
            <p className="type-stat text-primary-foreground">{stat}</p>
            <p className="type-body-s text-gold">{label}</p>
          </div>
        ))}
      </Section>

      <Section inner="flex flex-col gap-8 py-14 lg:gap-12 lg:py-24">
        <SectionHeading
          eyebrow="How it works for you"
          title="Three steps to your first booking"
          className="lg:w-[720px]"
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {STEPS.map((step) => (
            <StepCard key={step.number} icon={step.icon} number={step.number} title={step.title}>
              {step.body}
            </StepCard>
          ))}
        </div>
      </Section>

      <Section
        className="bg-blush-subtle"
        inner="flex flex-col gap-8 py-14 lg:flex-row lg:items-center lg:gap-20 lg:py-24"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <SectionHeading
            eyebrow="Getting paid"
            title="You set the price. We agree the rate."
            body={
              <Responsive
                mobile="For each completed booking you receive your agreed payout rate, paid weekly to M-Pesa or bank."
                desktop="Every service is listed at your walk-in price. For each completed booking you receive your agreed payout rate, paid weekly to M-Pesa or your bank. Members never pay you in cash."
              />
            }
          />
          <div className="hidden grid-cols-3 gap-6 lg:grid">
            {[
              ["Weekly", "every Friday"],
              ["0", "card or cash fees"],
              ["24 hrs", "to resolve disputes"],
            ].map(([stat, label]) => (
              <div key={stat} className="flex flex-col gap-1">
                <p className="type-stat text-foreground">{stat}</p>
                <p className="type-body-s text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3.5 rounded-xl border border-border bg-white p-7 lg:w-[460px] lg:shrink-0">
          <p className="type-eyebrow text-burgundy">Example payout</p>
          <p className="type-h3 text-foreground">{example.service}</p>
          <div className="flex items-center type-body-s">
            <span className="flex-1 text-muted-foreground">Your walk-in price</span>
            <span className="type-body-s-semibold text-foreground">{ksh(example.cashKsh)}</span>
          </div>
          <div className="flex items-center type-body-s">
            <span className="flex-1 text-muted-foreground">Your agreed payout rate</span>
            <span className="type-body-s-semibold text-foreground">{example.rateLabel}</span>
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex items-center">
            <span className="flex-1 type-body-s text-muted-foreground">Paid to you on Friday</span>
            <span className="type-stat text-foreground">{ksh(example.payoutKsh)}</span>
          </div>
          <p className="type-caption text-muted-foreground">
            No card fees, no cash to chase, and prepaid slots mean fewer no-shows.
          </p>
        </div>
      </Section>

      <Section inner="flex flex-col gap-6 py-14 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
        <img
          src="/images/providers/peter-story.jpg"
          alt="Peter Mwangi, owner of Kinyozi Republic, in his barbershop"
          className="h-[280px] w-full rounded-xl object-cover lg:h-[360px] lg:w-[420px] lg:shrink-0 lg:rounded-[28px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <p className="type-eyebrow text-burgundy">Provider story</p>
          <blockquote className="type-h1 text-foreground">
            “Members come back every month. I plan my staff around bookings now, not guesses.”
          </blockquote>
          <p className="type-body-m text-muted-foreground">
            Peter Mwangi, owner, Kinyozi Republic, Westlands
          </p>
        </div>
      </Section>

      <Section
        className="bg-card"
        inner="flex flex-col gap-8 py-14 lg:flex-row lg:items-start lg:gap-24 lg:py-24"
      >
        <SectionHeading
          eyebrow="What we look for"
          title="Ready to join?"
          body={
            <span className="hidden lg:inline">
              We keep the network small and trusted. Here is what we check during vetting.
            </span>
          }
          className="lg:w-[480px] lg:shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <ul className="flex flex-col">
            {REQUIREMENTS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 border-b border-border py-3.5 type-body-m text-foreground"
              >
                <CheckIcon size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-4 lg:flex-row lg:items-center lg:gap-4">
            <Link
              to="/providers/apply"
              className={buttonClass({ variant: "emphasis", className: "w-full lg:w-auto" })}
            >
              Apply to join
            </Link>
            <p className="type-body-s text-center text-muted-foreground lg:text-left">
              Takes about 10 minutes
            </p>
          </div>
        </div>
      </Section>

      <Section inner="flex flex-col gap-8 py-14 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
        <div className="flex flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <SectionHeading
            eyebrow="FAQ"
            title="Provider questions"
            body={<span className="hidden lg:inline">Talk to our partnerships team anytime.</span>}
          />
          <Link
            to="/contact"
            className={buttonClass({
              variant: "secondary",
              className: "hidden w-fit lg:inline-flex",
            })}
          >
            Contact partnerships
          </Link>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {PROVIDER_FAQS.map((faq, i) => (
            <FaqRow
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
