"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

interface Command {
  id: string;
  label: string;
  href?: string;
  hint?: string;
}

const BASE_COMMANDS: Command[] = [
  { id: "search-resources", label: "Search resources",  href: routes.marketplace },
  { id: "search-users",     label: "Search users",      href: routes.adminUsers },
  { id: "go-orders",        label: "Go to orders",      href: routes.adminOrders },
  { id: "open-analytics",   label: "Open analytics",    href: routes.adminAnalytics },
  { id: "open-settings",    label: "Open settings",     href: routes.adminSettings },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }

      const key =
        typeof event.key === "string" ? event.key.toLowerCase() : "";

      if (!key) {
        return;
      }

      // ⌘+K or Ctrl+K
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (key === "escape") {
        if (open) {
          event.preventDefault();
          close();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const commands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BASE_COMMANDS;
    return BASE_COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-[600px] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commands..."
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="divide-y">
          {commands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted"
              onClick={() => {
                close();
                if (cmd.href) router.push(cmd.href);
              }}
            >
              <span>{cmd.label}</span>
              {cmd.hint && (
                <span className="text-xs text-muted-foreground">
                  {cmd.hint}
                </span>
              )}
            </button>
          ))}
          {commands.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
