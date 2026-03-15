import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { routing } from "./src/i18n/routing";
import { locales, defaultLocale } from "./src/i18n/config";

// next-intl locale middleware
const intlMiddleware = createMiddleware(routing);

// Auth protection middleware (preserves existing NextAuth logic)
const authMiddleware = withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Admin section — require ADMIN role (matches locale-prefixed paths)
    const isAdminPath = locales.some((locale) =>
      pathname.startsWith(`/${locale}/admin`)
    );

    if (isAdminPath && token?.role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = `/${defaultLocale}/dashboard`;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      // next-intl will redirect this to /{defaultLocale}/auth/login automatically
      signIn: "/auth/login",
    },
  }
);

export default function middleware(req: NextRequestWithAuth) {
  const { pathname } = req.nextUrl;

  // ── Backwards-compat redirects for legacy non-localized paths ──────────────
  // These paths no longer have route files; redirect explicitly to the
  // canonical locale-prefixed equivalents so bookmarks and existing links work.
  const LEGACY_PREFIXES = ["/dashboard", "/admin", "/auth"];
  const isLegacyPath = LEGACY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isLegacyPath) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── Let next-intl handle locale detection & redirects ──────────────────────
  const intlResponse = intlMiddleware(req as unknown as NextRequest);

  const hasRedirect =
    intlResponse.headers.get("Location") !== null ||
    intlResponse.headers.get("x-middleware-rewrite") !== null;

  if (hasRedirect) {
    return intlResponse;
  }

  // ── Apply auth guard on locale-prefixed protected routes ───────────────────
  const isProtected = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/dashboard`) ||
      pathname.startsWith(`/${locale}/admin`)
  );

  if (isProtected) {
    return (authMiddleware as any)(req);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
