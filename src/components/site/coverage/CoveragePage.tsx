import { Icon, Responsive, Section } from "@/components/site/primitives";
import type { AreaCount } from "@/lib/coverage-data";
import { WaitlistForm } from "./WaitlistForm";

const COMING = [
  { title: "Mombasa", body: "Next city · provider sign-ups open" },
  { title: "Kisumu", body: "Next city · provider sign-ups open" },
  { title: "More of Nairobi", body: "Runda, Parklands, South B and more" },
] as const;

export function CoveragePage({ areas }: { areas: AreaCount[] }) {
  const total = areas.reduce((n, a) => n + a.count, 0);
  const neighbourhoods = areas.length;

  return (
    <>
      <section className="relative w-full overflow-hidden">
        <img
          src="/images/coverage/hero.jpg"
          alt="Nairobi skyline at golden hour"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(22,20,23,0.8)] to-[rgba(22,20,23,0.15)] to-70%" />
        <div className="relative mx-auto flex min-h-[320px] w-full max-w-[1440px] flex-col justify-center gap-[18px] px-5 py-14 lg:min-h-[480px] lg:px-16 lg:py-0">
          <p className="type-eyebrow text-gold">Where we are</p>
          <h1 className="type-display-m max-w-[720px] text-primary-foreground lg:type-display-l">
            Now in Nairobi. Mombasa and Kisumu next.
          </h1>
          <p className="type-body-m max-w-[560px] text-primary-foreground lg:type-body-l">
            <Responsive
              mobile={`${total} vetted providers across ${neighbourhoods} neighbourhoods.`}
              desktop={`${total} vetted providers across ${neighbourhoods} neighbourhoods, with more joining every week.`}
            />
          </p>
        </div>
      </section>

      <Section inner="flex flex-col gap-10 py-14 lg:flex-row lg:items-start lg:gap-16 lg:py-[72px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[22px] lg:max-w-[788px]">
          <h2 className="type-h2 text-foreground">Live in Nairobi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {areas.map((a) => (
              <div
                key={a.area}
                className="flex items-center gap-4 rounded-[18px] border border-border bg-card p-[17px]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-[22px] bg-blush">
                  <Icon name="map-pin" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="type-body-s-semibold text-foreground">{a.area}</p>
                  <p className="type-caption text-muted-foreground">
                    {a.count} {a.count === 1 ? "provider" : "providers"}
                  </p>
                </div>
                <span className="type-caption rounded-full bg-success-bg px-2.5 py-1 text-success">
                  Live
                </span>
              </div>
            ))}
          </div>

          <h2 className="type-h2 pt-4 text-foreground">Coming next</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {COMING.map((c) => (
              <div
                key={c.title}
                className="flex flex-col gap-1.5 rounded-[18px] border border-border bg-muted/50 p-5"
              >
                <p className="type-h2 text-foreground">{c.title}</p>
                <p className="type-body-s text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[460px]">
          <WaitlistForm />
        </div>
      </Section>
    </>
  );
}
