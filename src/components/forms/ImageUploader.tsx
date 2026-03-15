"use client";

import type { ReactNode } from "react";

/** Image upload primitive. For resource preview images use admin/FileUploadWidget or this as wrapper. */
interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  multiple?: boolean;
  children?: ReactNode;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  multiple = false,
  children,
  className,
}: ImageUploaderProps) {
  return (
    <div className={className}>
      {children ?? (
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Image URL"
          className="input-base w-full"
        />
      )}
    </div>
  );
}
