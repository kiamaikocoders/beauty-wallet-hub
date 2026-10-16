import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/wallet")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    coins:
      typeof raw["coins"] === "number"
        ? raw["coins"]
        : typeof raw["coins"] === "string"
          ? Number(raw["coins"])
          : undefined,
    success: raw["success"] === true || raw["success"] === "true" ? true : undefined,
  }),
  component: () => <Outlet />,
});
