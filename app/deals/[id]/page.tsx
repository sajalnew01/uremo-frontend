import { redirect } from "next/navigation";

/**
 * PATCH_77D: Server-side redirect from /deals/:id
 * PATCH_93: Deals are disabled — ALL deal routes redirect to /deals (coming-soon banner).
 * No service redirects, no API calls, no CastError crashes.
 */
export default async function DealRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Deals are disabled. Always go to /deals coming-soon page.
  redirect("/deals");
}
