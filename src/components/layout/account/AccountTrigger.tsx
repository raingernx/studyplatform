"use client";

import { ChevronDown } from "lucide-react";
import { Avatar } from "@/design-system";
import { cn } from "@/lib/utils";

interface AccountTriggerProps {
  name?: string | null;
  image?: string | null;
  email?: string | null;
  avatarSize?: number;
  className?: string;
  isOpen?: boolean;
  showChevron?: boolean;
}

export function AccountTrigger({
  name,
  image,
  email,
  avatarSize = 28,
  className,
  isOpen = false,
  showChevron = true,
}: AccountTriggerProps) {
  return (
    <span
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150",
        "bg-transparent group-hover:bg-accent group-hover:text-foreground",
        isOpen && "bg-accent text-foreground",
        className
      )}
    >
      <Avatar
        src={image}
        name={name}
        email={email}
        size={avatarSize}
        className="ring-1 ring-border"
      />
      {showChevron ? (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
