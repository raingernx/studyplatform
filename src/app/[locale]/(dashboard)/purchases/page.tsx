import { redirect } from "next/navigation";

/**
 * /purchases has moved to /dashboard/purchases.
 * Any bookmarked or hard-coded links are transparently forwarded.
 */
export default function PurchasesRedirectPage() {
  redirect("/dashboard/purchases");
}
