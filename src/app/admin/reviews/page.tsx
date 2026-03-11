import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Reviews – Admin",
  description: "Moderate user reviews for marketplace resources.",
};

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/reviews");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const reviews = await prisma.review.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      resource: { select: { id: true, title: true } },
    },
  });

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Moderate user feedback on resources.
        </p>
      </div>

      {/* Reviews table */}
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-text-secondary">
                  Resource
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  User
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Rating
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Review
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Created
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Status
                </th>
                <th className="px-3 py-3 text-right font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="bg-white">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary">
                      {review.resource.title}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <div className="flex flex-col">
                        <span>{review.user.name ?? "Anonymous"}</span>
                        <span className="text-xs text-text-muted">
                          {review.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary tabular-nums">
                      {review.rating}/5
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <p className="line-clamp-2 max-w-md">
                        {review.body ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {review.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" type="button">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" type="button">
                          Hide
                        </Button>
                        <Button variant="outline" size="sm" type="button">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

