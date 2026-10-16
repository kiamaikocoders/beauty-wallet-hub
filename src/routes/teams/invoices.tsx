import { createFileRoute, redirect } from "@tanstack/react-router";
import { TeamsInvoices } from "@/components/teams/TeamsInvoices";
import { isTeamsHrSession } from "@/lib/teams-demo";

export const Route = createFileRoute("/teams/invoices")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isTeamsHrSession()) {
      throw redirect({ to: "/teams", search: { hr: "1" } as never });
    }
  },
  head: () => ({
    meta: [{ title: "Invoices — Teams — Beauty Wallet" }],
  }),
  component: () => <TeamsInvoices />,
});
