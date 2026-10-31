import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SupportChat from "@/components/SupportChat";

export const dynamic = "force-dynamic";

// Dashboard khach hang: HOA VAO TRANG CHU — dung chung header/menu/footer
// web chinh (chi co Quan tri /admin moi co shell rieng). Layout nay chi con
// cong dang nhap + khung noi dung + bong bong tro ly ho tro.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?tieptuc=/portal");
  return (
    <div className="bg-slate-100/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      <SupportChat />
    </div>
  );
}
