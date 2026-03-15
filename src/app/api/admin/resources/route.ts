import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import {
  createAdminResource,
  listAdminResources,
  ResourceServiceError,
} from "@/services/resources/resource.service";

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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await createAdminResource(await req.json(), session.user.id);
    revalidateTag("discover", "max");

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_POST]");
  }
}

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const resources = await listAdminResources();

    return NextResponse.json({ data: resources });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_GET]");
  }
}
