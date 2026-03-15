"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export function Tabs({ items, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.id);
  const active = value ?? internal;

  function handleSelect(id: string) {
    if (!value) {
      setInternal(id);
    }
    onChange?.(id);
  }

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-surface-100 p-1", className)}>
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              isActive
                ? "bg-surface-0 text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

