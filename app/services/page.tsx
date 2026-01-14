import { redirect } from "next/navigation";

export default function ServicesIndexPage() {
  // This app uses /buy-service as the services list page.
  redirect("/buy-service");
}
