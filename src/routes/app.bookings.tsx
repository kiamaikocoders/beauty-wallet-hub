import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/bookings")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    tab: typeof raw["tab"] === "string" ? raw["tab"] : undefined,
  }),
  component: () => <Outlet />,
});
