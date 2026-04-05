"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/design-system";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type SearchType = "resource" | "user" | "order";

interface SearchItem {
  id: string;
  label: string;
  type: SearchType;
}

interface SearchGroup {
  label: "Resources" | "Users" | "Orders";
  type: SearchType;
  items: SearchItem[];
}

const MOCK_RESOURCES: SearchItem[] = [
  { id: "res_1", label: "Algebra Worksheet", type: "resource" },
  { id: "res_2", label: "Geometry Pack", type: "resource" },
  { id: "res_3", label: "AP Physics Study Pack", type: "resource" },
  { id: "res_4", label: "Chemistry Lab Templates", type: "resource" },
  { id: "res_5", label: "Biology Flashcards", type: "resource" },
];

const MOCK_USERS: SearchItem[] = [
  { id: "usr_sandstorm", label: "sandstorm", type: "user" },
  { id: "usr_admin", label: "admin", type: "user" },
  { id: "usr_student", label: "student01", type: "user" },
  { id: "usr_creator", label: "creator_pro", type: "user" },
];

const MOCK_ORDERS: SearchItem[] = [
  { id: "ord_1234", label: "Order #1234", type: "order" },
  { id: "ord_5678", label: "Order #5678", type: "order" },
  { id: "ord_9012", label: "Order #9012", type: "order" },
];

const MAX_PER_GROUP = 5;
const DEBOUNCE_MS = 280;

export function AdminGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groups: SearchGroup[] = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();

    const filterItems = (items: SearchItem[]): SearchItem[] =>
      items.filter((item) => item.label.toLowerCase().includes(q)).slice(0, MAX_PER_GROUP);

    const resourceItems = filterItems(MOCK_RESOURCES);
    const userItems = filterItems(MOCK_USERS);
    const orderItems = filterItems(MOCK_ORDERS);

    const result: SearchGroup[] = [];
    if (resourceItems.length) {
      result.push({ label: "Resources", type: "resource", items: resourceItems });
    }
    if (userItems.length) {
      result.push({ label: "Users", type: "user", items: userItems });
    }
    if (orderItems.length) {
      result.push({ label: "Orders", type: "order", items: orderItems });
    }

    return result;
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery && groups.length > 0) {
      setIsOpen(true);
    } else if (!debouncedQuery) {
      setIsOpen(false);
    }
  }, [debouncedQuery, groups.length]);

  function handleSelect(item: SearchItem) {
    switch (item.type) {
      case "resource":
        router.push(routes.adminResource(encodeURIComponent(item.id)));
        break;
      case "user":
        router.push(routes.adminUsersSearch(item.label));
        break;
      case "order":
        router.push(routes.adminOrdersOrder(item.id));
        break;
      default:
        break;
    }
    setIsOpen(false);
    setDebouncedQuery("");
    setQuery("");
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden w-72 md:block"
    >
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search resources, users, orders..."
        leftAdornment={<Search className="h-4 w-4" />}
        className="rounded-full bg-muted"
      />

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-2 z-50",
            "rounded-2xl border border-border bg-card shadow-card-lg",
          )}
        >
          {groups.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matches found.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {groups.map((group) => (
                <div key={group.label} className="pb-1">
                  <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-tightest text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
