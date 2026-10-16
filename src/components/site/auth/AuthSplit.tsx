import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo, Responsive } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export function AuthLegal() {
  return (
    <p className="type-caption text-muted-foreground">
      © 2026 Beauty Wallet Ltd ·{" "}
      <Link to="/legal/$doc" params={{ doc: "privacy" }} className="hover:text-foreground">
        Privacy
      </Link>{" "}
      ·{" "}
      <Link to="/legal/$doc" params={{ doc: "terms" }} className="hover:text-foreground">
        Terms
      </Link>
    </p>
  );
}

export function AuthSplit({
  children,
  topRight,
  panelImage,
  panelEyebrow,
  panelQuote,
  panelAttribution,
  admin,
  className,
}: {
  children: ReactNode;
  topRight?: ReactNode;
  panelImage: string;
  panelEyebrow: string;
  panelQuote: string;
  panelAttribution?: string;
  admin?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-dvh w-full bg-background", className)}>
      <div className="flex w-full flex-col px-5 pb-8 pt-6 lg:w-1/2 lg:px-16 lg:pb-8 lg:pt-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo />
            {admin ? (
              <span className="type-label-s rounded-full bg-primary px-2.5 py-1 text-primary-foreground">
                Admin
              </span>
            ) : null}
          </Link>
          {topRight ? <div className="hidden items-center gap-1.5 lg:flex">{topRight}</div> : null}
        </div>

        <div className="flex flex-1 flex-col items-stretch justify-center py-8 lg:items-center">
          <div className="w-full max-w-[400px] self-center">{children}</div>
        </div>

        <div className="hidden lg:block">
          <AuthLegal />
        </div>
      </div>

      <div className="hidden h-dvh w-1/2 p-4 lg:flex">
        {admin ? (
          <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[28px] bg-primary p-12">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="type-eyebrow text-gold">{panelEyebrow}</p>
              <p className="type-h1 text-primary-foreground">{panelQuote}</p>
              {panelAttribution ? (
                <p className="type-body-l text-primary-foreground/80">{panelAttribution}</p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-primary-raised px-5 py-5">
              <p className="type-caption text-gold">Last sign-in</p>
              <p className="type-body-s text-primary-foreground">
                Fri 9 Oct, 18:42 · Chrome on macOS · Nairobi
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-[28px] p-8">
            <img
              src={panelImage}
              alt=""
              className="absolute inset-0 size-full rounded-[28px] object-cover"
            />
            <div className="relative z-10 flex w-full flex-col gap-3 rounded-[20px] bg-primary p-7">
              <p className="type-eyebrow text-gold">{panelEyebrow}</p>
              <p className="type-h3 text-primary-foreground">{panelQuote}</p>
              {panelAttribution ? (
                <p className="type-body-s-medium text-primary-foreground/70">{panelAttribution}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex w-[200px] gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn("h-1 flex-1 rounded-[2px]", i < step ? "bg-burgundy" : "bg-border")}
        />
      ))}
    </div>
  );
}

export function MobileAuthChrome({
  step,
  onBack,
  children,
  bottom,
}: {
  step: number;
  onBack?: () => void;
  children: ReactNode;
  bottom?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:hidden">
      <div className="flex h-14 items-center px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-[22px]"
          aria-label="Back"
        >
          <img
            src="/images/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="size-6 rotate-180"
          />
        </button>
        <div className="flex flex-1 justify-center">
          <MobileProgress step={step} />
        </div>
        <div className="size-11" />
      </div>
      <div className="flex flex-1 flex-col gap-5 px-5 pt-3">{children}</div>
      {bottom ? <div className="flex flex-col gap-3.5 px-5 pb-6 pt-3">{bottom}</div> : null}
    </div>
  );
}

export function AuthHeading({
  title,
  body,
  mobileBody,
  eyebrow,
}: {
  title: string;
  body: ReactNode;
  mobileBody?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {eyebrow ? <p className="type-eyebrow text-burgundy">{eyebrow}</p> : null}
      <h1 className="type-display-m text-foreground lg:type-h1">{title}</h1>
      <p className="type-body-m text-muted-foreground lg:type-body-l">
        {mobileBody ? <Responsive mobile={mobileBody} desktop={body} /> : body}
      </p>
    </div>
  );
}
