import { redirect } from "next/navigation";

/**
 * PATCH_77D: Server-side redirect from /rentals/:id to /services/:id
 * PATCH_92b: Validate ObjectId before redirect — non-ObjectId slugs must not crash backend.
 */
const isObjectId = (v: string) => /^[a-f\d]{24}$/i.test(v);

export default async function RentalRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isObjectId(id)) {
    redirect("/explore-services?intent=rent");
  }
  redirect(`/services/${id}`);
}
