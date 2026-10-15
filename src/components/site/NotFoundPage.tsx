import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SitePage } from "@/components/site/SitePage";
import { Icon, Responsive, Section, buttonClass } from "@/components/site/primitives";

const QUICK_LINKS = [
  {
    to: "/explore" as const,
    title: "Explore services",
    body: "Find a salon, barber or spa",
  },
  {
    to: "/pricing" as const,
    title: "Pricing",
    body: "Compare the three plans",
  },
  {
    to: "/help" as const,
    title: "Help centre",
    body: "Answers about coins and bookings",
  },
];

export function NotFoundPage() {
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/explore?q=${encodeURIComponent(q)}`;
  }

  return (
    <SitePage>
      <Section inner="flex flex-col items-center gap-[18px] pb-20 pt-6 text-center lg:pb-[120px] lg:pt-[72px]">
        <p className="font-sans text-[120px] font-medium leading-none tracking-[-1px] text-blush lg:text-[200px]">
          404
        </p>
        <p className="type-eyebrow text-burgundy">Page not found</p>
        <h1 className="type-display-m text-foreground lg:type-display-l">
          This page took the day off.
        </h1>
        <p className="max-w-[702px] type-body-m text-muted-foreground lg:type-body-l">
          <Responsive
            mobile="The link may be old or mistyped."
            desktop="The link may be old or mistyped. Try a search, or pick up where most people go next."
          />
        </p>

        <form
          onSubmit={onSearch}
          className="flex h-[52px] w-full max-w-[520px] items-center gap-2.5 rounded-full border border-foreground bg-white px-[18px]"
        >
          <Icon name="search" size={24} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services or help"
            className="min-w-0 flex-1 bg-transparent type-body-m text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Search services or help"
          />
        </form>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:gap-3">
          <Link
            to="/"
            className={buttonClass({ variant: "emphasis", className: "w-full lg:w-auto" })}
          >
            Back to home
          </Link>
          <Link
            to="/explore"
            className={buttonClass({
              variant: "secondary",
              className: "hidden lg:inline-flex",
            })}
          >
            Explore services
          </Link>
        </div>

        <div className="flex w-full max-w-[960px] flex-col gap-0 pt-2 lg:flex-row lg:gap-4 lg:pt-6">
          {QUICK_LINKS.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                i === 2
                  ? "hidden flex-1 items-center gap-3 rounded-lg border border-border bg-white px-[18px] py-4 text-left lg:flex"
                  : "flex flex-1 items-center gap-3 rounded-lg border border-border bg-white px-[18px] py-4 text-left"
              }
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-body-s-semibold text-foreground">{link.title}</span>
                <span className="type-caption text-muted-foreground">{link.body}</span>
              </span>
              <Icon name="arrow-right" size={24} />
            </Link>
          ))}
        </div>
      </Section>
    </SitePage>
  );
}
