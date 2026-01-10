import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const role = req.cookies.get("role")?.value;

  // Server-side guard for /admin routes: rely on a lightweight role cookie.
  // - Missing cookie => user isn't logged in (or cookie not set yet): send to login
  // - role !== admin => logged-in but not admin: send to dashboard
  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
