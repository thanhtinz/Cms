import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";
import ShellFrame from "@/components/ShellFrame";

export const dynamic = "force-dynamic";

// Dashboard khach hang: shell rieng (header/footer/menu burger cua chinh no)
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?tieptuc=/portal");
  const [settings, openTickets] = await Promise.all([
    getSettings(),
    prisma.supportTicket.count({ where: { userId: user.id, status: "ANSWERED" } }),
  ]);
  const menu = [
    { href: "/portal", label: "Tổng quan", icon: "fa-gauge-high" },
    { href: "/portal/website", label: "Website của tôi", icon: "fa-globe" },
    { href: "/portal/don-thue", label: "Đơn thuê & gia hạn", icon: "fa-receipt" },
    { href: "/portal/ho-tro", label: "Hỗ trợ", icon: "fa-headset", badge: openTickets || undefined },
    { href: "/portal/ho-so", label: "Hồ sơ & bảo mật", icon: "fa-user-gear" },
  ];
  return (
    <ShellFrame
      brand={settings.brandName}
      brandSub="Dashboard khách hàng"
      user={{ name: user.name, email: user.email, role: user.role }}
      badges={{ support: openTickets || undefined }}
      menu={menu}
      footerText={`${settings.brandName} — Dashboard khách hàng · Hỗ trợ: ${settings.supportEmail}${settings.supportPhone ? ` · ${settings.supportPhone}` : ""}`}
      sideExtra={
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <div className="font-bold">Thuê thêm website?</div>
          <p className="mt-1 text-xs leading-relaxed text-brand-100">Hơn chục mẫu đang mở thuê — có web mới chỉ trong vài phút.</p>
          <a href="/mau" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-700">
            <i className="fa-solid fa-plus" aria-hidden /> Xem kho mẫu
          </a>
        </div>
      }
    >
      {children}
    </ShellFrame>
  );
}
