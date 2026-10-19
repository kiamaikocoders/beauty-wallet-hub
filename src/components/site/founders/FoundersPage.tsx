import { Link } from "@tanstack/react-router";
import { Section, SectionHeading, buttonClass } from "@/components/site/primitives";

const NOTES = [
  { title: "Nairobi", body: "Where Beauty Wallet began" },
  { title: "One amount", body: "A monthly wallet, not cash at the chair" },
  { title: "Fridays", body: "Providers are paid every week" },
] as const;

export function FoundersPage() {
  return (
    <>
      <Section inner="flex flex-col gap-6 pb-6 pt-6 lg:gap-6 lg:pb-2 lg:pt-[72px]">
        <p className="type-eyebrow text-burgundy">Founders</p>
        <h1 className="type-display-m text-foreground lg:type-display-l lg:max-w-[980px]">
          Mercy started Beauty Wallet.
        </h1>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16 lg:pt-5">
          <img
            src="/images/founders/mercy.jpg"
            alt="Mercy, founder and chief executive officer of Beauty Wallet"
            className="h-[520px] w-full rounded-[20px] object-cover object-center lg:h-[840px] lg:w-[620px] lg:shrink-0 lg:rounded-[28px]"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-5 lg:pt-12">
            <p className="type-body-l font-medium text-gold-foreground">
              Founder and chief executive officer
            </p>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              Mercy founded Beauty Wallet in Nairobi so beauty and grooming could be planned like
              rent or school fees. One monthly amount. Clear value. No awkward money at the chair.
            </p>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              For the people doing the work, that means members who have already paid, quieter days
              filled, and payouts that land every Friday.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="/join" className={buttonClass({ full: true, className: "sm:w-auto" })}>
                Get started
              </a>
              <Link
                to="/contact"
                className={buttonClass({
                  variant: "secondary",
                  full: true,
                  className: "sm:w-auto",
                })}
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section inner="flex flex-col gap-6 py-14 lg:flex-row lg:items-start lg:gap-[96px] lg:pb-16 lg:pt-24">
        <SectionHeading
          eyebrow="Her story"
          title="Why she started"
          className="lg:w-[420px] lg:shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:max-w-[796px]">
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            Nairobi has brilliant stylists, barbers and therapists. Booking them was still mostly
            WhatsApp threads, cash on the day, and prices that changed with the mood.
          </p>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            She built one monthly amount so the visit is already paid for, and the person at the
            chair is paid every Friday without chasing cash.
          </p>
        </div>
      </Section>

      <Section inner="grid gap-10 pb-14 sm:grid-cols-3 lg:gap-8 lg:pb-24 lg:pt-6">
        {NOTES.map((note) => (
          <div key={note.title} className="flex flex-col gap-1">
            <p className="type-stat text-foreground">{note.title}</p>
            <p className="type-body-s text-muted-foreground">{note.body}</p>
          </div>
        ))}
      </Section>
    </>
  );
}
