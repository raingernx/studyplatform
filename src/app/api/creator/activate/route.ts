import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { CreatorServiceError, activateCreatorAccess } from "@/services/creator.service";

function formatCreatorActivationError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      payload: {
        error:
          "Creator activation is temporarily unavailable because the database connection failed.",
      },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const details = `${error.message} ${JSON.stringify(error.meta ?? {})}`.toLowerCase();

    if (
      (error.code === "P2021" || error.code === "P2022") &&
      details.includes("creatorstatus")
    ) {
      return {
        status: 500,
        payload: {
          error:
            "Creator activation failed because the database schema is out of sync. Run the latest Prisma migrations and try again.",
        },
      };
    }

    return {
      status: 500,
      payload: {
        error: "Creator activation failed due to a database error. Check the server logs and try again.",
      },
    };
  }

  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    if (/creatorstatus|\"creatorStatus\"|enum/i.test(error.message)) {
      return {
        status: 500,
        payload: {
          error:
            "Creator activation failed because the database schema is out of sync. Run the latest Prisma migrations and try again.",
        },
      };
    }
  }

  return {
    status: 500,
    payload: {
      error: "Creator activation failed. Check the server logs for details.",
    },
  };
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const access = await activateCreatorAccess(session.user.id);
    return NextResponse.json({ data: access });
  } catch (error) {
    if (error instanceof CreatorServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[CREATOR_ACTIVATE_POST]", error);
    const { status, payload } = formatCreatorActivationError(error);
    return NextResponse.json(payload, { status });
  }
}
