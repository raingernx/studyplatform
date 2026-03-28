import { existsSync, createReadStream } from "fs";
import { stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/analytics/event.service";
import { logActivity } from "@/lib/activity";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";
import {
  countDownloadEventsByUserAndResource,
  recordDownloadAnalytics,
} from "@/repositories/purchases/purchase.repository";
import { findDownloadableResourceById } from "@/repositories/resources/resource.repository";
import { getCompletedPurchase } from "@/services/purchase.service";

const ALLOWED_DOWNLOAD_HOSTS = [
  "cdn.studyplatform.com",
  "storage.googleapis.com",
] as const;

export async function handleResourceDownload(
  req: Request,
  resourceId: string,
): Promise<Response> {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.download, ip);

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many download requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    // Check user.id explicitly — a session with a user object but no id
    // (misconfigured callback / replayed token) would pass a session?.user
    // guard while leaving user.id undefined in all subsequent calls.
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to download resources." },
        { status: 401 },
      );
    }

    const resource = await findDownloadableResourceById(resourceId);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    // Verify a COMPLETED purchase exists for all resources — free and paid.
    //
    // Free resources: users must add the resource to their library first
    // (POST /api/library/add), which creates a COMPLETED purchase with
    // paymentProvider = "FREE".  This ensures:
    //   - the resource appears in the user's library
    //   - download analytics are attributed to a purchase
    //   - UI and API agree on what "owned" means
    //
    // Paid resources: a COMPLETED purchase is created by the Stripe/Xendit
    // webhook after payment is confirmed.
    //
    // In both cases the rule is identical: status = COMPLETED.
    const purchase = await getCompletedPurchase(userId, resourceId);

    if (!purchase) {
      const message = resource.isFree
        ? "Please add this resource to your library before downloading."
        : "Forbidden. You have not purchased this resource.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // FIRST_PAID_DOWNLOAD fires only for paid resources.
    // For free resources completedPurchaseId stays null — the "first claim"
    // analytics event is recorded by the library/add route, not here.
    const completedPurchaseId = resource.isFree ? null : purchase.id;

    if (!resource.fileKey && !resource.fileUrl) {
      return NextResponse.json(
        { error: "File not available. Please contact support." },
        { status: 404 },
      );
    }

    recordDownloadSideEffects(resourceId, userId, ip);

    // Fire FIRST_PAID_DOWNLOAD when this is a paid resource and the user
    // has no prior DownloadEvent for it.  Non-blocking; never affects the
    // response.  Must run after the purchase gate passes (completedPurchaseId
    // non-null) so free resources are never included in this metric.
    if (completedPurchaseId !== null) {
      recordFirstPaidDownloadIfApplicable(
        resourceId,
        userId,
        resource.authorId,
        completedPurchaseId,
      );
    }

    recordAnalyticsEvent({
      eventType: "RESOURCE_DOWNLOAD",
      userId,
      resourceId,
      creatorId: resource.authorId,
      metadata: { ip },
    }).catch((err) => {
      console.error("[DOWNLOAD] Failed to record analytics event:", err);
    });

    if (resource.fileKey) {
      return serveFileKey(
        {
          fileKey: resource.fileKey,
          fileName: resource.fileName,
          mimeType: resource.mimeType,
        },
        resource.fileKey,
      );
    }

    return redirectToExternalFile(resource.fileUrl as string);
  } catch (err) {
    console.error("[DOWNLOAD_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

function recordDownloadSideEffects(
  resourceId: string,
  userId: string,
  ip: string,
) {
  recordDownloadAnalytics({
    resourceId,
    userId,
    ip,
  }).catch((err) => {
    console.error("[DOWNLOAD] Failed to record download analytics:", err);
  });

  logActivity({
    userId,
    action: "RESOURCE_DOWNLOAD",
    entity: "Resource",
    entityId: resourceId,
  }).catch(() => {});

  logActivity({
    userId,
    action: "DOWNLOAD_STARTED",
    entity: "Resource",
    entityId: resourceId,
    metadata: { resourceId, userId },
  }).catch(() => {});
}

/**
 * Fires a FIRST_PAID_DOWNLOAD activity event when this is the user's first
 * successful download of a paid resource.
 *
 * Detection: count existing DownloadEvent rows for this user + resource pair.
 * Because this runs before recordDownloadAnalytics creates the new event, a
 * count of 0 means no prior download has ever been recorded.
 *
 * This is the clean paid-activation signal — it is:
 *   - scoped to paid resources only (free resources never reach this path)
 *   - scoped to the first download per user per resource (subsequent
 *     downloads don't re-fire)
 *   - non-blocking (never affects the download response)
 *   - independent of DOWNLOAD_STARTED, which fires for all downloads
 */
function recordFirstPaidDownloadIfApplicable(
  resourceId: string,
  userId: string,
  creatorId: string,
  purchaseId: string,
) {
  countDownloadEventsByUserAndResource(userId, resourceId)
    .then((priorCount) => {
      if (priorCount > 0) return; // not the first download — do nothing
      return logActivity({
        userId,
        action: "FIRST_PAID_DOWNLOAD",
        entity: "Resource",
        entityId: resourceId,
        metadata: { resourceId, userId, purchaseId, creatorId },
      });
    })
    .catch(() => {
      // Analytics must never break the download flow.
    });
}

async function serveFileKey(
  resource: {
    fileKey: string;
    fileName: string | null;
    mimeType: string | null;
  },
  fileKey: string,
): Promise<Response> {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileKey)) {
    return NextResponse.json(
      { error: "Invalid file reference." },
      { status: 400 },
    );
  }

  // Request a "download" intent so the storage provider embeds
  // Content-Disposition: attachment in the presigned URL.  R2 injects this
  // into its own response — the browser saves the file rather than rendering
  // it inline regardless of the object's stored metadata.
  const fileSource = await storage.getSignedUrl(fileKey, {
    intent: "download",
    filename: resource.fileName ?? fileKey,
    contentType: resource.mimeType ?? "application/octet-stream",
  });

  if (fileSource.startsWith("https://") || fileSource.startsWith("http://")) {
    return NextResponse.redirect(fileSource, {
      status: 307,
      headers: {
        // Prevent the browser from caching the redirect itself; the presigned
        // URL already has a 15-minute expiry baked in.
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  if (!existsSync(fileSource)) {
    console.error("[DOWNLOAD] File missing on disk:", fileSource);
    return NextResponse.json(
      { error: "File not found on disk. Please contact support." },
      { status: 404 },
    );
  }

  const fileStats = await stat(fileSource);
  const contentType = resource.mimeType ?? "application/octet-stream";
  const downloadName = resource.fileName ?? fileKey;
  const nodeStream = createReadStream(fileSource);

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer | string) => {
        controller.enqueue(
          typeof chunk === "string" ? Buffer.from(chunk) : chunk,
        );
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const safeFilename = downloadName.replace(/[^\w.\-]/g, "_");

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Content-Length": String(fileStats.size),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function redirectToExternalFile(fileUrl: string): Response {
  try {
    const target = new URL(fileUrl);
    const hostnameAllowed = ALLOWED_DOWNLOAD_HOSTS.includes(
      target.hostname as (typeof ALLOWED_DOWNLOAD_HOSTS)[number],
    );

    if (!hostnameAllowed) {
      return NextResponse.json(
        { error: "External file host not allowed." },
        { status: 400 },
      );
    }

    return NextResponse.redirect(target.toString());
  } catch {
    return NextResponse.json(
      { error: "Invalid external file URL." },
      { status: 400 },
    );
  }
}
