"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, alt, initials = "U", size = 32, className }: AvatarProps) {
  const dimension = { width: size, height: size };

  if (src) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-full ring-1 ring-surface-200 bg-surface-100",
          className
        )}
        style={dimension}
      >
        <Image
          src={src}
          alt={alt ?? initials}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold",
        className
      )}
      style={dimension}
    >
      {initials.charAt(0).toUpperCase()}
    </span>
  );
}

