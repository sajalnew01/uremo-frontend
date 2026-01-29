import { redirect } from "next/navigation";

export default function AvailServiceRedirect() {
  // PATCH_38: Redirect old /avail-service to /explore-services
  redirect("/explore-services");
}
