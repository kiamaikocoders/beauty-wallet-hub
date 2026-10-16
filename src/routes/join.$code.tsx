import { createFileRoute } from "@tanstack/react-router";
import { TeamsJoin } from "@/components/teams/TeamsJoin";

export const Route = createFileRoute("/join/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Join your team — Beauty Wallet" },
      {
        name: "description",
        content: `Accept your Beauty Wallet team invite (${params.code}).`,
      },
    ],
  }),
  component: JoinRoute,
});

function JoinRoute() {
  const { code } = Route.useParams();
  return <TeamsJoin code={code} />;
}
