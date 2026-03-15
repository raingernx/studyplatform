/**
 * StorageProvider interface.
 *
 * Defines the contract that all storage backends must implement.
 * Current implementation: R2Provider (see r2Provider.ts).
 * Fallback: LocalStorageProvider (see localStorage.ts) for local dev.
 *
 * To switch backends, update the active provider export in index.ts only —
 * all upload/download routes consume the abstraction and require no changes.
 */

export interface StorageProvider {
  /**
   * Persist a file and return its storage key.
   *
   * @param file - Raw file contents as a Buffer
   * @param key  - Unique storage key (e.g. "a1b2c3d4-filename.pdf").
   *               The provider may use this as-is or transform it.
   * @returns    The storage key under which the file was saved.
   *             For local storage this equals `key`.
   *             For S3/R2 this would be the object key.
   */
  upload(file: Buffer, key: string): Promise<string>;

  /**
   * Return a URL (or path) that allows the file to be served.
   *
   * For local storage this returns a server-side filesystem path used
   * internally by the download route (it is never exposed to the client).
   * For cloud providers this returns the public base URL of the object.
   *
   * Prefer `getSignedUrl()` for authenticated download delivery.
   *
   * @param key - The storage key returned by `upload`.
   */
  getUrl(key: string): string;

  /**
   * Return a time-limited signed URL that authorises a single download.
   *
   * For local storage this resolves to the filesystem path (the same value
   * as `getUrl`) so the download route can fall back to streaming from disk.
   *
   * For cloud providers (R2, S3, GCS) this generates a pre-signed GET URL
   * with the given expiry.  The download route redirects the client to this
   * URL — the file is served directly from the bucket, bypassing the server.
   *
   * @param key              - The storage key returned by `upload`.
   * @param expiresInSeconds - Signature lifetime in seconds (default: 900 = 15 min).
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Permanently remove a file from storage.
   *
   * Implementations must be idempotent — deleting a non-existent key
   * must not throw.
   *
   * @param key - The storage key to delete.
   */
  delete(key: string): Promise<void>;
}
