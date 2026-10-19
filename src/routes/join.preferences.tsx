import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OnboardingShell } from "@/components/site/auth/OnboardingShell";
import { LocationPin } from "@/components/maps/LocationPin";
import { Icon, buttonClass } from "@/components/site/primitives";
import { upsertProfileMetadata } from "@/lib/auth";
import { saveMyLocation, type SavedPin } from "@/lib/location";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/preferences")({
  head: () => ({
    meta: [
      { title: "Preferences — Beauty Wallet" },
      {
        name: "description",
        content: "We use this to sort Explore for you. Change it any time in settings.",
      },
    ],
  }),
  component: PreferencesPage,
});

const SERVICES = [
  "Hair",
  "Braids and locs",
  "Barber",
  "Nails",
  "Makeup",
  "Skin and facials",
  "Spa and massage",
  "Lashes and brows",
];

const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kileleshwa", "CBD"];

function PreferencesPage() {
  const navigate = useNavigate();
  const existing = loadOnboarding();
  const savedServices =
    existing.services.join("|") === "Braids and locs|Nails|Skin and facials" ? [] : existing.services;
  const savedAreas = existing.areas.join("|") === "Kilimani" ? [] : existing.areas;
  const [services, setServices] = useState<string[]>(savedServices);
  const [areas, setAreas] = useState<string[]>(savedAreas);
  const [bookingSms, setBookingSms] = useState(existing.reminders.bookingSms);
  const [coinsAlerts, setCoinsAlerts] = useState(existing.reminders.coinsAlerts);
  const [offers, setOffers] = useState(existing.reminders.offers);
  const [pin, setPin] = useState<SavedPin | null>(
    existing.location
      ? { ...existing.location, approximate: false }
      : null,
  );
  const [pinError, setPinError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const svc = `${services.length} service${services.length === 1 ? "" : "s"}`;
    const area = pin?.area ?? areas[0] ?? "Set your pin";
    return `${svc} · ${area}`;
  }, [services, areas, pin]);

  function toggle(list: string[], item: string, set: (v: string[]) => void) {
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function persistAndGo() {
    if (!pin) {
      setPinError("Drop a pin so nearby studios can start from where you are.");
      return;
    }
    setPinError(null);
    const nextAreas = areas.includes(pin.area) ? areas : [pin.area, ...areas];
    saveOnboarding({
      services,
      areas: nextAreas,
      location: { lat: pin.lat, lng: pin.lng, address: pin.address, area: pin.area },
      reminders: { bookingSms, coinsAlerts, offers },
      step: "payment",
    });
    void upsertProfileMetadata({
      onboarding_step: "payment",
      preferred_services: services,
      preferred_areas: nextAreas,
      reminders: { bookingSms, coinsAlerts, offers },
    });
    try {
      await saveMyLocation(pin);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Could not save this pin.");
      return;
    }
    void navigate({ to: "/join/pay" });
  }

  return (
    <OnboardingShell
      step="preferences"
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden lg:block">
            <p className="type-body-s-semibold text-foreground">{summary}</p>
            <p className="type-caption text-muted-foreground">A pin is required. Services are optional.</p>
          </div>
          <div className="flex w-full gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => void persistAndGo()}
              className={buttonClass({ variant: "emphasis", full: true, className: "lg:w-auto" })}
            >
              Continue
            </button>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[720px] px-5 py-8 lg:py-10">
        <div className="flex flex-col gap-2.5">
          <h1 className="type-h1 text-foreground">What are you into?</h1>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            Services you book, and the place you start from.
          </p>
        </div>

        <section className="mt-8 flex flex-col gap-3.5">
          <h2 className="type-h4 text-foreground">Services you book</h2>
          <div className="flex flex-wrap gap-2.5">
            {SERVICES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={services.includes(s)}
                onClick={() => toggle(services, s, setServices)}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <LocationPin
            value={pin}
            onChange={(next) => {
              setPin(next);
              setPinError(null);
            }}
            title="Where you are"
            helper="Required. Nearby studios start from this pin."
            note="Pin saved. Only Beauty Wallet sees the exact point."
          />
          {pinError && <p className="mt-2 type-caption text-destructive">{pinError}</p>}
        </section>

        <section className="mt-8 flex flex-col gap-3.5">
          <h2 className="type-h4 text-foreground">Where you usually go</h2>
          <div className="flex flex-wrap gap-2.5">
            {AREAS.map((a) => (
              <Chip
                key={a}
                label={a}
                selected={areas.includes(a)}
                onClick={() => toggle(areas, a, setAreas)}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-1">
          <h2 className="mb-2 type-h4 text-foreground">Reminders</h2>
          <ToggleRow
            title="Booking reminders by SMS"
            body="A text the day before and an hour before"
            on={bookingSms}
            onChange={setBookingSms}
          />
          <ToggleRow
            title="Coins and renewal alerts"
            body="Low balance, rollover and renewal dates"
            on={coinsAlerts}
            onChange={setCoinsAlerts}
          />
          <ToggleRow
            title="Offers from providers"
            body="New services and quiet-hour deals"
            on={offers}
            onChange={setOffers}
          />
        </section>
      </div>
    </OnboardingShell>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-4 type-body-s transition-colors",
        selected
          ? "border-burgundy bg-blush-subtle text-foreground"
          : "border-border bg-card text-foreground",
      )}
    >
      {selected ? <Icon name="check" size={16} /> : null}
      {label}
    </button>
  );
}

function ToggleRow({
  title,
  body,
  on,
  onChange,
}: {
  title: string;
  body: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="type-body-s-semibold text-foreground">{title}</p>
        <p className="type-caption text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-7 w-[46px] shrink-0 rounded-full transition-colors",
          on ? "bg-burgundy" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] size-[22px] rounded-full bg-white transition-all",
            on ? "left-[21px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}
