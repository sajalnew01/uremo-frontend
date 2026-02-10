import { redirect } from "next/navigation";

/**
 * PATCH_77D: Server-side redirect from /rentals/:id to /services/:id
 * This page catches the route and permanently redirects to the unified service page.
 */
export default async function RentalRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/services/${id}`);
}
