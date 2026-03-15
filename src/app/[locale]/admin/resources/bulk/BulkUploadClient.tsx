"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  FileJson,
  Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape of one item after the client-side JSON.parse step */
interface ParsedItem {
  title?: unknown;
  description?: unknown;
  price?: unknown;
  categorySlug?: unknown;
  tagSlugs?: unknown;
  previewUrls?: unknown;
  fileUrl?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

interface BulkResult {
  success: number;
  failed: number;
  created: { row: number; title: string; id: string }[];
  errors: { row: number; title?: string; message: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAMPLE_JSON = `[
  {
    "title": "Algebra Practice Worksheet",
    "description": "Basic algebra worksheet for grade 7 students",
    "price": 0,
    "categorySlug": "mathematics",
    "tagSlugs": ["algebra", "worksheet"],
    "previewUrls": [
      "https://example.com/preview1.jpg"
    ],
    "fileUrl": "https://example.com/algebra.pdf",
    "status": "PUBLISHED"
  },
  {
    "title": "Geometry Exercises Pack",
    "description": "Comprehensive geometry exercises with answer key",
    "price": 199,
    "categorySlug": "mathematics",
    "tagSlugs": ["geometry"],
    "previewUrls": [],
    "fileUrl": "https://example.com/geometry.pdf",
    "status": "DRAFT"
  }
]`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPreviewPrice(price: unknown): string {
  if (typeof price !== "number") return "—";
  if (price === 0) return "Free";
  return `$${(price / 100).toFixed(2)}`;
}

function coerceString(v: unknown): string {
  return typeof v === "string" ? v : "—";
}

function coerceArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BulkUploadClient() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [rawJson, setRawJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [showExample, setShowExample] = useState(false);

  // ── Validate ───────────────────────────────────────────────────────────────

  function handleValidate() {
    setParseError(null);
    setParsedItems(null);
    setResult(null);
    setUploadError(null);

    if (!rawJson.trim()) {
      setParseError("Paste your JSON before validating.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      setParseError(
        e instanceof SyntaxError ? `JSON syntax error: ${e.message}` : "Invalid JSON."
      );
      return;
    }

    if (!Array.isArray(parsed)) {
      setParseError("JSON must be an array ( [ … ] ) of resource objects.");
      return;
    }
    if (parsed.length === 0) {
      setParseError("The array must contain at least one resource.");
      return;
    }
    if (parsed.length > 100) {
      setParseError(
        `Too many resources: found ${parsed.length}, maximum is 100 per batch.`
      );
      return;
    }

    setParsedItems(parsed as ParsedItem[]);
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!parsedItems) return;
    setUploading(true);
    setUploadError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/resources/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resources: parsedItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      setResult(data.data as BulkResult);
    } catch {
      setUploadError("Network error. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function handleReset() {
    setRawJson("");
    setParseError(null);
    setParsedItems(null);
    setResult(null);
    setUploadError(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Section 1: Instructions ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-card">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-[14px] font-semibold text-zinc-800">
              Format reference &amp; example
            </span>
          </span>
          {showExample ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {showExample && (
          <div className="border-t border-zinc-100 px-6 pb-6 pt-4">
            {/* Field reference */}
            <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-4 py-2.5 font-semibold text-zinc-500">Field</th>
                    <th className="px-4 py-2.5 font-semibold text-zinc-500">Type</th>
                    <th className="px-4 py-2.5 font-semibold text-zinc-500">Required</th>
                    <th className="px-4 py-2.5 font-semibold text-zinc-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ["title", "string", "Yes", "Minimum 3 characters"],
                    ["description", "string", "Yes", "Minimum 10 characters"],
                    ["price", "number", "Yes", "Price in cents. Use 0 for free resources"],
                    ["categorySlug", "string", "No", "Must match an existing category slug exactly"],
                    ["tagSlugs", "string[]", "No", "Array of tag slugs. All must exist"],
                    ["previewUrls", "string[]", "No", "Valid image URLs. Can be empty array"],
                    ["fileUrl", "string | null", "No", "Valid URL to the downloadable file"],
                    ["status", '"DRAFT" | "PUBLISHED"', "No", 'Defaults to "PUBLISHED"'],
                    ["type", '"PDF" | "DOCUMENT"', "No", 'Defaults to "PDF"'],
                    ["featured", "boolean", "No", "Defaults to false"],
                  ].map(([field, type, req, notes]) => (
                    <tr key={field} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] font-mono text-zinc-700">
                          {field}
                        </code>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-violet-600">
                        {type}
                      </td>
                      <td className="px-4 py-2.5">
                        {req === "Yes" ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-[12px] text-zinc-400">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-zinc-500">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Example */}
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
              Example JSON
            </p>
            <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-[12px] leading-relaxed text-emerald-400">
              {EXAMPLE_JSON}
            </pre>

            <button
              type="button"
              onClick={() => {
                setRawJson(EXAMPLE_JSON);
                setShowExample(false);
                setParsedItems(null);
                setParseError(null);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200
                         px-3 py-1.5 text-[12px] font-medium text-zinc-600 transition
                         hover:bg-zinc-50 hover:text-zinc-900"
            >
              <FileJson className="h-3.5 w-3.5" />
              Use this example
            </button>
          </div>
        )}
      </div>

      {/* ── Section 2: JSON input ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-card">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-[14px] font-semibold text-zinc-900">
            Paste JSON
          </h2>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Paste an array of resource objects. Maximum 100 per batch.
          </p>
        </div>

        <div className="p-6">
          <textarea
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              // Clear stale validation state when the user edits
              if (parsedItems || parseError) {
                setParsedItems(null);
                setParseError(null);
                setResult(null);
              }
            }}
            placeholder={`[\n  {\n    "title": "…",\n    "description": "…",\n    …\n  }\n]`}
            rows={16}
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono
                       text-[13px] leading-relaxed text-emerald-300 placeholder-zinc-600
                       outline-none ring-0 transition focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100 resize-y"
          />

          {/* Parse error */}
          {parseError && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-[13px] text-red-700">{parseError}</p>
            </div>
          )}

          {/* Success parse feedback */}
          {parsedItems && !parseError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-[13px] text-emerald-700">
                {parsedItems.length} resource
                {parsedItems.length !== 1 ? "s" : ""} parsed successfully. Review below and click{" "}
                <strong>Upload Resources</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px]
                       font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <div className="flex items-center gap-3">
            {/* Validate */}
            <button
              type="button"
              onClick={handleValidate}
              disabled={!rawJson.trim()}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2 text-[13px]
                         font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              Validate JSON
            </button>

            {/* Upload */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!parsedItems || uploading || Boolean(result)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2
                         text-[13px] font-semibold text-white shadow-sm transition
                         hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed
                         disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload{parsedItems ? ` ${parsedItems.length}` : ""} Resource
                  {parsedItems?.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Validation preview ─────────────────────────────────── */}
      {parsedItems && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-card">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-[14px] font-semibold text-zinc-900">
              Preview — {parsedItems.length} resource
              {parsedItems.length !== 1 ? "s" : ""}
            </h2>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              Server-side validation (category slugs, tag slugs) runs when you click Upload.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 font-semibold text-zinc-500">#</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Title</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Category</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Tags</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Previews</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-500">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {parsedItems.map((item, i) => {
                  const tags = coerceArray(item.tagSlugs);
                  const previews = coerceArray(item.previewUrls);
                  const status =
                    typeof item.status === "string" ? item.status : "PUBLISHED";

                  return (
                    <tr key={i} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 tabular-nums text-zinc-400">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[240px] truncate font-medium text-zinc-900">
                          {coerceString(item.title)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {item.categorySlug ? (
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] font-mono text-zinc-600">
                            {String(item.categorySlug)}
                          </code>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tags.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            {tags.length} tag{tags.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {previews.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            {previews.length} image{previews.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                            status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500",
                          ].join(" ")}
                        >
                          {status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-700">
                        {formatPreviewPrice(item.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 4: Upload error ────────────────────────────────────────── */}
      {uploadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-[14px] font-semibold text-red-800">Upload failed</p>
            <p className="mt-0.5 text-[13px] text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* ── Section 5: Result summary ──────────────────────────────────────── */}
      {result && (
        <div className="space-y-4">
          {/* Summary banners */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Success */}
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <p className="text-[22px] font-bold tabular-nums text-emerald-700">
                  {result.success}
                </p>
                <p className="text-[13px] text-emerald-700">
                  Resource{result.success !== 1 ? "s" : ""} created
                </p>
              </div>
            </div>

            {/* Failed */}
            <div
              className={[
                "flex items-center gap-4 rounded-2xl border px-5 py-4",
                result.failed > 0
                  ? "border-red-100 bg-red-50"
                  : "border-zinc-100 bg-zinc-50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  result.failed > 0 ? "bg-red-100" : "bg-zinc-100",
                ].join(" ")}
              >
                <AlertCircle
                  className={[
                    "h-5 w-5",
                    result.failed > 0 ? "text-red-500" : "text-zinc-400",
                  ].join(" ")}
                />
              </span>
              <div>
                <p
                  className={[
                    "text-[22px] font-bold tabular-nums",
                    result.failed > 0 ? "text-red-700" : "text-zinc-400",
                  ].join(" ")}
                >
                  {result.failed}
                </p>
                <p
                  className={[
                    "text-[13px]",
                    result.failed > 0 ? "text-red-700" : "text-zinc-400",
                  ].join(" ")}
                >
                  Failed
                </p>
              </div>
            </div>
          </div>

          {/* Created list */}
          {result.created.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-card">
              <div className="border-b border-zinc-100 px-6 py-3.5">
                <h3 className="text-[13px] font-semibold text-zinc-700">
                  Created resources
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">Row</th>
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">Title</th>
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {result.created.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/60">
                        <td className="px-5 py-2.5 tabular-nums text-zinc-400">
                          {c.row}
                        </td>
                        <td className="px-5 py-2.5 font-medium text-zinc-800">
                          {c.title}
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-mono text-zinc-500">
                            {c.id}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error list */}
          {result.errors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-white shadow-card">
              <div className="border-b border-red-50 bg-red-50 px-6 py-3.5">
                <h3 className="text-[13px] font-semibold text-red-700">
                  Errors — {result.errors.length} row
                  {result.errors.length !== 1 ? "s" : ""} failed
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">Row</th>
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">Title</th>
                      <th className="px-5 py-2.5 font-semibold text-zinc-400">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {result.errors.map((e, i) => (
                      <tr key={i} className="hover:bg-red-50/40">
                        <td className="px-5 py-2.5 tabular-nums text-zinc-400">
                          {e.row}
                        </td>
                        <td className="px-5 py-2.5 text-zinc-600">
                          {e.title ?? <span className="text-zinc-400">—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-red-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload another batch */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white
                         px-5 py-2 text-[13px] font-medium text-zinc-600 shadow-sm transition
                         hover:bg-zinc-50 hover:text-zinc-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Upload another batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
