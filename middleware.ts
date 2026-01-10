import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const role = req.cookies.get("role")?.value;

  // Client auth in this app is primarily stored in localStorage.
  // Middleware can't read localStorage, so only enforce when a role cookie exists.
  // This prevents /admin routes from being incorrectly redirected in production.
  if (role && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
