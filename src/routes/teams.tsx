import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "For teams — Beauty Wallet" },
      {
        name: "description",
        content:
          "Give your team a monthly coin wallet for salons, barbers and spas across Nairobi. One invoice, no receipts to chase.",
      },
    ],
  }),
  component: TeamsLayout,
});

function TeamsLayout() {
  return <Outlet />;
}
