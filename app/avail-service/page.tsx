import { redirect } from "next/navigation";

/**
 * DEPRECATED COMPATIBILITY ROUTE (Phase 4)
 *
 * Kept for backwards-compatible links/bookmarks.
 * Canonical destination: `/explore-services`.
 *
 * Do not create new links to `/avail-service`.
 */

export default function AvailServiceRedirect() {
  // PATCH_38: Redirect old /avail-service to /explore-services
  redirect("/explore-services");
}
