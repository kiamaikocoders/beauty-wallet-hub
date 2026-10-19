import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { LocationPin } from "@/components/maps/LocationPin";
import { Icon, Section, buttonClass } from "@/components/site/primitives";
import type { SavedPin } from "@/lib/location";
import { cn } from "@/lib/utils";
import type { TierId } from "@/lib/pricing";
import { submitProviderApplication, type ApplyAsProviderResult } from "@/lib/providers-data";
import { Field, RadioRow, SelectField, fieldClass } from "./form-fields";
import { CATEGORIES, STUDIO_CLASSES, TEAM_SIZES } from "./options";

const STEPPER = [
  {
    n: 1,
    title: "Business details",
    subtitle: "Who you are and where you work",
  },
  {
    n: 2,
    title: "Services and prices",
    subtitle: "Your menu at walk-in prices",
  },
  {
    n: 3,
    title: "Payout and documents",
    subtitle: "Where we pay you, permits",
  },
] as const;

const TIMELINE = [
  ["Apply online", "About 10 minutes, today"],
  ["Intro call", "Within 2 working days"],
  ["Studio visit and vetting", "Hygiene, quality and rate agreed"],
  ["Go live", "Members can book you"],
] as const;

type FormState = {
  name: string;
  kind: string;
  area: string;
  locationLat: number | null;
  locationLng: number | null;
  addressText: string;
  phone: string;
  email: string;
  social: string;
  homeVisits: boolean;
  teamSize: string;
  class: TierId;
  serviceName: string;
  servicePrice: string;
  serviceMinutes: string;
  serviceNotes: string;
  payoutMethod: "M-Pesa till" | "Paybill" | "Bank";
  tillNumber: string;
  tillName: string;
  permitUploaded: boolean;
  idUploaded: boolean;
  agreed: boolean;
};

const INITIAL: FormState = {
  name: "",
  kind: "Barber",
  area: "Westlands",
  locationLat: null,
  locationLng: null,
  addressText: "",
  phone: "",
  email: "",
  social: "",
  homeVisits: false,
  teamSize: "4 to 6 people",
  class: "intermediate",
  serviceName: "",
  servicePrice: "",
  serviceMinutes: "",
  serviceNotes: "",
  payoutMethod: "M-Pesa till",
  tillNumber: "",
  tillName: "",
  permitUploaded: false,
  idUploaded: false,
  agreed: false,
};

