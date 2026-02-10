import { redirect } from "next/navigation";

/**
 * PATCH_77D: Server-side redirect from /deals/:id to /services/:id
 * PATCH_92b: Validate ObjectId before redirect — non-ObjectId slugs (e.g. "coming-soon")
 * must not be forwarded to /services/:id or the backend crashes with a CastError.
 */
const isObjectId = (v: string) => /^[a-f\d]{24}$/i.test(v);

export default async function DealRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isObjectId(id)) {
    redirect("/deals");
  }
  redirect(`/services/${id}`);
}
