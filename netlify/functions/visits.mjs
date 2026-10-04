// /api/visits — the site's own all-time visit counter, shown in the footer.
//
//   GET  → { visits }   the current total (CDN-cached for a minute)
//   POST → { visits }   adds one visit and returns the new total
//
// js/main.js sends the POST once per visit: on arrival from outside the site,
// never for reloads or moving between pages, and never when the visitor has
// opted out on /privacy/. Only the running total is stored, in Netlify Blobs.
import { getStore } from "@netlify/blobs";

// Visits recorded by Google Analytics before this counter took over (Oct 2026).
const STARTING_VISITS = 1411;
const SITE_HOST = "tylensthilaire.com";
const KEY = "total";

const store = () => getStore({ name: "visit-counter", consistency: "strong" });

const counted = async () => {
  const total = await store().get(KEY, { type: "json" });
  return STARTING_VISITS + (total ? total.count : 0);
};

// Compare-and-swap, so two visits arriving together can't overwrite each other.
async function increment() {
  const blobs = store();
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await blobs.getWithMetadata(KEY, { type: "json" });
    const count = (current ? current.data.count : 0) + 1;
    const conditions = current ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
    const { modified } = await blobs.setJSON(KEY, { count }, conditions);
    if (modified) return STARTING_VISITS + count;
  }
  throw new Error("Visit counter stayed contended after 5 attempts");
}

// Only count pings made from the live site, not deploy previews or elsewhere.
const fromLiveSite = request => {
  try {
    return new URL(request.headers.get("origin") || "").hostname === SITE_HOST;
  } catch {
    return false;
  }
};

export default async request => {
  try {
    if (request.method === "POST") {
      const visits = fromLiveSite(request) ? await increment() : await counted();
      return Response.json({ visits }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method === "GET") {
      return Response.json(
        { visits: await counted() },
        {
          headers: {
            "Cache-Control": "public, max-age=0, must-revalidate",
            "Netlify-CDN-Cache-Control": "public, durable, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};

export const config = { path: "/api/visits" };
