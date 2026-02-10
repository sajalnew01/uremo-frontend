import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PATCH_77: Middleware redirects for legacy /deals/:id and /rentals/:id routes.
 * Redirects to the unified /services/:id page with a 308 permanent redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /deals/:id → /services/:id
  if (pathname.startsWith("/deals/")) {
    const id = pathname.replace("/deals/", "");
    if (id) {
      const url = request.nextUrl.clone();
      url.pathname = `/services/${id}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Redirect /rentals/:id → /services/:id
  if (pathname.startsWith("/rentals/")) {
    const id = pathname.replace("/rentals/", "");
    if (id) {
      const url = request.nextUrl.clone();
      url.pathname = `/services/${id}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/deals/:path*", "/rentals/:path*"],
};
