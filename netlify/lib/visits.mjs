// Shared helpers for the all-time visit counter.
//
// Umami Cloud's free plan keeps six months of data, so the site keeps its own
// running total in Netlify Blobs: `tally-visits` adds each finished day once,
// and `visits` serves that total plus whatever has happened since.
//
// Visits (not visitors) are counted because they add up across days; Umami's
// visitor identifier resets monthly, so summing visitors would double-count.
import { getStore } from "@netlify/blobs";

const API = "https://api.umami.is/v1";
const WEBSITE_ID = "e838da5f-40b5-44f4-8e06-984854b18cfe";
const DAY = 24 * 60 * 60 * 1000;

export const store = () => getStore({ name: "visit-tally", consistency: "strong" });

// Visits between two instants (ms since the epoch), from Umami's stats endpoint.
export async function fetchVisits(startAt, endAt) {
  const key = process.env.UMAMI_API_KEY;
  if (!key) throw new Error("UMAMI_API_KEY is not set");

  const url = `${API}/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${key}`, "x-umami-api-key": key },
  });
  if (!response.ok) throw new Error(`Umami stats returned ${response.status}`);

  const { visits } = await response.json();
  // Newer Umami returns a number; older versions returned { value, prev }.
  const value = typeof visits === "object" && visits !== null ? visits.value : visits;
  if (!Number.isFinite(Number(value))) throw new Error("Umami stats had no visits figure");
  return Number(value);
}

// Midnight UTC at the start of a YYYY-MM-DD day, in ms.
export const dayStart = day => Date.parse(`${day}T00:00:00Z`);

// The YYYY-MM-DD day (UTC) after the given one.
export const nextDay = day => new Date(dayStart(day) + DAY).toISOString().slice(0, 10);

// Start of the history Umami's free plan keeps (about six months back), in ms.
export const historyStart = (now = Date.now()) => now - 182 * DAY;

// Yesterday's date (UTC), the last fully finished day.
export const yesterday = (now = Date.now()) => new Date(now - DAY).toISOString().slice(0, 10);
