import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache";
import {
  getPlatform,
  resolvePlatformConfig,
  updatePlatformConfig,
} from "@/services/platform.service";

const OptionalStringSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().nullable().optional(),
);

const OptionalEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().email("Support email must be valid").nullable().optional(),
);

const UpdatePlatformSettingsSchema = z.object({
  name: z.string().trim().min(1, "Platform name is required"),
  description: OptionalStringSchema,
  shortName: OptionalStringSchema,
  siteUrl: OptionalStringSchema,
  defaultMetaTitle: OptionalStringSchema,
  defaultMetaDescription: OptionalStringSchema,
  ogSiteName: OptionalStringSchema,
  logoUrl: OptionalStringSchema,
  logoFullUrl: OptionalStringSchema,
  logoIconUrl: OptionalStringSchema,
  logoOgUrl: OptionalStringSchema,
  logoEmailUrl: OptionalStringSchema,
  faviconUrl: OptionalStringSchema,
  supportEmail: OptionalEmailSchema,
  emailSenderName: OptionalStringSchema,
  defaultLanguage: OptionalStringSchema,
  defaultCurrency: OptionalStringSchema,
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const platform = await getPlatform();
    return NextResponse.json(platform);
  } catch (error) {
    console.error("[ADMIN_PLATFORM_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = UpdatePlatformSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updatePlatformConfig(parsed.data);
    revalidateTag(CACHE_TAGS.platform, "max");
    return NextResponse.json(resolvePlatformConfig(updated));
  } catch (error) {
    console.error("[ADMIN_PLATFORM_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
