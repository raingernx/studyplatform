"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileJson,
  Info,
} from "lucide-react";
import { Button, Badge, Textarea } from "@/design-system";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

const PANEL_CLASS = "rounded-2xl border border-border bg-card shadow-card";
const PANEL_HEADER_CLASS = "border-b border-border px-6 py-4";
const PANEL_TITLE_CLASS = "text-sm font-semibold text-foreground";
const PANEL_DESCRIPTION_CLASS = "mt-0.5 text-sm text-muted-foreground";
const TABLE_HEAD_ROW_CLASS = "border-b border-border bg-muted";
const TABLE_HEAD_CELL_CLASS = "px-4 py-2.5 font-semibold text-muted-foreground";
const TABLE_BODY_CLASS = "divide-y divide-border";
const TABLE_ROW_CLASS = "hover:bg-muted/60";
const CODE_PILL_CLASS =
  "rounded bg-muted px-1.5 py-0.5 text-[12px] font-mono text-muted-foreground";
const EMPTY_VALUE_CLASS = "text-muted-foreground";
const FEEDBACK_ERROR_CLASS =
  "mt-3 flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3";
const FEEDBACK_SUCCESS_CLASS =
  "mt-3 flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-4 py-2.5";

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
      <div className={PANEL_CLASS}>
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/70"
        >
          <span className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-info-600" />
            <span className="text-sm font-semibold text-foreground">
              Format reference &amp; example
            </span>
          </span>
          {showExample ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showExample && (
          <div className="border-t border-border px-6 pb-6 pt-4">
            {/* Field reference */}
            <div className="mb-5 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className={TABLE_HEAD_ROW_CLASS}>
                    <th className={TABLE_HEAD_CELL_CLASS}>Field</th>
                    <th className={TABLE_HEAD_CELL_CLASS}>Type</th>
                    <th className={TABLE_HEAD_CELL_CLASS}>Required</th>
                    <th className={TABLE_HEAD_CELL_CLASS}>Notes</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASS}>
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
                    <tr key={field} className="hover:bg-muted/70">
                      <td className="px-4 py-2.5">
                        <code className={CODE_PILL_CLASS}>
                          {field}
                        </code>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-brand-700">
                        {type}
                      </td>
                      <td className="px-4 py-2.5">
                        {req === "Yes" ? (
                          <Badge variant="info">Required</Badge>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Example */}
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Example JSON
            </p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-foreground p-4 text-[12px] leading-relaxed text-background">
              {EXAMPLE_JSON}
            </pre>

            <Button
              type="button"
              onClick={() => {
                setRawJson(EXAMPLE_JSON);
                setShowExample(false);
                setParsedItems(null);
                setParseError(null);
              }}
              variant="outline"
              size="sm"
              className="mt-3"
              leftIcon={<FileJson className="h-3.5 w-3.5" />}
            >
              Use this example
            </Button>
          </div>
        )}
      </div>

      {/* ── Section 2: JSON input ──────────────────────────────────────────── */}
      <div className={PANEL_CLASS}>
        <div className={PANEL_HEADER_CLASS}>
          <h2 className={PANEL_TITLE_CLASS}>Paste JSON</h2>
          <p className={PANEL_DESCRIPTION_CLASS}>
            Paste an array of resource objects. Maximum 100 per batch.
          </p>
        </div>

        <div className="p-6">
          <Textarea
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
            className="min-h-[360px] rounded-xl border border-border bg-foreground p-4 font-mono
                       text-[13px] leading-relaxed text-background placeholder:text-background/45
                       focus:border-primary-500 focus:ring-primary-500/20"
          />

          {/* Parse error */}
          {parseError && (
            <div className={FEEDBACK_ERROR_CLASS}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
              <p className="text-[13px] text-danger-700">{parseError}</p>
            </div>
          )}

          {/* Success parse feedback */}
          {parsedItems && !parseError && (
            <div className={FEEDBACK_SUCCESS_CLASS}>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
              <p className="text-[13px] text-success-700">
                {parsedItems.length} resource
                {parsedItems.length !== 1 ? "s" : ""} parsed successfully. Review below and click{" "}
                <strong>Upload Resources</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            type="button"
            onClick={handleReset}
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset
          </Button>

          <div className="flex items-center gap-3">
            {/* Validate */}
            <Button
              type="button"
              onClick={handleValidate}
              disabled={!rawJson.trim()}
              variant="outline"
              size="sm"
            >
              Validate JSON
            </Button>

            {/* Upload */}
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!parsedItems || uploading || Boolean(result)}
              loading={uploading}
              size="sm"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
            >
              {uploading ? (
                "Uploading…"
              ) : (
                <>
                  Upload{parsedItems ? ` ${parsedItems.length}` : ""} Resource
                  {parsedItems?.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Validation preview ─────────────────────────────────── */}
      {parsedItems && (
        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>
              Preview — {parsedItems.length} resource
              {parsedItems.length !== 1 ? "s" : ""}
            </h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
              Server-side validation (category slugs, tag slugs) runs when you click Upload.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className={TABLE_HEAD_ROW_CLASS}>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Title</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Category</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Tags</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Previews</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Price</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY_CLASS}>
                {parsedItems.map((item, i) => {
                  const tags = coerceArray(item.tagSlugs);
                  const previews = coerceArray(item.previewUrls);
                  const status =
                    typeof item.status === "string" ? item.status : "PUBLISHED";

                  return (
                    <tr key={i} className={TABLE_ROW_CLASS}>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[240px] truncate font-medium text-foreground">
                          {coerceString(item.title)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {item.categorySlug ? (
                          <code className={CODE_PILL_CLASS}>
                            {String(item.categorySlug)}
                          </code>
                        ) : (
                          <span className={EMPTY_VALUE_CLASS}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tags.length > 0 ? (
                          <Badge variant="owned">
                            {tags.length} tag{tags.length !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className={EMPTY_VALUE_CLASS}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {previews.length > 0 ? (
                          <Badge variant="info">
                            {previews.length} image{previews.length !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className={EMPTY_VALUE_CLASS}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
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
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
          <div>
            <p className="text-[14px] font-semibold text-danger-700">Upload failed</p>
            <p className="mt-0.5 text-[13px] text-danger-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* ── Section 5: Result summary ──────────────────────────────────────── */}
      {result && (
        <div className="space-y-4">
          {/* Summary banners */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Success */}
            <div className="flex items-center gap-4 rounded-2xl border border-success-100 bg-success-50 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </span>
              <div>
                <p className="text-[22px] font-bold tabular-nums text-success-700">
                  {result.success}
                </p>
                <p className="text-[13px] text-success-700">
                  Resource{result.success !== 1 ? "s" : ""} created
                </p>
              </div>
            </div>

            {/* Failed */}
            <div
              className={[
                "flex items-center gap-4 rounded-2xl border px-5 py-4",
                result.failed > 0
                  ? "border-danger-100 bg-danger-50"
                  : "border-border bg-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  result.failed > 0 ? "bg-danger-100" : "bg-secondary",
                ].join(" ")}
              >
                <AlertCircle
                  className={[
                    "h-5 w-5",
                    result.failed > 0 ? "text-danger-600" : "text-muted-foreground",
                  ].join(" ")}
                />
              </span>
              <div>
                <p
                  className={[
                    "text-[22px] font-bold tabular-nums",
                    result.failed > 0 ? "text-danger-700" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {result.failed}
                </p>
                <p
                  className={[
                    "text-[13px]",
                    result.failed > 0 ? "text-danger-700" : "text-muted-foreground",
                  ].join(" ")}
                >
                  Failed
                </p>
              </div>
            </div>
          </div>

          {/* Created list */}
          {result.created.length > 0 && (
            <div className={PANEL_CLASS}>
              <div className="border-b border-border px-6 py-3.5">
                <h3 className="text-[13px] font-semibold text-muted-foreground">
                  Created resources
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className={TABLE_HEAD_ROW_CLASS}>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">Row</th>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">Title</th>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">ID</th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY_CLASS}>
                    {result.created.map((c) => (
                      <tr key={c.id} className={TABLE_ROW_CLASS}>
                        <td className="px-5 py-2.5 tabular-nums text-muted-foreground">
                          {c.row}
                        </td>
                        <td className="px-5 py-2.5 font-medium text-foreground">
                          {c.title}
                        </td>
                        <td className="px-5 py-2.5">
                          <code className={CODE_PILL_CLASS}>
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
            <div className="rounded-2xl border border-danger-100 bg-card shadow-card">
              <div className="border-b border-danger-100 bg-danger-50 px-6 py-3.5">
                <h3 className="text-[13px] font-semibold text-danger-700">
                  Errors — {result.errors.length} row
                  {result.errors.length !== 1 ? "s" : ""} failed
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className={TABLE_HEAD_ROW_CLASS}>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">Row</th>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">Title</th>
                      <th className="px-5 py-2.5 font-semibold text-muted-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY_CLASS}>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="hover:bg-danger-50/40">
                        <td className="px-5 py-2.5 tabular-nums text-muted-foreground">
                          {e.row}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {e.title ?? <span className={EMPTY_VALUE_CLASS}>—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-danger-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload another batch */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Upload another batch
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
