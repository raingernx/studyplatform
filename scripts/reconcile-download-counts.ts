import { reconcileHistoricalDownloadCounts } from "@/services/analytics.service";

async function main() {
  const result = await reconcileHistoricalDownloadCounts();

  console.log("[reconcile-download-counts] completed", {
    resetResources: result.resetCount.count,
    reconciledResources: result.reconciledCount,
  });
}

main().catch((error) => {
  console.error("[reconcile-download-counts] failed", error);
  process.exitCode = 1;
});
