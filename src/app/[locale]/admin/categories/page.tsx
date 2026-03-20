"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Card } from "@/design-system";
import { Button } from "@/design-system";
import { Input } from "@/design-system";
import { Modal } from "@/components/ui/Modal";

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Categories
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Manage resource categories used in the marketplace.
          </p>
        </div>
        <Modal.Root open={open} onOpenChange={setOpen}>
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
                    className="text-sm font-medium text-text-primary"
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
                    className="text-sm font-medium text-text-primary"
                  >
                    Slug
                  </label>
                  <Input
                    id="category-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. math"
                  />
                  <p className="text-xs text-text-muted">
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
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-text-secondary">
                  Name
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Slug
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Resources
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Created
                </th>
                <th className="px-3 py-3 text-right font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="bg-white">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary">
                      {category.name}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <span className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <span className="text-xs text-text-muted">
                        {category.resources} resource
                        {category.resources === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => openEditModal(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          onClick={() => handleDelete(category)}
                        >
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
      </Card>
    </div>
  );
}
