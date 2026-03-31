/**
 * R2Provider
 *
 * Stores files in a Cloudflare R2 bucket using the AWS S3-compatible API.
 * R2 is S3-compatible, so the standard @aws-sdk/client-s3 package works
 * without modification — we only need to point it at the R2 endpoint.
 *
 * Required environment variables:
 *   R2_ENDPOINT          https://<account-id>.r2.cloudflarestorage.com
 *   R2_BUCKET            Name of the R2 bucket (e.g. "krucraft-files")
 *   R2_ACCESS_KEY_ID     R2 API token — Access Key ID
 *   R2_SECRET_ACCESS_KEY R2 API token — Secret Access Key
 *
 * Optional:
 *   R2_PUBLIC_URL        Custom domain / public bucket URL used by getUrl().
 *                        If omitted, getUrl() falls back to the R2 endpoint URL.
 *                        Example: https://files.krucraft.com
 *
 * Upload/download flow:
 *   1. Admin uploads a file → upload() streams it to R2 via PutObjectCommand.
 *   2. User requests a download → getSignedUrl() generates a presigned
 *      GetObject URL valid for 15 minutes (default).  The download route
 *      redirects the client to this URL; the file is served directly from
 *      Cloudflare's edge, bypassing the Next.js server entirely.
 *
 * Idempotent deletes:
 *   delete() swallows NoSuchKey errors so callers never have to check
 *   whether a file existed before calling delete().
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";
import type { StorageProvider } from "./storage";

// ── Config validation ──────────────────────────────────────────────────────────

type RequiredR2EnvKey =
  | "R2_ENDPOINT"
  | "R2_BUCKET"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY";

function requireEnv(name: RequiredR2EnvKey): string {
  const value = env[name];
  if (!value) {
    throw new Error(
      `[R2Provider] Missing required environment variable: ${name}`
    );
  }
  return value;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export class R2Provider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string | null;

  constructor() {
    const endpoint = requireEnv("R2_ENDPOINT");
    this.bucket = requireEnv("R2_BUCKET");

    this.client = new S3Client({
      region: "auto", // R2 requires "auto"
      endpoint,
      // R2's S3-compatible API requires path-style addressing.
      // Without this flag the SDK generates virtual-hosted-style presigned
      // URLs (https://<bucket>.<account>.r2.cloudflarestorage.com/…) whose
      // HMAC-SHA256 signature does not match what R2 computes against the
      // actual request host, causing "AccessDenied" on every presigned GET.
      forcePathStyle: true,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });

    // Optional custom domain (e.g. https://files.krucraft.com).
    // If not set, getUrl() constructs a URL from the R2 endpoint.
    this.publicUrl = env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? null;
  }

  // ── upload ─────────────────────────────────────────────────────────────────

  /**
   * Upload `file` to R2 under `key`.
   *
   * The key is used as-is as the R2 object key.  Callers are responsible for
   * ensuring the key is unique (the upload route already prefixes with a
   * 16-char random hex string).
   *
   * Returns the key so callers can store it in the database.
   */
  async upload(
    file: Buffer,
    key: string,
    options?: { contentType?: string },
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        // ContentType is set when provided (e.g. image uploads) so R2 serves
        // the correct Content-Type header on public GET requests.
        // For resource files the mimeType is set at download time via the
        // signed URL's ResponseContentType parameter instead.
        ...(options?.contentType && { ContentType: options.contentType }),
      })
    );

    return key;
  }

  // ── getUrl ─────────────────────────────────────────────────────────────────

  /**
   * Return the public (unauthenticated) URL for the object.
   *
   * ⚠️  This URL only works if the bucket has public access enabled.
   * For private buckets (recommended for paid content), use getSignedUrl()
   * instead — the download route always calls getSignedUrl().
   *
   * This method exists to satisfy the StorageProvider interface.  It can be
   * useful for admin previews or CDN-cached public assets.
   */
  getUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // Derive a public URL from the R2 endpoint:
    // https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
    const endpoint = requireEnv("R2_ENDPOINT").replace(/\/$/, "");
    return `${endpoint}/${this.bucket}/${key}`;
  }

  // ── getSignedUrl ──────────────────────────────────────────────────────────

  /**
   * Generate a time-limited presigned URL for a private GET request.
   *
   * The default lifetime is 900 seconds (15 minutes).
   *
   * The `intent` option controls the `Content-Disposition` header that R2
   * embeds in its response:
   *
   *   "download" (default) → attachment; filename="<sanitised>"
   *   "preview"            → inline
   *
   * Both disposition and content-type are embedded as signed query parameters
   * in the presigned URL (`response-content-disposition` /
   * `response-content-type`).  R2 injects them into its own response headers,
   * so the browser receives the correct behaviour regardless of what the
   * Next.js server sends on the 307 redirect.
   *
   * `forcePathStyle: true` is required for R2 — without it the AWS SDK v3
   * generates virtual-hosted-style URLs whose HMAC-SHA256 canonical string
   * does not match what R2 computes → AccessDenied.
   */
  async getSignedUrl(
    key: string,
    options?: {
      intent?: "download" | "preview";
      expiresInSeconds?: number;
      filename?: string;
      contentType?: string;
    },
  ): Promise<string> {
    const expiresIn = options?.expiresInSeconds ?? 900;
    const intent = options?.intent ?? "download";

    // Build the Content-Disposition value to embed in the signed URL.
    let responseContentDisposition: string | undefined;
    if (intent === "preview") {
      responseContentDisposition = "inline";
    } else {
      // Sanitise the filename before embedding it in the presigned URL.
      const safeFilename = options?.filename
        ? options.filename.replace(/[^\w.\-]/g, "_")
        : undefined;
      if (safeFilename) {
        responseContentDisposition = `attachment; filename="${safeFilename}"`;
      }
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      // Embedding disposition and type in the command causes R2 to include
      // them as signed query parameters and inject them into the response
      // headers — the client receives the correct disposition even though it
      // follows a plain 307 redirect with no extra response headers.
      ...(responseContentDisposition && {
        ResponseContentDisposition: responseContentDisposition,
      }),
      ...(options?.contentType && {
        ResponseContentType: options.contentType,
      }),
    });

    return awsGetSignedUrl(this.client, command, { expiresIn });
  }

  // ── delete ────────────────────────────────────────────────────────────────

  /**
   * Delete the object at `key` from R2.
   *
   * Idempotent: if the object does not exist, this is a no-op.
   * R2's DeleteObject returns 204 even for non-existent keys, so no
   * special handling is required — the SDK never throws for missing objects
   * on delete.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (err: unknown) {
      // R2 (like S3) returns 204 for missing keys, but guard defensively.
      const code = (err as { Code?: string; name?: string }).Code
        ?? (err as { Code?: string; name?: string }).name;
      if (code !== "NoSuchKey") {
        throw err;
      }
    }
  }

  // ── exists (utility — not part of StorageProvider interface) ──────────────

  /**
   * Check whether an object exists in R2.
   *
   * Not required by the StorageProvider interface but useful for admin
   * tooling or health checks.
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return true;
    } catch {
      return false;
    }
  }
}
