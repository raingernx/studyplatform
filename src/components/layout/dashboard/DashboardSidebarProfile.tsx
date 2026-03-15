"use client";

import { Avatar } from "@/components/ui/Avatar";

interface DashboardSidebarProfileProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  fallbackName?: string;
}

export function DashboardSidebarProfile({
  name,
  email,
  image,
  fallbackName = "Account",
}: DashboardSidebarProfileProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 border-b border-neutral-100 px-5 py-4">
      <Avatar
        src={image}
        name={name}
        email={email}
        size={36}
        className="ring-1 ring-neutral-200 shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-5 text-neutral-900">
          {name ?? fallbackName}
        </p>
        {email ? (
          <p className="truncate text-[12px] leading-5 text-neutral-400">{email}</p>
        ) : null}
      </div>
    </div>
  );
}