export function ApplyWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyAsProviderResult | null>(null);

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (form.name.trim().length < 2) return "Enter your business name.";
      if (form.locationLat == null || form.locationLng == null) {
        return "Drop the pin on the studio door.";
      }
      if (form.phone.trim().length < 7) return "Enter a valid business phone.";
      if (!form.email.includes("@")) return "Enter a valid email.";
      return null;
    }
    if (s === 2) {
      if (form.serviceName.trim().length < 2) return "Add at least one service name.";
      const price = Number(form.servicePrice.replace(/,/g, ""));
      if (!Number.isFinite(price) || price <= 0) return "Enter a walk-in price in Ksh.";
      const mins = Number(form.serviceMinutes);
      if (!Number.isFinite(mins) || mins <= 0) return "Enter duration in minutes.";
      return null;
    }
    if (s === 3) {
      if (form.tillNumber.trim().length < 3) return "Enter your payout account details.";
      if (form.tillName.trim().length < 2) return "Enter the registered account name.";
      if (!form.agreed) return "Please agree to the Provider Agreement and Coin Policy.";
      return null;
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const price = Number(form.servicePrice.replace(/,/g, ""));
      const mins = Number(form.serviceMinutes);
      const services = [
        `${form.serviceName.trim()} — Ksh ${price.toLocaleString("en-KE")} / ${mins} min`,
        form.serviceNotes.trim() || null,
      ]
        .filter(Boolean)
        .join(". ");

      const docs = [
        form.permitUploaded ? "Business permit" : null,
        form.idUploaded ? "Owner ID" : null,
      ].filter(Boolean) as string[];

      const social = form.social.trim();
      const data = await submitProviderApplication({
        name: form.name.trim(),
        kind: form.kind,
        area: form.area,
        phone: form.phone.trim(),
        locationLat: form.locationLat ?? undefined,
        locationLng: form.locationLng ?? undefined,
        addressText: form.addressText,
        email: form.email.trim(),
        ...(social ? { social } : {}),
        homeVisits: form.homeVisits,
        teamSize: form.teamSize,
        class: form.class,
        services,
        payoutMethod: form.payoutMethod,
        payoutDetails: `${form.tillNumber.trim()} · ${form.tillName.trim()}`,
        kycDocs: docs,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <SubmittedView result={result} phone={form.phone} name={form.name} />;
  }

  return (
    <Section
      className="bg-card lg:bg-card"
      inner="flex flex-col gap-6 pb-16 pt-6 lg:flex-row lg:items-start lg:gap-12 lg:pb-16 lg:pt-12"
    >
      <aside className="hidden w-[320px] shrink-0 flex-col gap-7 lg:flex">
        <p className="type-eyebrow text-burgundy">Provider application</p>
        <h1 className="type-h1 text-foreground">Join Beauty Wallet</h1>
        <ol className="flex flex-col gap-6">
          {STEPPER.map((s) => {
            const active = step === s.n;
            const done = step > s.n;
            return (
              <li key={s.n} className="flex items-center gap-3.5">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg type-body-s-medium",
                    active || done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.n}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "type-body-s-semibold",
                      active || done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="type-caption text-muted-foreground">{s.subtitle}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-col gap-1.5 rounded-lg bg-blush-subtle p-5 type-body-s">
          <p className="type-body-s-semibold text-foreground">Need help?</p>
          <p className="text-muted-foreground">
            Call or WhatsApp partnerships on 0700 123 456, Monday to Saturday.
          </p>
        </div>
      </aside>

      <form
        onSubmit={
          step === 3
            ? onSubmit
            : (e) => {
                e.preventDefault();
                goNext();
              }
        }
        className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5 lg:rounded-[28px] lg:border lg:border-border lg:bg-white lg:p-10"
      >
        <div className="flex flex-col gap-2 lg:hidden">
          <div className="flex type-caption">
            <span className="flex-1 text-burgundy">Step {step} of 3</span>
            <span className="text-muted-foreground">{STEPPER[step - 1]!.title}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={cn("h-1 flex-1 rounded-sm", n <= step ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
        </div>

        <h2 className="type-h1 text-foreground lg:type-h2">{STEPPER[step - 1]!.title}</h2>
        {step === 1 && (
          <p className="type-body-m text-muted-foreground">
            Tell us who you are. You can save and finish later.
          </p>
        )}
        {step === 2 && (
          <p className="type-body-m text-muted-foreground">
            List your main services at walk-in prices. You can refine the full menu after vetting.
          </p>
        )}

        {step === 1 && <Step1 form={form} patch={patch} />}
        {step === 2 && <Step2 form={form} patch={patch} />}
        {step === 3 && <Step3 form={form} patch={patch} />}

        {error && <p className="type-body-s text-destructive">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((s) => s - 1);
              }}
              className={buttonClass({
                variant: "secondary",
                className: "flex-1 lg:flex-none",
              })}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="type-body-s-medium hidden flex-1 text-left text-burgundy lg:block"
              onClick={() => setError("Progress is kept in this browser session only for now.")}
            >
              Save and finish later
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={buttonClass({
              variant: "emphasis",
              className: "flex-1 lg:ml-auto lg:flex-none",
            })}
          >
            {step === 3 ? (submitting ? "Submitting…" : "Submit application") : "Continue"}
          </button>
        </div>
      </form>

      <aside className="hidden w-[300px] shrink-0 flex-col gap-5 rounded-xl bg-background px-6 py-7 lg:flex">
        <p className="type-h4 text-foreground">What happens next</p>
        <ol className="flex flex-col">
          {TIMELINE.map(([title, body], i) => (
            <li key={title} className="flex gap-3.5">
              <span className="flex flex-col items-center">
                <span className="size-[22px] shrink-0 rounded-[11px] border border-foreground bg-white" />
                {i < TIMELINE.length - 1 && <span className="my-1 h-[30px] w-0.5 bg-border" />}
              </span>
              <span className="flex flex-col gap-0.5 pb-1">
                <span className="type-body-s-semibold text-foreground">{title}</span>
                <span className="type-caption text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </Section>
  );
}

function Step1({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Business name">
        <input
          className={fieldClass}
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Kinyozi Republic"
          autoComplete="organization"
        />
      </Field>
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
        <SelectField
          label="Main category"
          value={form.kind}
          onChange={(kind) => patch({ kind })}
          options={CATEGORIES}
          className="flex-1"
        />
      </div>
      <LocationPin
        value={
          form.locationLat != null && form.locationLng != null
            ? {
                lat: form.locationLat,
                lng: form.locationLng,
                address: form.addressText,
                area: form.area,
                approximate: false,
              }
            : null
        }
        onChange={(pin: SavedPin) =>
          patch({
            locationLat: pin.lat,
            locationLng: pin.lng,
            addressText: pin.address,
            area: pin.area,
          })
        }
        title="Studio location"
        helper="Drop the pin on the studio door, not the road."
        note="Members see the neighbourhood. The pin is for the studio map."
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
        <Field label="Business phone" className="flex-1">
          <input
            className={fieldClass}
            value={form.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            placeholder="0712 345 678"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field label="Email" className="flex-1">
          <input
            className={fieldClass}
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="peter@kinyozirepublic.co.ke"
            autoComplete="email"
          />
        </Field>
      </div>
      <Field label="Instagram or website (optional)">
        <input
          className={fieldClass}
          value={form.social}
          onChange={(e) => patch({ social: e.target.value })}
          placeholder="@kinyozirepublic"
        />
      </Field>
      <div className="flex flex-col gap-1">
        <p className={cn(labelLike)}>Do you offer home or office visits?</p>
        <div className="flex flex-wrap gap-7">
          <RadioRow
            name="homeVisits"
            value="yes"
            checked={form.homeVisits}
            onChange={() => patch({ homeVisits: true })}
          >
            Yes
          </RadioRow>
          <RadioRow
            name="homeVisits"
            value="no"
            checked={!form.homeVisits}
            onChange={() => patch({ homeVisits: false })}
          >
            No, in-studio only
          </RadioRow>
        </div>
      </div>
      <SelectField
        label="Team size"
        value={form.teamSize}
        onChange={(teamSize) => patch({ teamSize })}
        options={TEAM_SIZES}
      />
    </div>
  );
}

const labelLike = "type-body-s-medium text-foreground";

function Step2({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <SelectField
        label="Studio class"
        value={form.class}
        onChange={(v) => patch({ class: v as TierId })}
        options={STUDIO_CLASSES}
      />
      <Field label="Primary service name">
        <input
          className={fieldClass}
          value={form.serviceName}
          onChange={(e) => patch({ serviceName: e.target.value })}
          placeholder="Skin Fade & Line-Up"
        />
      </Field>
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
        <Field label="Walk-in price (Ksh)" className="flex-1">
          <input
            className={fieldClass}
            value={form.servicePrice}
            onChange={(e) => patch({ servicePrice: e.target.value })}
            placeholder="1,200"
            inputMode="numeric"
          />
        </Field>
        <Field label="Duration (minutes)" className="flex-1">
          <input
            className={fieldClass}
            value={form.serviceMinutes}
            onChange={(e) => patch({ serviceMinutes: e.target.value })}
            placeholder="45"
            inputMode="numeric"
          />
        </Field>
      </div>
      <Field label="Other services (optional)">
        <textarea
          className={cn(fieldClass, "min-h-[100px] resize-y")}
          value={form.serviceNotes}
          onChange={(e) => patch({ serviceNotes: e.target.value })}
          placeholder="Beard trim · Ksh 600 / 20 min"
        />
      </Field>
    </div>
  );
}

function Step3({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  const methods = ["M-Pesa till", "Paybill", "Bank"] as const;
  const accountLabel =
    form.payoutMethod === "Bank"
      ? "Account number"
      : form.payoutMethod === "Paybill"
        ? "Paybill number"
        : "Till number";
  const nameLabel = form.payoutMethod === "Bank" ? "Account name" : "Registered till name";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className={labelLike}>How should we pay you?</p>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => patch({ payoutMethod: m })}
              className={cn(
                "min-h-11 flex-1 rounded-full type-body-s-medium transition-colors",
                form.payoutMethod === m ? "bg-primary text-primary-foreground" : "text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <Field label={accountLabel}>
        <input
          className={fieldClass}
          value={form.tillNumber}
          onChange={(e) => patch({ tillNumber: e.target.value })}
          placeholder={form.payoutMethod === "Bank" ? "1234567890" : "5123 456"}
        />
      </Field>
      <Field label={nameLabel}>
        <input
          className={fieldClass}
          value={form.tillName}
          onChange={(e) => patch({ tillName: e.target.value })}
          placeholder="KINYOZI REPUBLIC"
        />
      </Field>
      <p className={labelLike}>Documents</p>
      <DocRow
        title="Business permit"
        done={form.permitUploaded}
        hint={form.permitUploaded ? "permit-2026.pdf · uploaded" : "Tap to upload a photo or PDF"}
        onToggle={() => patch({ permitUploaded: !form.permitUploaded })}
      />
      <DocRow
        title="Owner ID (front and back)"
        done={form.idUploaded}
        hint={form.idUploaded ? "id-scan.pdf · uploaded" : "Tap to upload a photo or PDF"}
        onToggle={() => patch({ idUploaded: !form.idUploaded })}
        dashed={!form.idUploaded}
      />
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={form.agreed}
          onClick={() => patch({ agreed: !form.agreed })}
          className={cn(
            "mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border",
            form.agreed ? "border-primary bg-primary" : "border-foreground bg-white",
          )}
        >
          {form.agreed && (
            <img
              src="/images/icons/check.svg"
              alt=""
              width={16}
              height={16}
              className="size-4 invert"
            />
          )}
        </button>
        <span className="type-body-s text-foreground">
          I agree to the Provider Agreement and Coin Policy.
        </span>
      </label>
    </div>
  );
}

function DocRow({
  title,
  hint,
  done,
  onToggle,
  dashed,
}: {
  title: string;
  hint: string;
  done: boolean;
  onToggle: () => void;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border bg-white p-3 text-left",
        dashed && !done ? "border-dashed border-border" : "border-solid border-border",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-md",
          done ? "bg-success-bg" : "bg-blush",
        )}
      >
        <Icon name={done ? "check" : "plus"} size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-s-medium text-foreground">{title}</span>
        <span className={cn("type-caption", done ? "text-success" : "text-muted-foreground")}>
          {hint}
        </span>
      </span>
    </button>
  );
}

function SubmittedView({
  result,
  phone,
  name,
}: {
  result: ApplyAsProviderResult;
  phone: string;
  name: string;
}) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return (
    <Section inner="flex flex-col items-start gap-6 py-14 lg:mx-auto lg:max-w-[560px] lg:py-24">
      <p className="type-eyebrow text-burgundy">Application received</p>
      <h1 className="type-h1 text-foreground">Thanks, {first}.</h1>
      <p className="type-body-m text-muted-foreground lg:type-body-l">
        We’ll call you on {phone} within 2 working days to book your studio visit.
      </p>
      <div className="flex w-full flex-col gap-1 rounded-xl border border-border bg-white p-5">
        <p className="type-caption text-muted-foreground">Reference</p>
        <p className="type-h3 text-foreground">{result.ref}</p>
      </div>
      <div className="flex w-full flex-col gap-5 rounded-xl bg-background px-6 py-7">
        <p className="type-h4 text-foreground">What happens next</p>
        <ol className="flex flex-col">
          {TIMELINE.map(([title, body], i) => (
            <li key={title} className="flex gap-3.5">
              <span className="flex flex-col items-center">
                <span className="size-[22px] shrink-0 rounded-[11px] border border-foreground bg-white" />
                {i < TIMELINE.length - 1 && <span className="my-1 h-[30px] w-0.5 bg-border" />}
              </span>
              <span className="flex flex-col gap-0.5 pb-1">
                <span className="type-body-s-semibold text-foreground">{title}</span>
                <span className="type-caption text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex w-full flex-col gap-3 lg:flex-row">
        <a
          href={`/providers/status?ref=${encodeURIComponent(result.ref)}&name=${encodeURIComponent(name)}`}
          className={buttonClass({ variant: "emphasis", full: true })}
        >
          Check status
        </a>
        <Link to="/" className={buttonClass({ variant: "secondary", full: true })}>
          Back to home
        </Link>
      </div>
    </Section>
  );
}
