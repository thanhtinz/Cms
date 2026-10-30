import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const menu = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/mau", label: "Mẫu website" },
  { href: "/admin/goi", label: "Gói thuê" },
  { href: "/admin/thoi-han", label: "Thời hạn & chiết khấu" },
  { href: "/admin/don-thue", label: "Đơn thuê" },
  { href: "/admin/website", label: "Website khách" },
  { href: "/admin/khach-hang", label: "Khách hàng" },
  { href: "/admin/voucher", label: "Voucher giảm giá" },
  { href: "/admin/tin-tuc", label: "Tin tức" },
  { href: "/admin/faq", label: "Hỏi đáp (FAQ)" },
  { href: "/admin/cai-dat", label: "Cài đặt hệ thống" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="card sticky top-24 p-4">
          <div className="px-2 pb-2">
            <div className="font-bold">Quản trị nền tảng</div>
            <div className="text-xs text-slate-500">{admin.name} · {admin.email}</div>
          </div>
          <nav className="space-y-1">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-800">
                {m.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="mt-3 block rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-600">← Về trang chủ</Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium">{m.label}</Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
