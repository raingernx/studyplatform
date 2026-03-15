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
    <section id="description" className="prose prose-zinc max-w-none">
      <h2 className="font-display text-lg font-semibold text-zinc-900">{title}</h2>
      <p
        ref={ref}
        className={`mt-2 text-[14px] leading-relaxed text-zinc-600 ${!expanded ? "line-clamp-4" : ""}`}
      >
        {description}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}
