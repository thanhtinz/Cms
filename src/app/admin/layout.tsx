import { requireAdmin } from "@/lib/auth";
import ShellFrame from "@/components/ShellFrame";

export const dynamic = "force-dynamic";

// Trang quan tri: chi con cong quyen admin — header/menu/footer dung
// chung voi trang chu (AppMenu), khong con shell rieng.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <ShellFrame>{children}</ShellFrame>;
}
