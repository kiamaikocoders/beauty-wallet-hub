import { useDeferredValue, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FaqRow } from "@/components/site/cards";
import { Icon, Section, buttonClass } from "@/components/site/primitives";
import { SEARCH_CHIPS, filterHelp } from "./help-content";

export function HelpPage() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const { topics, popular, faqs } = filterHelp(deferred);

  return (
    <>
      <Section inner="flex flex-col items-center gap-5 pb-10 pt-6 text-center lg:gap-5 lg:pb-12 lg:pt-[72px]">
        <p className="type-eyebrow text-burgundy">Help centre</p>
        <h1 className="type-display-m text-foreground lg:type-display-l">How can we help?</h1>
        <div className="flex w-full max-w-[720px] items-center gap-3 rounded-full border border-border bg-card py-3 pl-5 pr-3 shadow-soft lg:min-h-[60px] lg:py-0">
          <Icon name="search" size={24} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles"
            aria-label="Search help articles"
            className="type-body-m min-w-0 flex-1 bg-transparent text-left text-foreground outline-none placeholder:text-disabled lg:hidden"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for coins, bookings, payments…"
            aria-label="Search help articles"
            className="type-body-m hidden min-w-0 flex-1 bg-transparent text-left text-foreground outline-none placeholder:text-disabled lg:block"
          />
          <button
            type="button"
            className={buttonClass({
              variant: "emphasis",
              size: "s",
              className: "hidden shrink-0 lg:inline-flex",
            })}
            onClick={() => setQuery((q) => q.trim())}
          >
            Search
          </button>
        </div>
        <div className="hidden flex-wrap justify-center gap-2 lg:flex">
          {SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className="type-body-s-medium min-h-[38px] rounded-full border border-border bg-card px-[15px] text-foreground transition-colors hover:bg-muted"
            >
              {chip}
            </button>
          ))}
        </div>
      </Section>

      <Section inner="flex flex-col gap-7 pb-12 pt-4 lg:pb-12 lg:pt-[72px]">
        <h2 className="type-h2 text-foreground">Browse by topic</h2>
        {topics.length === 0 ? (
          <p className="type-body-m text-muted-foreground">No topics match that search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQuery(t.title)}
                className="flex flex-col items-start gap-2.5 rounded-[20px] border border-border bg-card p-6 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex size-12 items-center justify-center rounded-3xl bg-blush">
                  <Icon name={t.icon} size={24} />
                </div>
                <h3 className="type-h4 text-foreground">{t.title}</h3>
                <p className="type-body-s text-muted-foreground">{t.blurb}</p>
                <p className="type-caption hidden text-burgundy lg:block">{t.count}</p>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section inner="flex flex-col gap-12 pb-14 lg:flex-row lg:items-start lg:gap-16 lg:pb-12 lg:pt-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="type-h2 text-foreground">Popular articles</h2>
          <div className="mt-2 flex flex-col">
            {popular.length === 0 ? (
              <p className="type-body-m py-4 text-muted-foreground">
                No articles match that search.
              </p>
            ) : (
              popular.map((a, i) => (
                <FaqRow
                  key={a.id}
                  question={a.question}
                  answer={a.answer}
                  defaultOpen={i === 0 && !deferred}
                />
              ))
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="type-h2 text-foreground">Coins and wallet FAQ</h2>
          <div className="mt-2 flex flex-col">
            {faqs.length === 0 ? (
              <p className="type-body-m py-4 text-muted-foreground">No FAQs match that search.</p>
            ) : (
              faqs.map((a, i) => (
                <FaqRow
                  key={a.id}
                  question={a.question}
                  answer={a.answer}
                  defaultOpen={i === 0 && !deferred}
                />
              ))
            )}
          </div>
        </div>
      </Section>

      <Section inner="pb-14 lg:pb-24">
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:rounded-2xl lg:px-12 lg:py-10">
          <div className="flex flex-col gap-2 lg:max-w-[1023px]">
            <h2 className="type-h2 text-foreground">Still need help?</h2>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              Chat with us in the app or call 0700 123 456, Mon to Sat, 8:00 to 20:00.
            </p>
          </div>
          <Link
            to="/contact"
            className={buttonClass({ variant: "emphasis", className: "w-full shrink-0 lg:w-auto" })}
          >
            Contact support
          </Link>
        </div>
      </Section>
    </>
  );
}
