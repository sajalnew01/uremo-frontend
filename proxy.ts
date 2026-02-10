import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // PATCH_77: Redirect legacy /deals/:id → /services/:id
  if (pathname.startsWith("/deals/")) {
    const id = pathname.replace("/deals/", "");
    if (id) {
      const url = req.nextUrl.clone();
      url.pathname = `/services/${id}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // PATCH_77: Redirect legacy /rentals/:id → /services/:id
  if (pathname.startsWith("/rentals/")) {
    const id = pathname.replace("/rentals/", "");
    if (id) {
      const url = req.nextUrl.clone();
      url.pathname = `/services/${id}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Server-side guard for /admin routes: rely on a lightweight role cookie.
  // IMPORTANT: LocalStorage isn't accessible here, so if the cookie is missing
  // (fresh login, cleared cookies, or stale browser state), we allow the
  // request through and let the client-side guard decide.
  const role = req.cookies.get("role")?.value;
  if (role && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/deals/:path*", "/rentals/:path*", "/admin/:path*"],
};
