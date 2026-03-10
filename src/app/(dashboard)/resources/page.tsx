import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { getBaseUrl } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Resource Library",
  description: "Browse thousands of curated educational resources.",
};

async function getInitialData() {
  const [resourcesRes, categoriesRes] = await Promise.allSettled([
    fetch(`${getBaseUrl()}/api/resources?pageSize=12`, {
      next: { revalidate: 60 },
    }),
    fetch(`${getBaseUrl()}/api/resources/categories`, {
      next: { revalidate: 3600 },
    }),
  ]);

  const resources =
    resourcesRes.status === "fulfilled" && resourcesRes.value.ok
      ? (await resourcesRes.value.json()).data?.items ?? []
      : [];

  // Categories are hardcoded for now (API endpoint can be added in Session 3)
  const categories = [
    { id: "1", name: "Mathematics", slug: "mathematics" },
    { id: "2", name: "Science", slug: "science" },
    { id: "3", name: "Humanities", slug: "humanities" },
  ];

  return { resources, categories };
}

async function getUserPurchases(): Promise<string[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const res = await fetch(`${getBaseUrl()}/api/purchases`, {
      headers: { Cookie: "" }, // server-side, handled via session
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((p: { resource: { id: string } }) => p.resource.id);
  } catch {
    return [];
  }
}

export default async function ResourcesPage() {
  const [{ resources, categories }, ownedIds] = await Promise.all([
    getInitialData(),
    getUserPurchases(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Resource Library</h1>
          <p className="mt-2 text-gray-500">
            Curated educational materials for every subject and skill level
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <ResourceGrid
              initialResources={resources}
              categories={categories}
              ownedIds={ownedIds}
            />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
