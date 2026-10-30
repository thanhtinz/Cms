import { redirect } from "next/navigation";

// Trang thue rieng da bo — thue ngay trong trang chi tiet mau (/mau/[slug]#thue-ngay).
// Route nay chi con de chuyen huong cac link cu.
export default function RentPageRedirect({ searchParams }: { searchParams: { mau?: string; goi?: string } }) {
  if (searchParams.mau) {
    const goi = searchParams.goi ? `?goi=${encodeURIComponent(searchParams.goi)}` : "";
    redirect(`/mau/${searchParams.mau}${goi}#thue-ngay`);
  }
  redirect("/mau");
}
