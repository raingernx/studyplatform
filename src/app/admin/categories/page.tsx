"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button, Input, Modal, RowActionButton, RowActions } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
} from "@/components/admin/table";

type Category = {
  id: string;
  name: string;
  slug: string;
  resources: number;
  createdAt: Date;
};

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat_math",
    name: "Mathematics",
    slug: "math",
    resources: 12,
    createdAt: new Date("2024-01-10T09:00:00Z"),
  },
  {
    id: "cat_physics",
    name: "Physics",
    slug: "physics",
    resources: 5,
    createdAt: new Date("2024-02-02T14:30:00Z"),
  },
];

type Mode = "create" | "edit";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const title = mode === "create" ? "Create Category" : "Edit Category";
  const description =
    mode === "create"
      ? "Add a new resource category for the marketplace."
      : "Update the category name or slug.";

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === editingId) ?? null,
    [categories, editingId],
  );

  function openCreateModal() {
    setMode("create");
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setOpen(true);
  }

  function openEditModal(category: Category) {
    setMode("edit");
    setEditingId(category.id);
    setFormName(category.name);
    setFormSlug(category.slug);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const name = formName.trim();
    const slug = formSlug.trim();

    if (!name || !slug) return;

    if (mode === "create") {
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name,
        slug,
        resources: 0,
        createdAt: new Date(),
      };
      setCategories((prev) => [newCategory, ...prev]);
    } else if (mode === "edit" && editingId && currentCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, name, slug } : c,
        ),
      );
    }

    setOpen(false);
  }

  function handleDelete(category: Category) {
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <Modal.Root open={open} onOpenChange={setOpen}>
        <AdminPageHeader
          title="Categories"
          description="Manage resource categories used in the marketplace."
          actions={
            <Modal.Trigger asChild>
              <Button
                type="button"
                size="sm"
                className="inline-flex items-center gap-2"
                onClick={openCreateModal}
              >
                <Plus className="h-4 w-4" />
                <span>Create Category</span>
              </Button>
            </Modal.Trigger>
          }
        />
          <Modal.Content showCloseButton={false}>
            <form onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Title>{title}</Modal.Title>
                <Modal.Description>{description}</Modal.Description>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="category-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Category Name
                  </label>
                  <Input
                    id="category-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="category-slug"
                    className="text-sm font-medium text-foreground"
                  >
                    Slug
                  </label>
                  <Input
                    id="category-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. math"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs, lowercase with dashes.
                  </p>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex items-center justify-end gap-2">
                <Modal.Close asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </Modal.Close>
                <Button type="submit" size="sm">
                  {mode === "create" ? "Create" : "Save changes"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Content>
        </Modal.Root>

      {/* Table */}
      <DataTable minWidth="min-w-[720px]">
        <DataTableHeader>
          <tr>
            <DataTableHeadCell className="px-2">
                  Name
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Slug
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Resources
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Created
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3" align="right">
                  Actions
            </DataTableHeadCell>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {categories.length === 0 ? (
            <TableEmptyState message="No categories yet" />
          ) : (
            categories.map((category) => (
              <DataTableRow key={category.id}>
                <DataTableCell className="px-2 font-medium text-foreground">
                  {category.name}
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-ui text-caption text-muted-foreground">
                    {category.slug}
                  </span>
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  <span className="text-small text-muted-foreground">
                    {category.resources} resource
                    {category.resources === 1 ? "" : "s"}
                  </span>
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  {formatDate(category.createdAt)}
                </DataTableCell>
                <DataTableCell className="px-3" align="right">
                  <RowActions>
                    <RowActionButton
                      type="button"
                      onClick={() => openEditModal(category)}
                    >
                      Edit
                    </RowActionButton>
                    <RowActionButton
                      type="button"
                      tone="danger"
                      onClick={() => handleDelete(category)}
                    >
                      Delete
                    </RowActionButton>
                  </RowActions>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
