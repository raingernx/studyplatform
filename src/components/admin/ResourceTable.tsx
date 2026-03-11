import Link from "next/link";
import { FileText, Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/admin/StatusBadge";

export interface AdminResourceRow {
  id: string;
  title: string;
  slug: string;
  previewUrl: string | null;
  isFree: boolean;
  price: number;
  status: string;
  createdAt: Date;
  author: {
    name: string | null;
    email: string | null;
  } | null;
  category: {
    name: string;
  } | null;
}

interface ResourceTableProps {
  resources: AdminResourceRow[];
}

function formatPrice(baht: number, isFree: boolean) {
  if (isFree || baht === 0) return "Free";
  return `฿${baht.toLocaleString("th-TH")}`;
}

export function ResourceTable({ resources }: ResourceTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-border-subtle bg-surface-50/80">
            <tr>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Resource
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Creator
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Category
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Price
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Status
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Created
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {resources.map((resource) => (
              <tr
                key={resource.id}
                className="bg-white transition-colors hover:bg-surface-50"
              >
                {/* Resource */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-surface-100">
                      {resource.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resource.previewUrl}
                          alt={resource.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {resource.title}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        /resources/{resource.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Creator */}
                <td className="px-3 py-3 align-middle">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-secondary">
                      {resource.author?.name ?? "Unknown"}
                    </p>
                    {resource.author?.email && (
                      <p className="truncate text-xs text-text-muted">
                        {resource.author.email}
                      </p>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                  {resource.category?.name ?? "—"}
                </td>

                {/* Price */}
                <td className="px-3 py-3 align-middle">
                  <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {formatPrice(resource.price, resource.isFree)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3 align-middle">
                  <StatusBadge status={resource.status} />
                </td>

                {/* Created */}
                <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                  {resource.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>

                {/* Actions */}
                <td className="px-3 py-3 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/resources/${resource.slug}`}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/admin/resources/${resource.id}`}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

