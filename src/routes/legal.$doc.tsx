import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { SitePage } from "@/components/site/SitePage";
import { Icon, Section } from "@/components/site/primitives";
import {
  getLegalDoc,
  LEGAL_NAV,
  type LegalDoc,
  type LegalSection,
  type LegalSlug,
} from "@/content/legal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/legal/$doc")({
  head: ({ params }) => {
    const doc = getLegalDoc(params.doc);
    return {
      meta: [
        { title: doc ? `${doc.title} — Beauty Wallet` : "Legal — Beauty Wallet" },
        {
          name: "description",
          content: doc?.summary ?? "Beauty Wallet legal documents.",
        },
      ],
    };
  },
  loader: ({ params }): { doc: LegalDoc } => {
    const doc = getLegalDoc(params.doc);
    if (!doc) throw notFound();
    return { doc };
  },
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useLoaderData() as { doc: LegalDoc };
  const [active, setActive] = useState(doc.sections[0]?.id ?? "");

  useEffect(() => {
    setActive(doc.sections[0]?.id ?? "");
  }, [doc]);

  useEffect(() => {
    const ids = doc.sections.map((s: LegalSection) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 1] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [doc]);

  return (
    <SitePage>
      <div className="lg:hidden">
        <MobileLegalChrome doc={doc} />
      </div>
      <Section inner="flex flex-col gap-7 pb-16 pt-7 lg:flex-row lg:items-start lg:gap-16 lg:pb-24 lg:pt-16">
        <nav className="hidden w-[260px] shrink-0 flex-col gap-1 lg:flex" aria-label="Documents">
          <p className="type-eyebrow mb-1 text-muted-foreground">Documents</p>
          {LEGAL_NAV.map((item) => {
            const selected = item.slug === doc.slug;
            return (
              <Link
                key={item.slug}
                to="/legal/$doc"
                params={{ doc: item.slug }}
                className={cn(
                  "flex min-h-11 items-center rounded-[10px] pl-3.5 type-body-s-medium transition-colors",
                  selected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <article className="flex min-w-0 flex-1 flex-col gap-7">
          <p className="type-eyebrow text-burgundy">Legal</p>
          <h1 className="type-display-m text-foreground">{doc.title}</h1>
          <p className="type-body-s text-muted-foreground">{doc.updated}</p>

          <div className="flex gap-3 rounded-lg bg-info-bg p-[18px]">
            <Icon name="shield-check" size={24} className="mt-0.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="type-body-s-semibold text-foreground">{doc.summaryTitle}</p>
              <p className="type-body-s text-foreground">{doc.summary}</p>
            </div>
          </div>

          {doc.sections.map((section: LegalSection) => (
            <section key={section.id} id={section.id} className="flex scroll-mt-24 flex-col gap-3">
              <h2 className="type-h2 text-foreground lg:text-[28px]">{section.title}</h2>
              {section.paragraphs.map((p: string) => (
                <p key={p.slice(0, 48)} className="type-body-m text-foreground lg:type-body-l">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="border-t border-border pt-5">
            <p className="type-body-s text-muted-foreground">{doc.questions}</p>
          </div>
        </article>

        <nav
          className="hidden w-[240px] shrink-0 flex-col gap-3 border-l border-border pl-5 lg:flex"
          aria-label="On this page"
        >
          <p className="type-eyebrow text-muted-foreground">On this page</p>
          {doc.sections.map((section: LegalSection) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "type-body-s transition-colors",
                active === section.id
                  ? "text-burgundy"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </Section>
    </SitePage>
  );
}

function MobileLegalChrome({ doc }: { doc: LegalDoc }) {
  const [docOpen, setDocOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const listId = useId();
  const tocId = useId();

  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="relative">
        <button
          type="button"
          aria-expanded={docOpen}
          aria-controls={listId}
          onClick={() => {
            setDocOpen((o) => !o);
            setTocOpen(false);
          }}
          className="flex min-h-[50px] w-full items-center justify-between rounded-md border border-border bg-card px-[17px] text-left"
        >
          <span className="type-body-m text-foreground">{doc.title}</span>
          <Icon name="chevron-down" />
        </button>
        {docOpen && (
          <ul
            id={listId}
            className="absolute inset-x-0 top-[54px] z-20 flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-soft"
          >
            {LEGAL_NAV.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/legal/$doc"
                  params={{ doc: item.slug as LegalSlug }}
                  onClick={() => setDocOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center px-4 type-body-s-medium",
                    item.slug === doc.slug ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-expanded={tocOpen}
          aria-controls={tocId}
          onClick={() => {
            setTocOpen((o) => !o);
            setDocOpen(false);
          }}
          className="flex min-h-11 w-full items-center justify-between text-left"
        >
          <span className="type-body-s-medium text-foreground">
            On this page ({doc.sections.length} sections)
          </span>
          <Icon name="chevron-down" />
        </button>
        {tocOpen && (
          <ul
            id={tocId}
            className="absolute inset-x-0 top-11 z-20 flex flex-col overflow-hidden rounded-md border border-border bg-card py-2 shadow-soft"
          >
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setTocOpen(false)}
                  className="flex min-h-11 items-center px-4 type-body-s text-muted-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
