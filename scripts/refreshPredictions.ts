import { refreshUpcomingPredictions } from "../lib/footballData";

async function main() {
  const summary = await refreshUpcomingPredictions();

  console.log("[scout:refresh] Completed upcoming prediction refresh");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[scout:refresh] Failed to refresh predictions");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
