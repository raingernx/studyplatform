"use client";

import { useState, useRef, useEffect } from "react";

interface ResourceDescriptionProps {
  /** Section heading */
  title?: string;
  description: string;
}

export function ResourceDescription({
  title = "About",
  description,
}: ResourceDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    setNeedsToggle(el.scrollHeight > el.clientHeight);
  }, [description, expanded]);

  return (
    <section id="description" className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="text-[13px] text-zinc-500">
          Review the scope, study value, and what this resource helps you accomplish before you buy.
        </p>
      </div>
      <p
        ref={ref}
        className={`mt-3 text-[14px] leading-7 text-zinc-600 ${!expanded ? "line-clamp-4" : ""}`}
      >
        {description}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}
