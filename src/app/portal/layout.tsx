import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ShellFrame from "@/components/ShellFrame";

export const dynamic = "force-dynamic";

// Dashboard khach hang: chi con cong dang nhap — header/menu/footer dung
// chung voi trang chu (AppMenu), khong con shell rieng.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?tieptuc=/portal");
  return <ShellFrame>{children}</ShellFrame>;
}
