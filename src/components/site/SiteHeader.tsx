import { useState } from "react";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Icon, Logo, buttonClass } from "./primitives";

export const NAV_LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/explore", label: "Explore" },
  { to: "/providers", label: "For providers" },
  { to: "/about", label: "About" },
] as const;

/** Figma "Site Header": 100px desktop, 60px phone with a 44px menu button. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="flex h-[60px] w-full items-center justify-between py-2 pl-5 pr-2.5 lg:h-[100px] lg:px-16 lg:py-5">
        <Link to="/" aria-label="Beauty Wallet home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-start gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="type-body-s-medium text-foreground transition-colors hover:text-burgundy"
              activeProps={{ className: "text-burgundy" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href="/sign-in" className={buttonClass({ variant: "ghost" })}>
            Sign in
          </a>
          <a href="/join" className={buttonClass()}>
            Get started
          </a>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="flex size-11 items-center justify-center lg:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[390px] flex-col bg-background pb-[max(24px,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <div className="flex h-[60px] items-center justify-between border-b border-border py-2 pl-5 pr-2.5">
                <Logo />
                <Dialog.Close
                  className="flex size-11 items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="size-6" strokeWidth={1.75} />
                </Dialog.Close>
              </div>
              <nav aria-label="Main" className="flex flex-col px-5 pt-2">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="type-h3 flex min-h-14 items-center border-b border-border text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2.5 px-5">
                <a href="/join" className={buttonClass({ full: true })}>
                  Get started
                </a>
                <a href="/sign-in" className={buttonClass({ variant: "secondary", full: true })}>
                  Sign in
                </a>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
