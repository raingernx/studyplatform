"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface TagInputOption {
  id: string;
  name: string;
  slug: string;
}

interface TagInputProps {
  options: TagInputOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** When provided, Enter with no selection and non-empty query will create a tag via this callback. */
  onCreateTag?: (name: string) => Promise<TagInputOption | null>;
  /** Optional label (e.g. "Tags") */
  label?: React.ReactNode;
  className?: string;
}

export function TagInput({
  options,
  selectedIds,
  onChange,
  placeholder = "Search or add tags…",
  onCreateTag,
  label,
  className,
}: TagInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  const notSelected = filtered.filter((t) => !selectedIds.includes(t.id));
  const selectedTags = options.filter((t) => selectedIds.includes(t.id));

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, notSelected.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function add(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(false);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (notSelected.length > 0) {
        const target = notSelected[highlightIndex];
        if (target) add(target.id);
        return;
      }
      if (onCreateTag && query.trim()) {
        setCreating(true);
        try {
          const tag = await onCreateTag(query.trim());
          if (tag) {
            add(tag.id);
          }
        } finally {
          setCreating(false);
        }
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % Math.max(1, notSelected.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) =>
        i <= 0 ? Math.max(0, notSelected.length - 1) : i - 1,
      );
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={`w-full min-w-0 ${className ?? ""}`}>
      {label !== undefined && (
        <label
          htmlFor="tag-input-search"
          className="mb-1 block text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}

      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
            >
              {t.name.toLowerCase()}
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="rounded-full p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800"
                aria-label={`Remove tag ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative min-w-0 rounded-xl border border-border-subtle bg-surface-50">
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          <input
            id="tag-input-search"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={creating ? "Creating…" : placeholder}
            disabled={creating}
            className="w-full min-w-0 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
            aria-autocomplete="list"
            aria-expanded={open}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 text-text-secondary hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {open && (query.length > 0 || notSelected.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-10 max-h-40 overflow-y-auto rounded-b-xl border border-t-0 border-border-subtle bg-white py-1 shadow-md">
            {notSelected.length === 0 && !onCreateTag ? (
              <p className="py-3 text-center text-[12px] text-text-secondary">
                No tags found.
              </p>
            ) : notSelected.length === 0 && query.trim() && onCreateTag ? (
              <p className="py-2 px-3 text-[12px] text-text-secondary">
                Press Enter to create &quot;{query.trim()}&quot;
              </p>
            ) : (
              notSelected.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => add(t.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition ${
                    i === highlightIndex
                      ? "bg-brand-50 text-brand-800"
                      : "text-text-primary hover:bg-surface-100"
                  }`}
                >
                  {t.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
