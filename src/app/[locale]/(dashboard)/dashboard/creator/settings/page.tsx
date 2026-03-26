import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * Deprecated localized creator settings alias kept as a one-line compatibility shim.
 * The active creator navigation points directly to the flat profile route.
 */
export default function CreatorSettingsCompatibilityPage() {
  redirect(routes.creatorProfile);
}
