import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import {
  createAdminResourcesInBulk,
  mutateAdminResourcesInBulk,
  ResourceServiceError,
} from "@/services/resources/resource.service";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session, error: undefined as NextResponse | undefined };
}

function handleServiceError(err: unknown, label: string) {
  if (err instanceof ResourceServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error(label, err);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await createAdminResourcesInBulk(await req.json(), session.user.id);

    if (result.data.success > 0) {
      revalidateTag("discover", "max");
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_BULK_POST]");
  }
}

export async function PATCH(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const result = await mutateAdminResourcesInBulk(await req.json());

    if (result.data.updated > 0 || result.data.deleted > 0) {
      revalidateTag("discover", "max");
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_BULK_PATCH]");
  }
}
