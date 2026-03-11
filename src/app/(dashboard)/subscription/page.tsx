import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Subscription – PaperDock",
};

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/subscription");

  const subscriptionStatus: string = session.user.subscriptionStatus ?? "INACTIVE";
  const isActive = subscriptionStatus === "ACTIVE";

  return (
    <main className="px-8 py-10 bg-surface-50">
      <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Subscription</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Manage your plan and billing details.
              </p>
            </div>

            {isActive ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600">
                    <Sparkles className="h-6 w-6 text-white" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Pro Plan — Active</p>
                    <p className="mt-0.5 text-sm text-zinc-500">You have full access to all resources.</p>
                  </div>
                </div>
                <div className="mt-6 border-t border-zinc-100 pt-4">
                  <p className="text-xs text-zinc-400">
                    To manage billing, cancel, or change your plan, use the portal below.
                  </p>
                  <button
                    disabled
                    className="mt-3 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium
                               text-zinc-400 opacity-60 cursor-not-allowed"
                  >
                    Open billing portal (coming soon)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                  <CreditCard className="h-7 w-7 text-violet-500" />
                </span>
                <p className="mt-4 font-semibold text-zinc-800">No active subscription</p>
                <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
                  Upgrade to Pro to unlock unlimited access to all resources on the platform.
                </p>
                <Link
                  href="/membership"
                  className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white
                             shadow-sm transition hover:bg-violet-700"
                >
                  View plans
                </Link>
              </div>
            )}
      </div>
    </main>
  );
}
