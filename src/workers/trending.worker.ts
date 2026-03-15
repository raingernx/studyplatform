import { refreshTrendingScores } from "@/analytics/aggregation.service";

export async function runTrendingWorker() {
  return refreshTrendingScores();
}

if (require.main === module) {
  runTrendingWorker()
    .then((count) => {
      console.log("[trending.worker] trending scores refreshed", { count });
      process.exit(0);
    })
    .catch((error) => {
      console.error("[trending.worker] trending refresh failed", error);
      process.exit(1);
    });
}
