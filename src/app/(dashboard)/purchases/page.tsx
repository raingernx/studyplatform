import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Resources – StudyPlatform",
};

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/purchases");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <DashboardSidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
        <main className="flex-1 bg-zinc-50 px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Resources</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Resources you&apos;ve purchased or unlocked through your subscription.
              </p>
            </div>

            {/* Empty state placeholder */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <BookOpen className="h-7 w-7 text-blue-500" />
              </span>
              <p className="mt-4 font-semibold text-zinc-800">No purchased resources yet</p>
              <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
                Browse the library and grab your first resource — free ones are available right now.
              </p>
              <Link
                href="/resources"
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white
                           shadow-sm transition hover:bg-blue-700"
              >
                Browse library
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
