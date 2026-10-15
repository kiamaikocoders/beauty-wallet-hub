import { Link } from "@tanstack/react-router";
import { Icon, Responsive, Section, buttonClass } from "@/components/site/primitives";
import { ContactForm } from "./ContactForm";

const CHANNELS = [
  {
    icon: "phone",
    label: "Call or WhatsApp",
    value: "0700 123 456",
    detail: "Mon to Sat, 8:00 to 20:00",
  },
  {
    icon: "mail",
    label: "Email",
    value: "hello@beautywallet.co.ke",
    detail: "We reply within one working hour",
  },
  {
    icon: "user",
    label: "Provider partnerships",
    value: "partners@beautywallet.co.ke",
    detail: "Joining, payouts and your listing",
  },
  {
    icon: "map-pin",
    label: "Office",
    value: "Westlands, Nairobi",
    detail: "Visits by appointment only",
  },
] as const;

const QUICK = [
  {
    category: "Payments and renewals",
    title: "Why haven’t my coins updated?",
    href: "/help",
  },
  {
    category: "Your subscription",
    title: "How do I change my plan?",
    href: "/help",
  },
  {
    category: "Bookings and refunds",
    title: "My provider didn’t show up",
    href: "/help",
  },
] as const;

export function ContactPage() {
  return (
    <>
      <Section inner="flex flex-col gap-10 pb-14 pt-6 lg:flex-row lg:items-start lg:gap-16 lg:pb-20 lg:pt-16">
        <div className="flex min-w-0 flex-1 flex-col gap-[22px]">
          <p className="type-eyebrow text-burgundy">Contact</p>
          <h1 className="type-display-m text-foreground lg:type-display-l">We’re here to help.</h1>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            <Responsive
              mobile="Real people in Nairobi, seven days a week."
              desktop="Real people in Nairobi, seven days a week. Members and providers can also chat with us from the app."
            />
          </p>
          <img
            src="/images/contact/support.jpg"
            alt="Beauty Wallet support on a call"
            className="h-[200px] w-full rounded-xl object-cover lg:h-[300px]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3.5 rounded-[18px] border border-border bg-card p-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-[22px] bg-blush">
                  <Icon name={c.icon} size={24} />
                </div>
                <div className="min-w-0">
                  <p className="type-caption text-muted-foreground">{c.label}</p>
                  <p className="type-body-s-semibold text-foreground">{c.value}</p>
                  <p className="type-caption text-muted-foreground">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[600px]">
          <ContactForm />
        </div>
      </Section>

      <Section inner="flex flex-col gap-[22px] pb-14 lg:pb-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="type-h2 text-foreground">Looking for a quick answer?</h2>
          <Link
            to="/help"
            className={buttonClass({
              variant: "ghost",
              size: "s",
              className: "hidden shrink-0 lg:inline-flex",
            })}
          >
            Visit the help centre →
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {QUICK.map((q) => (
            <Link
              key={q.title}
              to={q.href}
              className="flex min-h-[87px] items-center gap-3 rounded-[18px] border border-border bg-card p-[21px] transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="type-caption text-muted-foreground">{q.category}</p>
                <p className="type-body-m-medium text-foreground">{q.title}</p>
              </div>
              <Icon name="arrow-right" size={24} />
            </Link>
          ))}
        </div>
        <Link
          to="/help"
          className={buttonClass({ variant: "ghost", className: "self-start lg:hidden" })}
        >
          Visit the help centre →
        </Link>
      </Section>
    </>
  );
}
