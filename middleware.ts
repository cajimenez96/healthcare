import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

import { getRequiredRoleForPath } from "./lib/auth/getRequiredRoleForPath";

// /patients/[userId]/** is per-resource, not per-role: it's only ever
// authorized for the exact Paciente whose own userId matches the URL, never
// "any Paciente" — so it can't use getRequiredRoleForPath's simple
// prefix-to-role table like /admin, /doctor, /recepcion do. Handled here
// instead, with its own login page (/patients/login), which is itself
// excluded from the check below (it's the one public page in this prefix).
function patientsRedirect(req: NextRequestWithAuth) {
  const { pathname } = req.nextUrl;
  const userId = pathname.split("/")[2];
  const token = req.nextauth.token;

  if (!token || token.role !== "Paciente" || token.sub !== userId) {
    const url = new URL("/patients/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/patients/") && pathname !== "/patients/login") {
      return patientsRedirect(req);
    }

    const requiredRole = getRequiredRoleForPath(pathname);
    const role = req.nextauth.token?.role;

    if (requiredRole && role !== requiredRole) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        // /patients/** manages its own auth/redirect above (different login
        // page, per-resource check) — never let withAuth's single
        // `pages.signIn` short-circuit it.
        if (req.nextUrl.pathname.startsWith("/patients/")) {
          return true;
        }
        return Boolean(token);
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/recepcion/:path*", "/patients/:path*"],
};
