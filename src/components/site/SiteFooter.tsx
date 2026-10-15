import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo, Responsive } from "./primitives";

const linkClass = "type-body-s text-primary-foreground transition-colors hover:text-gold";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex w-[163px] flex-col items-start gap-3 lg:w-auto">
      <p className="type-label-s text-gold">{title}</p>
      {children}
    </div>
  );
}

/** Figma "Site Footer": desktop 1440 and phone 390. */
export function SiteFooter() {
  return (
    <footer className="w-full bg-primary">
      <div className="flex w-full flex-col gap-8 px-5 pb-[calc(58px+env(safe-area-inset-bottom))] pt-10 lg:gap-10 lg:px-16 lg:pb-10 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3.5 lg:w-[300px]">
            <Link to="/" aria-label="Beauty Wallet home">
              <Logo tone="light" />
            </Link>
            <p className="type-body-s text-gold">
              <Responsive
                mobile="Curated beauty and grooming, styled securely."
                desktop="Curated beauty and grooming, styled securely. One monthly wallet for men and women across Kenya, starting in Nairobi."
              />
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-7 whitespace-nowrap lg:flex-nowrap lg:gap-[72px]"
          >
            <Column title="Product">
              <Link to="/how-it-works" className={linkClass}>
                How it works
              </Link>
              <Link to="/pricing" className={linkClass}>
                Pricing
              </Link>
              <Link to="/explore" className={linkClass}>
                Explore services
              </Link>
              <Link to="/gift" className={linkClass}>
                Gift a wallet
              </Link>
            </Column>
            <Column title="Providers">
              <Link to="/providers" className={linkClass}>
                For providers
              </Link>
              <Link to="/providers/apply" className={linkClass}>
                Apply to join
              </Link>
              <a href="/sign-in?as=provider" className={linkClass}>
                Provider sign in
              </a>
            </Column>
            <Column title="Company">
              <Link to="/about" className={linkClass}>
                About us
              </Link>
              <Link to="/contact" className={linkClass}>
                Contact
              </Link>
              <a href="mailto:careers@beautywallet.co.ke" className={linkClass}>
                Careers
              </a>
              <Link to="/help" className={linkClass}>
                Help centre
              </Link>
            </Column>
            <Column title="Legal">
              <Link to="/legal/$doc" params={{ doc: "terms" }} className={linkClass}>
                Terms
              </Link>
              <Link to="/legal/$doc" params={{ doc: "privacy" }} className={linkClass}>
                Privacy
              </Link>
              <Link to="/legal/$doc" params={{ doc: "coin-policy" }} className={linkClass}>
                Coin policy
              </Link>
              <Link to="/legal/$doc" params={{ doc: "provider-agreement" }} className={linkClass}>
                Provider agreement
              </Link>
            </Column>
          </nav>
        </div>
        <div className="type-caption flex flex-col gap-2 border-t border-primary-raised pt-6 text-gold lg:flex-row lg:justify-between">
          <p>© 2026 Beauty Wallet Ltd · Nairobi, Kenya</p>
          <p>Pay with M-Pesa, Visa or Mastercard</p>
        </div>
      </div>
    </footer>
  );
}
