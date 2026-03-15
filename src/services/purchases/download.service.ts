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
  findCompletedPurchaseByUserAndResource,
  recordDownloadAnalytics,
} from "@/repositories/purchases/purchase.repository";
import { findDownloadableResourceById } from "@/repositories/resources/resource.repository";

const ALLOWED_DOWNLOAD_HOSTS = [
  "cdn.studyplatform.com",
  "storage.googleapis.com",
  "your-bucket.s3.amazonaws.com",
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

    const session = await getServerSession(authOptions);

    if (!session?.user) {
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

    if (!resource.isFree) {
      const purchase = await findCompletedPurchaseByUserAndResource(
        session.user.id,
        resourceId,
      );

      if (!purchase) {
        return NextResponse.json(
          { error: "Forbidden. You have not purchased this resource." },
          { status: 403 },
        );
      }
    }

    if (!resource.fileKey && !resource.fileUrl) {
      return NextResponse.json(
        { error: "File not available. Please contact support." },
        { status: 404 },
      );
    }

    recordDownloadSideEffects(resourceId, session.user.id, ip);
    recordAnalyticsEvent({
      eventType: "RESOURCE_DOWNLOAD",
      userId: session.user.id,
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

  const fileSource = await storage.getSignedUrl(fileKey);

  if (fileSource.startsWith("https://") || fileSource.startsWith("http://")) {
    const contentType = resource.mimeType ?? "application/octet-stream";
    const downloadName = resource.fileName ?? fileKey;
    const safeFilename = downloadName.replace(/[^\w.\-]/g, "_");

    return NextResponse.redirect(fileSource, {
      status: 307,
      headers: {
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Type": contentType,
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
