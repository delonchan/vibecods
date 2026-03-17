import { refreshCompletedPredictionEvaluations } from "../lib/footballData";

async function main() {
  const summary = await refreshCompletedPredictionEvaluations();

  console.log("[scout:reconcile] Completed finished-match reconciliation");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[scout:reconcile] Failed to reconcile results");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
