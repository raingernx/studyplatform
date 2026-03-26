import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * Deprecated creator settings alias kept as a one-line compatibility shim.
 * The active creator navigation points directly to the profile route.
 */
export default function CreatorSettingsCompatibilityPage() {
  redirect(routes.creatorProfile);
}
