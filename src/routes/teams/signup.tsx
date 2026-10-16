import { createFileRoute } from "@tanstack/react-router";
import { TeamsSignup } from "@/components/teams/TeamsSignup";

export const Route = createFileRoute("/teams/signup")({
  head: () => ({
    meta: [
      { title: "Set up your team — Beauty Wallet" },
      {
        name: "description",
        content: "Company details, choose seats, pay the first month and invite staff.",
      },
    ],
  }),
  component: () => <TeamsSignup />,
});
