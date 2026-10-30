import { redirect } from "next/navigation";

// Duong dan cu /portal/web/[id] — chuyen sang /portal/website/[id]
export default function OldSiteRedirect({ params }: { params: { id: string } }) {
  redirect(`/portal/website/${params.id}`);
}
