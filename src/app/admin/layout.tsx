import { requireAdmin } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";
import ShellFrame from "@/components/ShellFrame";

export const dynamic = "force-dynamic";

// Trang quan tri: shell rieng (header/footer/menu burger cua chinh no)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [settings, pendingOrders, openTickets] = await Promise.all([
    getSettings(),
    prisma.rentalOrder.count({ where: { status: "CHO_THANH_TOAN" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);
  const menu = [
    { href: "/admin", label: "Tổng quan", icon: "fa-gauge-high" },
    { href: "/admin/don-thue", label: "Đơn thuê", icon: "fa-receipt", badge: pendingOrders || undefined },
    { href: "/admin/website", label: "Website khách", icon: "fa-globe" },
    { href: "/admin/khach-hang", label: "Khách hàng", icon: "fa-users" },
    { href: "/admin/ho-tro", label: "Hỗ trợ khách hàng", icon: "fa-headset", badge: openTickets || undefined },
    { href: "/admin/mau", label: "Mẫu website", icon: "fa-layer-group" },
    { href: "/admin/goi-thoi-gian", label: "Gói thời gian", icon: "fa-box-open" },
    { href: "/admin/voucher", label: "Voucher giảm giá", icon: "fa-ticket" },
    { href: "/admin/tin-tuc", label: "Tin tức", icon: "fa-newspaper" },
    { href: "/admin/faq", label: "FAQ", icon: "fa-circle-question" },
    { href: "/admin/cai-dat", label: "Cài đặt", icon: "fa-gear" },
  ];
  return (
    <ShellFrame
      brand={settings.brandName}
      brandSub="Trang quản trị"
      user={{ name: admin.name, email: admin.email, role: admin.role }}
      badges={{ orders: pendingOrders || undefined, support: openTickets || undefined }}
      menu={menu}
      footerText={`${settings.brandName} — Khu vực quản trị · Chỉ dành cho quản trị viên`}
    >
      {children}
    </ShellFrame>
  );
}
