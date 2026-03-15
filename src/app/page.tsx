import { redirect } from "next/navigation";

export default function HomeRedirectPage() {
  // Redirect the root route to the Discover marketplace
  redirect("/resources");
}
