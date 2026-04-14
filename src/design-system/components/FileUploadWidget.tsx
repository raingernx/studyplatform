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
} from "./PickerControls";
import { formatFileSize } from "@/lib/format";

export interface FileUploadWidgetProps {
  resourceId?: string;
  initialFileName?: string | null;
  initialFileSize?: number | null;
  onRemoveCurrentFile?: () => void;
  onEnsureResourceId?: () => Promise<string | undefined>;
  uploadEndpoint?: string;
  onUploadComplete?: (payload: {
    resourceId: string;
    fileKey?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  }) => void;
  copy?: Partial<{
    saveFirstError: string;
    dragAndDrop: string;
    formats: string;
    maxSize: string;
    replaceFile: string;
    uploading: string;
    uploadFile: string;
    uploadSuccess: string;
    removeFileAriaLabel: string;
    removeSelectedFileAriaLabel: string;
  }>;
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

export function FileUploadWidget({
  resourceId,
  initialFileName,
  initialFileSize,
  onRemoveCurrentFile,
  onEnsureResourceId,
  uploadEndpoint = "/api/admin/resources/upload",
  onUploadComplete,
  copy,
}: FileUploadWidgetProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const labels = {
    saveFirstError: "Save or create the resource before uploading a file.",
    dragAndDrop: "Drag & drop file here, or click to browse",
    formats: `PDF, DOCX, XLSX, ZIP — up to ${MAX_MB} MB`,
    maxSize: `Max file size: ${MAX_MB} MB`,
    replaceFile: "Replace file",
    uploading: "Uploading…",
    uploadFile: "Upload file",
    uploadSuccess: "File uploaded successfully.",
    removeFileAriaLabel: "Remove file",
    removeSelectedFileAriaLabel: "Remove selected file",
    ...copy,
  };

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
      setErrorMsg(labels.saveFirstError);
      return;
    }

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

      const res = await fetch(uploadEndpoint, {
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
      onUploadComplete?.({
        resourceId: targetResourceId,
        fileKey: (json.fileKey as string | undefined) ?? null,
        fileName: (json.fileName as string | undefined) ?? selectedFile.name,
        fileSize: (json.fileSize as number | undefined) ?? selectedFile.size,
      });
      setSelectedFile(null);
      setStatus("success");

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

  return (
    <div className="w-full min-w-0 space-y-4">
      {uploadedFile ? (
        <>
          <PreviewCard className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <FileText className="h-4 w-4 text-brand-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[13px] font-medium text-foreground">
                <span className="truncate">{uploadedFile.name}</span>
                {uploadedFile.name ? (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {uploadedFile.name.split(".").pop()?.toUpperCase()}
                  </span>
                ) : null}
              </p>
              {uploadedFile.size !== null ? (
                <p className="text-[11px] text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </p>
              ) : null}
            </div>
            <PickerIconButton
              aria-label={labels.removeFileAriaLabel}
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
              {labels.replaceFile}
            </PickerActionButton>
            <input
              ref={inputRef}
              name="resourceFile"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              disabled={!resourceId}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </>
      ) : (
        <>
          <div
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
            <PickerDropzoneShell
              disabled={!resourceId && !onEnsureResourceId}
              role="button"
              tabIndex={!resourceId && !onEnsureResourceId ? -1 : 0}
              aria-label={labels.uploadFile}
              aria-disabled={!resourceId && !onEnsureResourceId ? "true" : undefined}
              onClick={() => {
                if (resourceId || onEnsureResourceId) {
                  inputRef.current?.click();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (resourceId || onEnsureResourceId) {
                    inputRef.current?.click();
                  }
                }
              }}
            >
              <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {labels.dragAndDrop}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {labels.formats}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {labels.maxSize}
              </p>
            </PickerDropzoneShell>
            <input
              ref={inputRef}
              name="resourceFile"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              disabled={!resourceId && !onEnsureResourceId}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {selectedFile ? (
            <PreviewCard tone="info" className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-600" />
              <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {selectedFile.name}{" "}
                <span className="text-muted-foreground">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </p>
              <PickerIconButton
                onClick={handleClear}
                aria-label={labels.removeSelectedFileAriaLabel}
                tone="info"
                className="p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </PickerIconButton>
            </PreviewCard>
          ) : null}

          <PickerActionButton
            type="button"
            onClick={handleUpload}
            disabled={
              !(resourceId || onEnsureResourceId) ||
              !selectedFile ||
              status === "uploading"
            }
            variant="primary"
            className="h-10 w-full justify-center px-5 text-[13px] font-semibold disabled:opacity-40"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.uploading}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {labels.uploadFile}
              </>
            )}
          </PickerActionButton>
        </>
      )}

      {status === "success" ? (
        <div className="flex items-center gap-2 rounded-xl border border-success-500/25 bg-accent px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-success-600" />
          <p className="text-[13px] font-medium text-success-700">
            {labels.uploadSuccess}
          </p>
        </div>
      ) : null}

      {status === "error" && errorMsg ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger-500/25 bg-accent px-4 py-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
          <p className="text-[13px] text-danger-700">{errorMsg}</p>
        </div>
      ) : null}
    </div>
  );
}
