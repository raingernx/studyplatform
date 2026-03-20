"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { ImagePlus, UploadCloud } from "lucide-react";
import { PickerDropzoneShell } from "@/design-system";

interface ImageDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
  maxSizeBytes?: number;
  helpText?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ImageDropzone({
  onFilesAccepted,
  disabled,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  helpText = "Drag & drop images here, or click to browse",
}: ImageDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const first = fileRejections[0];
        const code = first.errors[0]?.code;
        if (code === "file-too-large") {
          setError(
            `Image too large. Maximum size is ${Math.round(
              maxSizeBytes / (1024 * 1024),
            )} MB.`,
          );
        } else if (code === "file-invalid-type") {
          setError("Invalid image type. Use JPEG, PNG, WebP, or GIF.");
        } else {
          setError("Some files were rejected. Please check size and type.");
        }
      } else {
        setError(null);
      }

      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [maxSizeBytes, onFilesAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: handleDrop,
      accept: { "image/*": [] },
      multiple: true,
      maxSize: maxSizeBytes,
      disabled,
    });

  const borderColor = isDragReject
    ? "border-red-300"
    : isDragActive
      ? "border-brand-400"
      : "border-border-subtle";

  const bgColor = isDragActive ? "bg-surface-50" : "bg-white";

  return (
    <div className="w-full min-w-0 space-y-1.5">
      <PickerDropzoneShell
        {...getRootProps()}
        active={isDragActive}
        reject={isDragReject}
        disabled={Boolean(disabled)}
        className={[borderColor, bgColor].join(" ")}
      >
        <input {...getInputProps()} />
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          {isDragActive ? (
            <UploadCloud className="h-5 w-5" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </div>
        <p className="font-medium text-text-primary">
          {isDragActive ? "Drop images to upload" : helpText}
        </p>
        <p className="mt-1 text-[11px] text-text-secondary">
          JPEG, PNG, WebP, or GIF — up to{" "}
          {Math.round(maxSizeBytes / (1024 * 1024))} MB each.
        </p>
      </PickerDropzoneShell>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
