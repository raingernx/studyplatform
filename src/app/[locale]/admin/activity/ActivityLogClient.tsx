"use client";

import { useMemo, useState } from "react";

import { Button, Card, Input, Select } from "@/design-system";
import { Badge } from "@/components/ui/Badge";

type ActivityAction =
  | "created_resource"
  | "updated_resource"
  | "deleted_resource"
  | "purchased_resource"
  | "user_registered"
  | "user_banned";

interface ActivityRow {
  id: string;
  user: string;
  action: ActivityAction;
  target: string;
  date: Date;
}

const MOCK_ACTIVITY: ActivityRow[] = [
  {
    id: "1",
    user: "sandstorm",
    action: "created_resource",
    target: "Algebra Pack",
    date: new Date("2026-03-13T10:15:00Z"),
  },
  {
    id: "2",
    user: "sandstorm",
    action: "updated_resource",
    target: "AP Physics Pack",
    date: new Date("2026-03-12T16:30:00Z"),
  },
  {
    id: "3",
    user: "maria",
    action: "purchased_resource",
    target: "Algebra Pack",
    date: new Date("2026-03-12T12:05:00Z"),
  },
  {
    id: "4",
    user: "newbie",
    action: "user_registered",
    target: "Account",
    date: new Date("2026-03-11T09:00:00Z"),
  },
  {
    id: "5",
    user: "moderator",
    action: "user_banned",
    target: "spammer42",
    date: new Date("2026-03-10T18:45:00Z"),
  },
  {
    id: "6",
    user: "sandstorm",
    action: "deleted_resource",
    target: "Old Geometry Notes",
    date: new Date("2026-03-09T14:20:00Z"),
  },
];

const ACTION_OPTIONS: { value: "all" | ActivityAction; label: string }[] = [
  { value: "all", label: "All actions" },
  { value: "created_resource", label: "Created resource" },
  { value: "updated_resource", label: "Updated resource" },
  { value: "deleted_resource", label: "Deleted resource" },
  { value: "purchased_resource", label: "Purchased resource" },
  { value: "user_registered", label: "User registered" },
  { value: "user_banned", label: "User banned" },
];

const PAGE_SIZE = 10;

function formatActionLabel(action: ActivityAction): string {
  switch (action) {
    case "created_resource":
      return "Created resource";
    case "updated_resource":
      return "Updated resource";
    case "deleted_resource":
      return "Deleted resource";
    case "purchased_resource":
      return "Purchased resource";
    case "user_registered":
      return "User registered";
    case "user_banned":
      return "User banned";
  }
}

function badgeVariantForAction(action: ActivityAction) {
  switch (action) {
    case "created_resource":
    case "updated_resource":
      return "info" as const;
    case "deleted_resource":
    case "user_banned":
      return "destructive" as const;
    case "purchased_resource":
      return "success" as const;
    case "user_registered":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function ActivityLogClient() {
  const [actionFilter, setActionFilter] = useState<"all" | ActivityAction>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...MOCK_ACTIVITY];

    if (actionFilter !== "all") {
      rows = rows.filter((row) => row.action === actionFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((row) => row.date >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      // include entire end day
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((row) => row.date <= to);
    }

    if (userQuery.trim()) {
      const q = userQuery.trim().toLowerCase();
      rows = rows.filter(
        (row) =>
          row.user.toLowerCase().includes(q) ||
          row.target.toLowerCase().includes(q),
      );
    }

    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [actionFilter, dateFrom, dateTo, userQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  function handlePageChange(next: number) {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
          Activity Log
        </h1>
        <p className="mt-1 text-meta text-text-secondary">
          Monitor important platform actions.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs space-y-1.5">
          <label
            htmlFor="actionFilter"
            className="text-sm font-medium text-text-primary"
          >
            Action type
          </label>
          <Select
            id="actionFilter"
            value={actionFilter}
            onChange={(e) =>
              setActionFilter(e.target.value as "all" | ActivityAction)
            }
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="dateFrom"
              className="text-sm font-medium text-text-primary"
            >
              From
            </label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="dateTo"
              className="text-sm font-medium text-text-primary"
            >
              To
            </label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-1.5">
          <label
            htmlFor="userQuery"
            className="text-sm font-medium text-text-primary"
          >
            User search
          </label>
          <Input
            id="userQuery"
            placeholder="Search by user or target…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-text-secondary">
                  User
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Action
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Target
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No activity found for the current filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="bg-white">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary">
                      {row.user}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <Badge variant={badgeVariantForAction(row.action)}>
                        {formatActionLabel(row.action)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {row.target}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {formatDate(row.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination placeholder */}
      <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
