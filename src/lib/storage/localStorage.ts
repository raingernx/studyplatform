/**
 * LocalStorageProvider
 *
 * Stores files on the local filesystem under `private-uploads/` at the
 * project root. This directory is outside `public/` and is never directly
 * accessible by end users.
 *
 * ⚠️  Limitation: local filesystem storage does not survive serverless
 *     deployments (Vercel, Railway, etc.) where the filesystem is ephemeral.
 *     Replace this provider with S3Provider or R2Provider before deploying
 *     to a serverless environment by updating `src/lib/storage/index.ts`.
 */

import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { StorageProvider } from "./storage";

/** Absolute path to the private upload directory. */
const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

/** Regex for validating storage keys before hitting the filesystem. */
const VALID_KEY_REGEX = /^[a-zA-Z0-9._-]+$/;

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(uploadDir = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  /**
   * Write `file` to `{uploadDir}/{key}`.
   * Creates the upload directory if it does not yet exist.
   * Returns the key unchanged.
   */
  async upload(
    file: Buffer,
    key: string,
    _options?: { contentType?: string },
  ): Promise<string> {
    if (!VALID_KEY_REGEX.test(key)) {
      throw new Error(`[LocalStorageProvider] Invalid storage key: "${key}"`);
    }

    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }

    await writeFile(path.join(this.uploadDir, key), file);
    return key;
  }

  /**
   * Returns the absolute filesystem path for the given key.
   * The download route uses this to open a ReadStream — it is never
   * sent to the browser as a URL.
   */
  getUrl(key: string): string {
    return path.join(this.uploadDir, key);
  }

  /**
   * Resolves to the absolute filesystem path for the given key.
   *
   * The local provider has no concept of signed URLs — it returns the same
   * value as `getUrl()` so the service layer can detect a filesystem path
   * (no "https://" prefix) and fall back to disk streaming instead of
   * redirecting.
   *
   * `options` (intent, expiresInSeconds, filename, contentType) are accepted
   * but ignored here.  The `intent` is acted upon by the service layer, which
   * sets `Content-Disposition: attachment` (download) or `inline` (preview)
   * directly on the streamed Response when serving from disk.
   */
  async getSignedUrl(
    key: string,
    _options?: {
      intent?: "download" | "preview";
      expiresInSeconds?: number;
      filename?: string;
      contentType?: string;
    },
  ): Promise<string> {
    return this.getUrl(key);
  }

  /**
   * Delete the file at `{uploadDir}/{key}`.
   * Silently succeeds if the file does not exist (idempotent).
   */
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      // ENOENT means the file is already gone — that is fine.
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }
}
