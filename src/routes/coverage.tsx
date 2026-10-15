import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { CoveragePage } from "@/components/site/coverage/CoveragePage";
import { fetchLiveAreas } from "@/lib/coverage-data";

const FALLBACK_AREAS = [
  { area: "Westlands", count: 0 },
  { area: "Kilimani", count: 0 },
  { area: "Karen", count: 0 },
  { area: "Lavington", count: 0 },
  { area: "Kileleshwa", count: 0 },
  { area: "CBD", count: 0 },
];

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Coverage — Beauty Wallet" },
      {
        name: "description",
        content:
          "Now in Nairobi. Mombasa and Kisumu next. See live neighbourhoods and join the waitlist.",
      },
    ],
  }),
  loader: async () => {
    try {
      const areas = await fetchLiveAreas();
      return { areas: areas.length ? areas : FALLBACK_AREAS };
    } catch {
      return { areas: FALLBACK_AREAS };
    }
  },
  component: CoverageRoute,
});

function CoverageRoute() {
  const { areas } = Route.useLoaderData();
  return (
    <SitePage>
      <CoveragePage areas={areas} />
    </SitePage>
  );
}
