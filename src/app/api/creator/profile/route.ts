import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache";
import {
  CreatorServiceError,
  getCreatorProfile,
  updateCreatorProfile,
} from "@/services/creator.service";

function handleCreatorError(error: unknown, label: string) {
  if (error instanceof CreatorServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(label, error);
    return NextResponse.json(
      { error: "Creator profile is temporarily unavailable because the database is not reachable." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    console.error(label, error);
    return NextResponse.json(
      { error: "Failed to save creator profile due to a database error. Please try again." },
      { status: 500 },
    );
  }

  console.error(label, error);
  return NextResponse.json(
    { error: "Failed to save creator profile. Check the server logs for details." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const profile = await getCreatorProfile(session.user.id);
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleCreatorError(error, "[CREATOR_PROFILE_GET]");
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const updated = await updateCreatorProfile(session.user.id, await req.json());
    revalidateTag(CACHE_TAGS.creatorPublic, "max");
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleCreatorError(error, "[CREATOR_PROFILE_PATCH]");
  }
}
