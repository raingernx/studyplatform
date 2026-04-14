import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  RANKING_EXPERIMENT_COOKIE,
  RANKING_EXPERIMENT_DURATION_DAYS,
  isValidRankingVariant,
  type RankingVariant,
} from "@/lib/ranking-experiment";
import { locales } from "@/i18n/config";

const LOGIN_PATH = "/auth/login";
const DASHBOARD_V2_PATH = "/dashboard-v2";

function assignRankingVariantIfAbsent(
  req: NextRequest,
  response: NextResponse,
): void {
  const current = req.cookies.get(RANKING_EXPERIMENT_COOKIE)?.value;
  if (isValidRankingVariant(current)) return;

  const assigned: RankingVariant = Math.random() < 0.5 ? "A" : "B";
  response.cookies.set(RANKING_EXPERIMENT_COOKIE, assigned, {
    maxAge: RANKING_EXPERIMENT_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

function buildProtectedRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

async function handleProtectedRoute(req: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (!token) {
    return buildProtectedRedirect(req);
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = DASHBOARD_V2_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const localePrefix = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (localePrefix) {
    const url = req.nextUrl.clone();
    url.pathname =
      pathname === `/${localePrefix}`
        ? "/"
        : pathname.slice(localePrefix.length + 1);
    const response = NextResponse.redirect(url, { status: 301 });
    assignRankingVariantIfAbsent(req, response);
    return response;
  }

  if (
    pathname.startsWith(DASHBOARD_V2_PATH) ||
    pathname.startsWith("/admin")
  ) {
    const response = await handleProtectedRoute(req);
    assignRankingVariantIfAbsent(req, response);
    return response;
  }

  const response = NextResponse.next();
  assignRankingVariantIfAbsent(req, response);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|brand-assets|.*\\..*).*)"],
};

export default proxy;
