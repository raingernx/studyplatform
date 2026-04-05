"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImagePlus } from "lucide-react";

import { PickerDropzoneShell } from "@/design-system";
import { cn } from "@/lib/utils";
import type { ImageDropzoneProps } from "./ImageDropzone";

type LazyImageDropzoneProps = ImageDropzoneProps & {
  rootTestId?: string;
};

const DynamicImageDropzone = dynamic(
  () => import("./ImageDropzone").then((mod) => mod.ImageDropzone),
  {
    ssr: false,
    loading: () => <ImageDropzoneLoadingShell helpText="Preparing image upload…" />,
  },
);

function ImageDropzoneShellContent({
  helpText,
  supportingText,
}: {
  helpText: string;
  supportingText: string;
}) {
  return (
    <>
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-brand-600">
        <ImagePlus className="h-5 w-5" />
      </div>
      <p className="font-medium text-foreground">{helpText}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{supportingText}</p>
    </>
  );
}

function ImageDropzoneLoadingShell({
  helpText,
  disabled = false,
}: {
  helpText: string;
  disabled?: boolean;
}) {
  return (
    <div className="w-full min-w-0 space-y-1.5">
      <PickerDropzoneShell
        disabled={disabled}
        className={cn("border-border bg-card")}
        aria-busy="true"
      >
        <ImageDropzoneShellContent
          helpText={helpText}
          supportingText="The uploader loads separately to keep this form lighter on first render."
        />
      </PickerDropzoneShell>
    </div>
  );
}

export function LazyImageDropzone({
  rootTestId,
  ...props
}: LazyImageDropzoneProps) {
  const [shouldMountUploader, setShouldMountUploader] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const requestUploader = useCallback(() => {
    if (!props.disabled) {
      setShouldMountUploader(true);
    }
  }, [props.disabled]);

  useEffect(() => {
    if (shouldMountUploader || props.disabled) {
      return;
    }

    const node = shellRef.current;
    if (!node) {
      return;
    }

    if (typeof window.IntersectionObserver !== "function") {
      requestUploader();
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestUploader();
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [props.disabled, requestUploader, shouldMountUploader]);

  if (shouldMountUploader) {
    return (
      <div data-testid={rootTestId}>
        <DynamicImageDropzone {...props} />
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      data-testid={rootTestId}
      className="w-full min-w-0 space-y-1.5"
    >
      <PickerDropzoneShell
        disabled={Boolean(props.disabled)}
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        aria-label="Load image uploader"
        aria-disabled={props.disabled ? "true" : undefined}
        className="border-border bg-card"
        onMouseEnter={requestUploader}
        onFocus={requestUploader}
        onTouchStart={requestUploader}
        onClick={requestUploader}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            requestUploader();
          }
        }}
      >
        <ImageDropzoneShellContent
          helpText={props.helpText ?? "Drag & drop images here, or click to browse"}
          supportingText="The uploader will load when this section is in view or when you interact with it."
        />
      </PickerDropzoneShell>
    </div>
  );
}
