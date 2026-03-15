import type { ResourceCardData } from "@/components/resources/ResourceCard";

export interface ResourceFormCategory {
  id: string;
  name: string;
}

export interface ResourceFormTag {
  id: string;
  name: string;
  slug: string;
}

export interface ResourceFormResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
}

export interface ResourcePayload {
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
  tagIds: string[];
  previewUrls: string[];
}

export interface ResourceFormValues {
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: string;
  fileUrl: string;
  categoryId: string;
  featured: boolean;
}

export interface ResourceFormProps {
  mode: "create" | "edit";
  id?: string;
  resource?: ResourceFormResource;
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
  initialTagIds?: string[];
  initialPreviewUrls?: string[];
  initialFileName?: string | null;
  initialFileSize?: number | null;
  onSubmit: (data: ResourcePayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Called when form state changes so the parent can render a live preview (e.g. create page sidebar). */
  onPreviewDataChange?: (data: ResourceCardData) => void;
}

