import type { User, Resource, Purchase, Category, Tag, UserRole, SubStatus } from "@prisma/client";

// ── Extended session user type ────────────────────────────────────────────────
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  subscriptionStatus: SubStatus;
};

// ── Resource with relations ───────────────────────────────────────────────────
export type ResourceWithRelations = Resource & {
  author: Pick<User, "id" | "name" | "image">;
  category: Category | null;
  tags: { tag: Tag }[];
  _count: { purchases: number; reviews: number };
};

// ── API response shapes ───────────────────────────────────────────────────────
export type ApiSuccess<T> = { data: T; error?: never };
export type ApiError = { error: string; data?: never };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination ────────────────────────────────────────────────────────────────
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
