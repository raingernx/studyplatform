/**
 * R2Provider
 *
 * Stores files in a Cloudflare R2 bucket using the AWS S3-compatible API.
 * R2 is S3-compatible, so the standard @aws-sdk/client-s3 package works
 * without modification — we only need to point it at the R2 endpoint.
 *
 * Required environment variables:
 *   R2_ENDPOINT          https://<account-id>.r2.cloudflarestorage.com
 *   R2_BUCKET            Name of the R2 bucket (e.g. "paperdock-files")
 *   R2_ACCESS_KEY_ID     R2 API token — Access Key ID
 *   R2_SECRET_ACCESS_KEY R2 API token — Secret Access Key
 *
 * Optional:
 *   R2_PUBLIC_URL        Custom domain / public bucket URL used by getUrl().
 *                        If omitted, getUrl() falls back to the R2 endpoint URL.
 *                        Example: https://files.paperdock.com
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
import type { StorageProvider } from "./storage";

// ── Config validation ──────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
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
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });

    // Optional custom domain (e.g. https://files.paperdock.com).
    // If not set, getUrl() constructs a URL from the R2 endpoint.
    this.publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? null;
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
  async upload(file: Buffer, key: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        // ContentType is not set here because the upload route stores the
        // mimeType on the Resource row and sets Content-Disposition at
        // download time via the signed URL.
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
    const endpoint = process.env.R2_ENDPOINT!.replace(/\/$/, "");
    return `${endpoint}/${this.bucket}/${key}`;
  }

  // ── getSignedUrl ──────────────────────────────────────────────────────────

  /**
   * Generate a time-limited presigned URL for a private GET request.
   *
   * The default lifetime is 900 seconds (15 minutes), which is short enough
   * to prevent link sharing while giving users ample time to start the
   * download.
   *
   * The download route redirects the user to this URL.  Cloudflare's edge
   * serves the file directly — the Next.js server is not in the data path.
   */
  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return awsGetSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
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
