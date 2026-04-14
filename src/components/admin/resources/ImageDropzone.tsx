"use client";

import { useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { PickerDropzoneShell } from "@/design-system";

export interface ImageDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
  maxSizeBytes?: number;
  helpText?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_PREFIX = "image/";

export function ImageDropzone({
  onFilesAccepted,
  disabled,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  helpText = "Drag & drop images here, or click to browse",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);

  function getFileError(file: File): string | null {
    if (!file.type.startsWith(ACCEPTED_IMAGE_PREFIX)) {
      return "Invalid image type. Use JPEG, PNG, WebP, or GIF.";
    }

    if (file.size > maxSizeBytes) {
      return `Image too large. Maximum size is ${Math.round(
        maxSizeBytes / (1024 * 1024),
      )} MB.`;
    }

    return null;
  }

  function processFiles(files: File[]) {
    const acceptedFiles: File[] = [];
    let firstError: string | null = null;

    files.forEach((file) => {
      const fileError = getFileError(file);
      if (fileError) {
        firstError ??= fileError;
        return;
      }
      acceptedFiles.push(file);
    });

    setError(firstError);

    if (acceptedFiles.length > 0) {
      onFilesAccepted(acceptedFiles);
    }
  }

  function resetDragState() {
    dragDepthRef.current = 0;
    setIsDragActive(false);
    setIsDragReject(false);
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    processFiles(Array.from(fileList));
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
    setIsDragReject(
      Array.from(event.dataTransfer.items).some(
        (item) => item.kind === "file" && item.type && !item.type.startsWith(ACCEPTED_IMAGE_PREFIX),
      ),
    );
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
      setIsDragReject(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    resetDragState();
    processFiles(droppedFiles);
  }

  function handleOpenFilePicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  const borderColor = isDragReject
    ? "border-red-300"
    : isDragActive
      ? "border-brand-400"
      : "border-border";

  const bgColor = isDragActive ? "bg-muted" : "bg-card";

  return (
    <div className="w-full min-w-0 space-y-1.5">
      <PickerDropzoneShell
        active={isDragActive}
        reject={isDragReject}
        disabled={Boolean(disabled)}
        className={[borderColor, bgColor].join(" ")}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Select preview images to upload"
        aria-disabled={disabled ? "true" : undefined}
        onClick={handleOpenFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenFilePicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            handleFilesSelected(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-brand-600">
          {isDragActive ? (
            <UploadCloud className="h-5 w-5" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </div>
        <p className="font-medium text-foreground">
          {isDragActive ? "Drop images to upload" : helpText}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          JPEG, PNG, WebP, or GIF — up to{" "}
          {Math.round(maxSizeBytes / (1024 * 1024))} MB each.
        </p>
      </PickerDropzoneShell>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
