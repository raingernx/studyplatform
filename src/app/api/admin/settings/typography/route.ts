import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache";
import {
  BASE_FONT_SIZE_VALUES,
  FONT_KEY_VALUES,
  HEADING_SCALE_VALUES,
  LETTER_SPACING_PRESET_VALUES,
  LINE_HEIGHT_DENSITY_VALUES,
  TYPOGRAPHY_PRESET_VALUES,
} from "@/lib/typography/typography-settings";
import {
  getTypographySettings,
  updateTypographySettings,
} from "@/services/platformTypographySettings.service";

const OptionalFontSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.enum(FONT_KEY_VALUES).nullable().optional(),
);

const OptionalBaseFontSizeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.enum(BASE_FONT_SIZE_VALUES).nullable().optional(),
);

const OptionalHeadingScaleSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.enum(HEADING_SCALE_VALUES).nullable().optional(),
);

const OptionalLineHeightDensitySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.enum(LINE_HEIGHT_DENSITY_VALUES).nullable().optional(),
);

const OptionalLetterSpacingSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.enum(LETTER_SPACING_PRESET_VALUES).nullable().optional(),
);

const UpdateTypographySettingsSchema = z.object({
  presetKey: z.enum(TYPOGRAPHY_PRESET_VALUES),
  headingLatin: OptionalFontSchema,
  headingThai: OptionalFontSchema,
  bodyLatin: OptionalFontSchema,
  bodyThai: OptionalFontSchema,
  uiLatin: OptionalFontSchema,
  uiThai: OptionalFontSchema,
  mono: OptionalFontSchema,
  baseFontSize: OptionalBaseFontSizeSchema,
  headingScale: OptionalHeadingScaleSchema,
  lineHeightDensity: OptionalLineHeightDensitySchema,
  letterSpacingPreset: OptionalLetterSpacingSchema,
  enableFontSmoothing: z.boolean(),
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
    const settings = await getTypographySettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[ADMIN_TYPOGRAPHY_SETTINGS_GET]", error);
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

  const parsed = UpdateTypographySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updateTypographySettings(parsed.data);
    revalidateTag(CACHE_TAGS.platform, "max");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_TYPOGRAPHY_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
