import { redirect } from "next/navigation";

export default function ServicesIndexPage() {
  // PATCH_37: Redirect /services to /avail-service
  redirect("/avail-service");
}
