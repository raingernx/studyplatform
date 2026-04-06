"use client";

import Image from "next/image";
import { useRef } from "react";
import { AlertCircle, ImageIcon, Upload } from "lucide-react";
import { PickerActionButton, PickerActions } from "@/design-system";

type BrandAssetPreviewVariant = "wide" | "square";
type BrandAssetPreviewTone = "light" | "dark";

interface BrandAssetFieldProps {
  label: string;
  helperText: string;
  value: string;
  previewValue?: string;
  inheritedLabel?: string | null;
  platformName: string;
  previewVariant: BrandAssetPreviewVariant;
  previewTone?: BrandAssetPreviewTone;
  isUploading: boolean;
  error?: string | null;
  onUpload: (file: File) => void;
}

function isRuntimeBrandAsset(value: string) {
  return value.startsWith("/brand-assets/");
}

function BrandAssetPreview({
  label,
  value,
  previewValue,
  platformName,
  previewVariant,
  previewTone = "light",
  isUploading,
}: {
  label: string;
  value: string;
  previewValue?: string;
  platformName: string;
  previewVariant: BrandAssetPreviewVariant;
  previewTone?: BrandAssetPreviewTone;
  isUploading: boolean;
}) {
  const effectiveValue = previewValue ?? value;
  const hasAsset = Boolean(effectiveValue);
  const isWide = previewVariant === "wide";
  const isDarkTone = previewTone === "dark";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-border",
        isDarkTone
          ? "bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:12px_12px]"
          : "bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] [background-size:12px_12px]",
        isWide ? "h-16 w-full sm:h-20 lg:h-24" : "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0",
          isDarkTone
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-muted/95 via-card/90 to-muted/80",
        ].join(" ")}
      />

      <div className="relative flex h-full w-full items-center justify-center px-4 py-3">
        {hasAsset ? (
          effectiveValue.startsWith("/") && !isRuntimeBrandAsset(effectiveValue) ? (
            <Image
              src={effectiveValue}
              alt={`${platformName} ${label.toLowerCase()} preview`}
              width={previewVariant === "wide" ? 320 : 96}
              height={96}
              className={[
                "max-w-full object-contain",
                isWide
                  ? "h-full max-h-[48px] w-auto sm:max-h-[64px] lg:max-h-[72px]"
                  : "h-full max-h-[44px] w-auto sm:max-h-[56px] lg:max-h-[64px]",
              ].join(" ")}
              sizes={
                isWide
                  ? "(max-width: 639px) 100vw, (max-width: 1024px) 70vw, 640px"
                  : "(max-width: 1024px) 96px, 120px"
              }
            />
          ) : (
            <img
              src={effectiveValue}
              alt={`${platformName} ${label.toLowerCase()} preview`}
              className={[
                "max-w-full object-contain",
                isWide
                  ? "h-full max-h-[48px] w-auto sm:max-h-[64px] lg:max-h-[72px]"
                  : "h-full max-h-[44px] w-auto sm:max-h-[56px] lg:max-h-[64px]",
              ].join(" ")}
            />
          )
        ) : (
          <div
            className={[
              "flex h-full w-full items-center justify-center text-muted-foreground",
              isWide ? "justify-start gap-3" : "gap-2",
            ].join(" ")}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-card/80">
              <ImageIcon
                className={["h-4 w-4", isDarkTone ? "text-slate-300" : ""].join(" ")}
                aria-hidden
              />
            </span>
            {isWide ? (
              <div className="min-w-0">
                <p
                  className={[
                    "text-sm font-medium",
                    isDarkTone ? "text-white" : "text-foreground",
                  ].join(" ")}
                >
                  No asset uploaded
                </p>
                <p
                  className={[
                    "text-xs",
                    isDarkTone ? "text-slate-300" : "text-muted-foreground",
                  ].join(" ")}
                >
                  Upload an image to preview it here.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-card/75 backdrop-blur-[1px]">
          <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-sm font-medium text-foreground shadow-sm">
            {hasAsset ? "Replacing asset…" : "Uploading asset…"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BrandAssetField({
  label,
  helperText,
  value,
  previewValue,
  inheritedLabel,
  platformName,
  previewVariant,
  previewTone = "light",
  isUploading,
  error,
  onUpload,
}: BrandAssetFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted p-4 sm:p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </div>

      <div className={previewVariant === "wide" ? "w-full" : ""}>
        <BrandAssetPreview
          label={label}
          value={value}
          previewValue={previewValue}
          platformName={platformName}
          previewVariant={previewVariant}
          previewTone={previewTone}
          isUploading={isUploading}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onUpload(file);
          }
        }}
      />

      <div className="min-w-0 space-y-2">
        <PickerActions className="flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center">
          <PickerActionButton
            type="button"
            onClick={() => inputRef.current?.click()}
            loading={isUploading}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {!isUploading ? <Upload className="h-4 w-4" /> : null}
            {isUploading
              ? value
                ? "Replacing asset…"
                : "Uploading asset…"
              : value
                ? "Replace asset"
                : "Upload asset"}
          </PickerActionButton>
          {value ? (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {value}
            </span>
          ) : inheritedLabel ? (
            <span className="text-xs text-muted-foreground">{inheritedLabel}</span>
          ) : (
            <span className="text-xs text-muted-foreground">No asset uploaded yet.</span>
          )}
        </PickerActions>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
