"use client";

import { useState, useRef, useEffect } from "react";

export interface UserOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface UserSearchSelectProps {
  value: string;
  onChange: (userId: string) => void;
  currentUserId?: string;
  currentUserName?: string | null;
  /** When value is set (e.g. edit mode), display this until user selects someone else. */
  initialAuthorName?: string | null;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function UserSearchSelect({
  value,
  onChange,
  currentUserId,
  currentUserName,
  initialAuthorName,
  id = "authorId",
  placeholder = "Search by name or email…",
  className,
}: UserSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel =
    value === "" || !value
      ? "Current user"
      : selectedUser?.name ?? initialAuthorName ?? "User";

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setUsers(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectUser(user: UserOption) {
    setSelectedUser(user);
    onChange(user.id);
    setQuery("");
    setOpen(false);
  }

  function handleSelectCurrentUser() {
    setSelectedUser(null);
    onChange("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative min-w-0 max-w-md ${className ?? ""}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-left text-[13px] text-text-primary shadow-sm transition hover:border-zinc-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="ml-2 shrink-0 text-text-muted">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border-subtle bg-white py-1 shadow-lg">
          <div className="border-b border-border-subtle px-2 pb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </div>

          {currentUserId && (
            <button
              type="button"
              onClick={handleSelectCurrentUser}
              className={`flex w-full flex-col items-start px-3 py-2 text-left text-[13px] transition ${
                value === "" ? "bg-brand-50 text-brand-800" : "text-text-primary hover:bg-surface-100"
              }`}
            >
              <span className="font-medium">Current user</span>
              {currentUserName && (
                <span className="text-[11px] text-text-secondary">{currentUserName}</span>
              )}
            </button>
          )}

          {loading && (
            <div className="px-3 py-2 text-[12px] text-text-secondary">Searching…</div>
          )}
          {!loading && users.length > 0 && (
            <ul role="listbox" className="py-1">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => handleSelectUser(user)}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-[13px] transition ${
                      value === user.id ? "bg-brand-50 text-brand-800" : "hover:bg-surface-100"
                    }`}
                  >
                    <span className="font-medium">{user.name || "No name"}</span>
                    {user.email && (
                      <span className="text-[11px] text-text-secondary">{user.email}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && query.trim() && users.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-text-secondary">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
