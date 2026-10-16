import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/book")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    provider: typeof raw["provider"] === "string" ? raw["provider"] : undefined,
    service: typeof raw["service"] === "string" ? raw["service"] : undefined,
    when: typeof raw["when"] === "string" ? raw["when"] : undefined,
    stylist: typeof raw["stylist"] === "string" ? raw["stylist"] : undefined,
    addons: typeof raw["addons"] === "string" ? raw["addons"] : undefined,
  }),
  component: () => <Outlet />,
});
