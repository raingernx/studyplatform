import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache";
import { CreatorServiceError, updateCreatorResource } from "@/services/creator.service";

type Params = {
  params: Promise<{ id: string }>;
};

function handleCreatorError(error: unknown, label: string) {
  if (error instanceof CreatorServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(label, error);
    return NextResponse.json(
      { error: "Creator resource actions are temporarily unavailable because the database is not reachable." },
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
      { error: "Failed to update this resource due to a database error. Please try again." },
      { status: 500 },
    );
  }

  console.error(label, error);
  return NextResponse.json(
    { error: "Failed to update this resource. Check the server logs for details." },
    { status: 500 },
  );
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const resource = await updateCreatorResource(session.user.id, id, await req.json());
    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(CACHE_TAGS.creatorPublic, "max");

    return NextResponse.json({ data: resource });
  } catch (error) {
    return handleCreatorError(error, "[CREATOR_RESOURCE_PATCH]");
  }
}
