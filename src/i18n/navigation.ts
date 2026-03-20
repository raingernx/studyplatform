// i18n removed — re-exports from next/navigation so any stale import compiles.
export { usePathname, useRouter, redirect } from "next/navigation";
export { default as Link } from "next/link";
export function getPathname(_opts: unknown): string {
  return "";
}
