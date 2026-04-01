"use client";

import { CheckCircle, Download } from "lucide-react";
import { AutoScrollOnSuccess } from "@/components/resource/AutoScrollOnSuccess";
import { PendingPurchasePoller } from "@/components/checkout/PendingPurchasePoller";
import { useResourceDetailViewerState } from "./ResourceDetailViewerStateProvider";

export function ResourceDetailSuccessClient({
  resourceId,
  hasFile,
  resourceTitle,
}: {
  resourceId: string;
  hasFile: boolean;
  resourceTitle: string;
}) {
  const viewer = useResourceDetailViewerState();

  if (!viewer.isReady) {
    return (
      <PendingPurchasePoller
        resourceTitle={resourceTitle}
        onRefresh={viewer.refresh}
      />
    );
  }

  if (!viewer.authenticated) {
    return null;
  }

  if (!viewer.isOwned) {
    return (
      <PendingPurchasePoller
        resourceTitle={resourceTitle}
        onRefresh={viewer.refresh}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-[14px] font-semibold text-emerald-800">
              Payment confirmed — your file is ready.
            </p>
            <p className="mt-0.5 text-[13px] text-emerald-700">
              Added to your library.
            </p>
          </div>
        </div>
        {hasFile ? (
          <a
            href={`/api/download/${resourceId}`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download instantly
          </a>
        ) : null}
      </div>
      <AutoScrollOnSuccess enabled />
    </>
  );
}
