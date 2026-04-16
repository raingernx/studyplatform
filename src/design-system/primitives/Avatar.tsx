"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  email?: string | null;
  initials?: string;
  size?: number;
  className?: string;
};

function getAvatarInitials({
  name,
  email,
  initials,
}: {
  name?: string | null;
  email?: string | null;
  initials?: string;
}) {
  if (initials?.trim()) {
    return initials.trim().slice(0, 2).toUpperCase();
  }

  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  const emailPrefix = email?.trim().split("@")[0];
  if (emailPrefix) {
    return emailPrefix.slice(0, 2).toUpperCase();
  }

  return "U";
}

function canUseNextImage(src: string) {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "lh3.googleusercontent.com";
  } catch {
    return false;
  }
}

export function Avatar({
  src,
  alt,
  name,
  email,
  initials,
  size = 32,
  className,
}: AvatarProps) {
  const dimension = { width: size, height: size };
  const normalizedSrc = src?.trim() || null;
  const [broken, setBroken] = React.useState(false);
  const resolvedInitials = React.useMemo(
    () => getAvatarInitials({ name, email, initials }),
    [email, initials, name],
  );
  const imageAlt = alt ?? name ?? email ?? resolvedInitials;

  React.useEffect(() => {
    setBroken(false);
  }, [normalizedSrc]);

  if (normalizedSrc && !broken) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-1 ring-surface-200 bg-surface-100",
          className,
        )}
        style={dimension}
      >
        {canUseNextImage(normalizedSrc) ? (
          <Image
            src={normalizedSrc}
            alt={imageAlt}
            fill
            sizes={`${size}px`}
            className="object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <img
            src={normalizedSrc}
            alt={imageAlt}
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold",
        className,
      )}
      style={dimension}
    >
      {resolvedInitials}
    </span>
  );
}
