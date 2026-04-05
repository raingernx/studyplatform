"use client";

import { useState } from "react";

// line-clamp-4 at text-body (1rem) + leading-7 (1.75rem line-height) clamps at
// roughly 250–350 chars depending on container width. 300 is a safe crossover:
// descriptions shorter than this never overflow 4 lines; longer ones almost
// always do on at least one viewport width. This avoids a post-paint DOM
// measurement (scrollHeight read + setState) that was causing layout shift.
const CLAMP_THRESHOLD = 300;

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
  const needsToggle = description.length > CLAMP_THRESHOLD;

  return (
    <section id="description" className="space-y-3 border-t border-border pt-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-small leading-6 text-muted-foreground">
          Review the scope, study value, and what this resource is designed to help you do.
        </p>
      </div>
      <p className={`text-body leading-7 text-muted-foreground ${!expanded ? "line-clamp-4" : ""}`}>
        {description}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-small font-medium text-primary-700 transition hover:text-primary-800"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}
