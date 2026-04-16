"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/design-system";

export function CreatorPublicOwnerActions({
  creatorUserId,
  editHref,
}: {
  creatorUserId: string;
  editHref: string;
}) {
  const { data: session, status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  const sessionUser = session.user as
    | {
        id?: string | null;
        role?: string | null;
      }
    | undefined;
  const canEdit =
    sessionUser?.id === creatorUserId || sessionUser?.role === "ADMIN";

  if (!canEdit) {
    return null;
  }

  return (
    <Button asChild size="sm" variant="secondary">
      <Link href={editHref}>Edit profile</Link>
    </Button>
  );
}
