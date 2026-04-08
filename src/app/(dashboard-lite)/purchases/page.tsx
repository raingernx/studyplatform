import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * /purchases has moved to /dashboard/library.
 * Any bookmarked or hard-coded links are transparently forwarded.
 */
export default function PurchasesRedirectPage() {
  redirect(routes.library);
}
