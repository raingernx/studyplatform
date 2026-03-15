import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  CreatorServiceError,
  updateCreatorResourceStatus,
} from "@/services/creator.service";

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
      { error: "Failed to change this resource status due to a database error. Please try again." },
      { status: 500 },
    );
  }

  console.error(label, error);
  return NextResponse.json(
    { error: "Failed to change this resource status. Check the server logs for details." },
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
    const result = await updateCreatorResourceStatus(session.user.id, id, await req.json());

    return NextResponse.json(result);
  } catch (error) {
    return handleCreatorError(error, "[CREATOR_RESOURCE_STATUS_PATCH]");
  }
}
