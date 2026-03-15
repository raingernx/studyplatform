import { runAnalyticsAggregation } from "@/analytics/aggregation.service";

export async function runAnalyticsWorker() {
  return runAnalyticsAggregation();
}

if (require.main === module) {
  runAnalyticsWorker()
    .then((result) => {
      console.log("[analytics.worker] aggregation complete", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("[analytics.worker] aggregation failed", error);
      process.exit(1);
    });
}
