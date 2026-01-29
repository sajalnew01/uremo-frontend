import { redirect } from "next/navigation";

export default function ServicesIndexPage() {
  // PATCH_38: Redirect /services to /explore-services
  redirect("/explore-services");
}
