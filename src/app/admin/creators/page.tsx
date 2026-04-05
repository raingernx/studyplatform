import { getAllCreatorApplications } from "@/services/creator";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreatorApplicationActions } from "@/components/admin/CreatorApplicationActions";

export const metadata = {
  title: "Creator Applications – Admin",
  description: "Review and manage creator access applications.",
};

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 ring-1 ring-green-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 ring-1 ring-red-200" },
};

export default async function AdminCreatorsPage() {
  const applications = await getAllCreatorApplications();

  const pending   = applications.filter((a) => a.creatorApplicationStatus === "PENDING");
  const rest      = applications.filter((a) => a.creatorApplicationStatus !== "PENDING");
  const sorted    = [...pending, ...rest];

  return (
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Creator Applications"
        description={`${pending.length} pending · ${applications.length} total`}
      />

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Creator Name / Slug
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bio
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((app) => {
                const badge = STATUS_BADGE[app.creatorApplicationStatus] ?? STATUS_BADGE.PENDING;
                return (
                  <tr key={app.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{app.name ?? "—"}</p>
                      <p className="text-[12px] text-muted-foreground">{app.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{app.creatorDisplayName ?? "—"}</p>
                      {app.creatorSlug && (
                        <p className="text-[12px] text-muted-foreground">/creators/{app.creatorSlug}</p>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="line-clamp-2 text-[12px] text-muted-foreground">
                        {app.creatorBio ?? <span className="italic text-muted-foreground/70">No bio</span>}
                      </p>
                      {app.creatorApplicationStatus === "REJECTED" && app.rejectionReason && (
                        <p className="mt-1 text-[11px] text-red-600">
                          <span className="font-medium">Reason: </span>
                          {app.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-muted-foreground">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {app.creatorApplicationStatus === "PENDING" ? (
                        <CreatorApplicationActions userId={app.id} />
                      ) : (
                        <span className="text-[12px] text-muted-foreground/70">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
