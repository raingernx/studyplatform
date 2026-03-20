"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  PickerActionButton,
  PickerDropzoneShell,
  PickerIconButton,
  PreviewCard,
} from "@/design-system";
import { formatFileSize } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  /** The resource this file will be attached to. Undefined on create (save resource first to upload). */
  resourceId?: string;
  /** Currently stored file name (null when no file has been uploaded yet). */
  initialFileName?: string | null;
  /** Currently stored file size in bytes (null when no file uploaded). */
  initialFileSize?: number | null;
  /** Optional callback when the current stored file should be removed. */
  onRemoveCurrentFile?: () => void;
  /** When provided, will be called to lazily ensure a resource id exists before uploading (e.g. create draft). */
  onEnsureResourceId?: () => Promise<string | undefined>;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

type UploadedFile = {
  name: string;
  size: number | null;
} | null;

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
].join(",");

const MAX_MB = 50;

// ── Component ─────────────────────────────────────────────────────────────────

export function FileUploadWidget({
  resourceId,
  initialFileName,
  initialFileSize,
  onRemoveCurrentFile,
  onEnsureResourceId,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keep uploadedFile in sync with latest props (initialFileName / initialFileSize)
  useEffect(() => {
    if (initialFileName) {
      setUploadedFile({
        name: initialFileName,
        size: initialFileSize ?? null,
      });
    } else {
      setUploadedFile(null);
    }
  }, [initialFileName, initialFileSize]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatus("idle");
    setErrorMsg(null);
  }

  function handleFileDrop(files: FileList | File[]) {
    const fileArray = Array.from(files as ArrayLike<File>);
    const file = fileArray[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus("idle");
    setErrorMsg(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    let targetResourceId: string | undefined = resourceId;

    if (!targetResourceId && onEnsureResourceId) {
      targetResourceId = await onEnsureResourceId();
    }

    if (!targetResourceId) {
      setErrorMsg("Save or create the resource before uploading a file.");
      return;
    }

    // Client-side size guard
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setStatus("uploading");
    setErrorMsg(null);

    try {
      const body = new FormData();
      body.append("resourceId", targetResourceId);
      body.append("file", selectedFile);

      const res = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error ?? `Upload failed (${res.status})`);
      }

      setUploadedFile({
        name: (json.fileName as string | undefined) ?? selectedFile.name,
        size: (json.fileSize as number | undefined) ?? selectedFile.size,
      });
      setSelectedFile(null);
      setStatus("success");

      // Reset the file input so the same file can be re-uploaded later
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setStatus("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemoveExisting() {
    setStatus("idle");
    setErrorMsg(null);
    setSelectedFile(null);
    setUploadedFile(null);
    if (inputRef.current) inputRef.current.value = "";

    if (onRemoveCurrentFile) {
      await onRemoveCurrentFile();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-4">
      {uploadedFile ? (
        <>
          <PreviewCard className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-blue-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-800 flex items-center gap-2">
                <span className="truncate">{uploadedFile.name}</span>
                {uploadedFile.name && (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    {uploadedFile.name.split(".").pop()?.toUpperCase()}
                  </span>
                )}
              </p>
              {uploadedFile.size !== null && (
                <p className="text-[11px] text-zinc-400">
                  {formatFileSize(uploadedFile.size)}
                </p>
              )}
            </div>
            <PickerIconButton
              aria-label="Remove file"
              onClick={handleRemoveExisting}
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full p-0"
            >
              <X className="h-4 w-4" />
            </PickerIconButton>
          </PreviewCard>

          <div className="space-y-2">
            <PickerActionButton
              type="button"
              onClick={() => inputRef.current?.click()}
              actionStyle="dashed"
            >
              <Upload className="h-4 w-4" />
              Replace file
            </PickerActionButton>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              disabled={!resourceId}
              className="sr-only"
            />
          </div>
        </>
      ) : (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileDrop(e.dataTransfer.files);
                e.dataTransfer.clearData();
              }
            }}
            className="block"
          >
            <PickerDropzoneShell disabled={!resourceId && !onEnsureResourceId}>
              <Upload className="mb-2 h-5 w-5 text-text-muted" />
              <p className="font-medium text-text-primary">
                Drag & drop file here, or click to browse
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">
                PDF, DOCX, XLSX, ZIP — up to {MAX_MB} MB
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                Max file size: {MAX_MB} MB
              </p>
            </PickerDropzoneShell>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              disabled={!resourceId && !onEnsureResourceId}
              className="sr-only"
            />
          </label>

          {selectedFile && (
            <PreviewCard tone="info" className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-blue-400" />
              <p className="min-w-0 flex-1 truncate text-[13px] text-blue-700">
                {selectedFile.name}{" "}
                <span className="text-blue-400">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </p>
              <PickerIconButton
                onClick={handleClear}
                aria-label="Remove selected file"
                tone="info"
                className="p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </PickerIconButton>
            </PreviewCard>
          )}

          <PickerActionButton
            type="button"
            onClick={handleUpload}
            disabled={!resourceId || !selectedFile || status === "uploading"}
            variant="primary"
            className="h-10 w-full justify-center px-5 text-[13px] font-semibold disabled:opacity-40"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload file
              </>
            )}
          </PickerActionButton>
        </>
      )}

      {/* ── Success feedback ── */}
      {status === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-[13px] text-emerald-700 font-medium">
            File uploaded successfully.
          </p>
        </div>
      )}

      {/* ── Error feedback ── */}
      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[13px] text-red-700">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
