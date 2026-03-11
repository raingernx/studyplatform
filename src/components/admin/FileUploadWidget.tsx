"use client";

import { useRef, useState } from "react";
import { CheckCircle, FileText, Loader2, Trash2, Upload, X, XCircle } from "lucide-react";

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
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(
    initialFileName ?? null
  );
  const [currentFileSize, setCurrentFileSize] = useState<number | null>(
    initialFileSize ?? null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatus("idle");
    setErrorMsg(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    // Client-side size guard
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setStatus("uploading");
    setErrorMsg(null);

    if (!resourceId) return;

    try {
      const body = new FormData();
      body.append("resourceId", resourceId);
      body.append("file", selectedFile);

      const res = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error ?? `Upload failed (${res.status})`);
      }

      setCurrentFileName(json.fileName ?? selectedFile.name);
      setCurrentFileSize(json.fileSize ?? selectedFile.size);
      setSelectedFile(null);
      setStatus("success");

      // Reset the file input so the same file can be re-uploaded later
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setStatus("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-4">

      {/* ── Current file indicator ── */}
      {currentFileName ? (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-4 w-4 text-blue-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-800">
              {currentFileName}
            </p>
            {currentFileSize !== null && (
              <p className="text-[11px] text-zinc-400">
                {formatBytes(currentFileSize)}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={onRemoveCurrentFile}
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition hover:bg-surface-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-center">
          <p className="text-[13px] text-zinc-400">No file uploaded yet.</p>
        </div>
      )}

      {/* ── File picker ── */}
      <div>
        <label className="block text-[12px] font-medium text-zinc-500 mb-1.5">
          {currentFileName ? "Replace file" : "Upload file"}
          <span className="ml-1.5 text-zinc-400 font-normal">
            {resourceId
              ? `(PDF, DOCX, XLSX, ZIP, images — max ${MAX_MB} MB)`
              : "Save the resource first to upload a file."}
          </span>
        </label>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          disabled={!resourceId}
          className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2
                     text-[13px] text-zinc-700 shadow-sm
                     file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50
                     file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-blue-700
                     hover:file:bg-blue-100
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* ── Selected file preview + actions ── */}
      {selectedFile && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-blue-400" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-blue-700">
            {selectedFile.name}{" "}
            <span className="text-blue-400">
              ({formatBytes(selectedFile.size)})
            </span>
          </p>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove selected file"
            className="shrink-0 rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Upload button ── */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!resourceId || !selectedFile || status === "uploading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl
                   bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm
                   transition hover:bg-blue-700 active:scale-[0.98]
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "uploading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {currentFileName ? "Replace file" : "Upload file"}
          </>
        )}
      </button>

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
