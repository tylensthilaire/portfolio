// Daily job: add each finished day's visits to the running total in Netlify Blobs.
//
// State is { visits, through }, where `through` is the last day (UTC) included.
// If a run is missed, the next one catches up from `through`; on the very first
// run it seeds the total with everything Umami still holds, up to yesterday.
import { store, fetchVisits, dayStart, nextDay, yesterday, historyStart } from "../lib/visits.mjs";

const MAX_DAYS_PER_RUN = 30; // stays well inside Umami's 50-calls-per-15s limit

export default async () => {
  const blobs = store();
  const lastDay = yesterday();
  let state = await blobs.get("state", { type: "json" });

  if (!state) {
    const visits = await fetchVisits(historyStart(), dayStart(nextDay(lastDay)) - 1);
    state = { visits, through: lastDay, since: new Date().toISOString().slice(0, 10) };
    await blobs.setJSON("state", state);
    console.log(`Seeded the tally with ${visits} visits through ${lastDay}`);
    return;
  }

  let added = 0;
  for (let i = 0; i < MAX_DAYS_PER_RUN && state.through < lastDay; i++) {
    const day = nextDay(state.through);
    const visits = await fetchVisits(dayStart(day), dayStart(nextDay(day)) - 1);
    state = { ...state, visits: state.visits + visits, through: day };
    await blobs.setJSON("state", state); // save per day, so a failure keeps progress
    added += visits;
  }
  console.log(`Added ${added} visits; tally is ${state.visits} through ${state.through}`);
};

export const config = { schedule: "15 0 * * *" }; // 00:15 UTC daily
