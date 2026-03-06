/** Absolute base URL – works in both server and client contexts */
export function getBaseUrl(): string {
  // Browser: use relative
  if (typeof window !== "undefined") return "";
  // Server: prefer NEXTAUTH_URL, then Vercel, then localhost
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
