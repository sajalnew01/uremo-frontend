import { redirect } from "next/navigation";

// Backwards-compatible alias: older builds linked to /admin/work-applications.
// The canonical route is /admin/applications.
export default function AdminWorkApplicationsAliasPage() {
  redirect("/admin/applications");
}
