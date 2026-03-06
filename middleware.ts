import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Route protection middleware.
 *
 * Protected matchers (see `config.matcher` below):
 *   /dashboard  /dashboard/*  — requires any authenticated user
 *   /admin      /admin/*      — requires authenticated user with role === "ADMIN"
 *
 * `withAuth` reads the JWT from the session cookie at the edge (no DB round-trip).
 * The `authorized` callback returning `false` triggers a redirect to `pages.signIn`.
 * An additional check inside the middleware function handles admin-only routes.
 */
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Admin section — require ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      // Redirect non-admins to their dashboard instead of a blank 403
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Return true  → allow the request through (then the middleware fn runs).
       * Return false → redirect to `pages.signIn` automatically.
       */
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

/**
 * Only run middleware on these route prefixes.
 * Static files, API routes, and public pages are deliberately excluded.
 */
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
