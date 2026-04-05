"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  /** Minimum width for horizontal scroll (e.g. min-w-[980px]) */
  minWidth?: string;
}

/**
 * Admin data table wrapper. Use with TableToolbar, thead/tbody, TablePagination, TableEmptyState.
 * Provides consistent border, spacing, and overflow behavior.
 */
export function DataTable({
  children,
  className,
  minWidth = "min-w-[800px]",
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className={cn("w-full text-left text-sm", minWidth)}>
          {children}
        </table>
      </div>
    </div>
  );
}

export interface DataTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-muted/80",
        className
      )}
    >
      {children}
    </thead>
  );
}

export interface DataTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
  return (
    <tbody
      className={cn("divide-y divide-border/60", className)}
    >
      {children}
    </tbody>
  );
}

export interface DataTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({
  children,
  className,
  onClick,
}: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "bg-card transition-colors hover:bg-muted/55",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableCell({
  children,
  className,
  align = "left",
}: DataTableCellProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "";
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-foreground",
        alignClass,
        className
      )}
    >
      {children}
    </td>
  );
}

export interface DataTableHeadCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableHeadCell({
  children,
  className,
  align = "left",
}: DataTableHeadCellProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "";
  return (
    <th
      className={cn(
        "px-4 py-2.5 font-ui text-caption text-muted-foreground whitespace-nowrap",
        alignClass,
        className
      )}
    >
      {children}
    </th>
  );
}
