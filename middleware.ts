import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getRequiredRoleForPath } from "./lib/auth/getRequiredRoleForPath";

export default withAuth(
  function middleware(req) {
    const requiredRole = getRequiredRoleForPath(req.nextUrl.pathname);
    const role = req.nextauth.token?.role;

    if (requiredRole && role !== requiredRole) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/recepcion/:path*"],
};
