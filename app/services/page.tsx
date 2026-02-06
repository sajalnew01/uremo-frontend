import { redirect } from "next/navigation";

/**
 * DEPRECATED COMPATIBILITY ROUTE (Phase 4)
 *
 * Kept for backwards-compatible links/bookmarks.
 * Canonical destination: `/explore-services`.
 *
 * Do not create new links to `/services`.
 */

export default function ServicesIndexPage() {
  // PATCH_38: Redirect /services to /explore-services
  redirect("/explore-services");
}
