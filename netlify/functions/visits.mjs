// GET /api/visits → { visits }: the all-time visit total for the footer counter.
//
// Returns the stored tally plus visits since it was last updated. Netlify's CDN
// caches the answer for a minute, so most page views never reach this function.
import { store, fetchVisits, dayStart, nextDay, historyStart } from "../lib/visits.mjs";

export default async () => {
  try {
    const state = await store().get("state", { type: "json" });
    const now = Date.now();
    const visits = state
      ? state.visits + (await fetchVisits(dayStart(nextDay(state.through)), now))
      : await fetchVisits(historyStart(now), now); // before the first daily run: everything Umami holds

    return Response.json(
      { visits },
      {
        headers: {
          "Cache-Control": "public, max-age=0, must-revalidate",
          "Netlify-CDN-Cache-Control": "public, durable, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};

export const config = { path: "/api/visits" };
