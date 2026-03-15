/**
 * Storage module entry point.
 *
 * Import `storage` from here in all upload and download routes:
 *
 *   import { storage } from "@/lib/storage";
 *
 * Active provider selection:
 *   - If R2_ENDPOINT + R2_BUCKET + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY
 *     are all set → R2Provider (Cloudflare R2, production)
 *   - Otherwise  → LocalStorageProvider (local filesystem, development only)
 *
 * To force a specific backend regardless of env vars, replace the
 * `storage` export below with a direct instantiation:
 *
 *   export const storage = new R2Provider();
 *   export const storage = new LocalStorageProvider();
 */

export type { StorageProvider } from "./storage";
export { LocalStorageProvider } from "./localStorage";
export { R2Provider } from "./r2Provider";

import { LocalStorageProvider } from "./localStorage";
import { R2Provider } from "./r2Provider";

const R2_VARS = ["R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
const useR2 = R2_VARS.every((v) => !!process.env[v]);

if (useR2) {
  console.info("[storage] Using R2Provider (Cloudflare R2)");
} else {
  console.warn(
    "[storage] R2 env vars not set — falling back to LocalStorageProvider. " +
      "Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY for production."
  );
}

/**
 * The active storage provider for the application.
 * Configured via environment variables (see above).
 * No upload/download routes require changes when switching backends.
 */
export const storage = useR2 ? new R2Provider() : new LocalStorageProvider();
