import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, SITE_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [templates, plans, orders, sites, customers, paidOrders] = await Promise.all([
    prisma.template.count(),
    prisma.plan.count({ where: { active: true } }),
    prisma.rentalOrder.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true, template: true } }),
    prisma.site.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.rentalOrder.findMany({ where: { status: "DA_THANH_TOAN" }, select: { total: true } }),
  ]);
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "CHO_THANH_TOAN").length;
  const waitingDns = sites.filter((s) => s.status === "CHO_TRO_DNS").length;

  const cards = [
    { label: "Doanh thu đã thu", value: formatVND(revenue) },
    { label: "Mẫu đang đăng", value: String(templates) },
    { label: "Gói đang bán", value: String(plans) },
    { label: "Khách hàng", value: String(customers) },
    { label: "Đơn chờ thanh toán", value: String(pending) },
    { label: "Web chờ trỏ tên miền", value: String(waitingDns) },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="mt-1 text-2xl font-black">{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold">Đơn thuê mới nhất</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Khách</th><th className="th">Mẫu</th><th className="th">Tổng</th><th className="th">Ngày</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium"><Link href={`/admin/don-thue/${o.id}`} className="text-brand-700 hover:underline">{o.code}</Link></td>
                <td className="td">{o.user.name}</td><td className="td">{o.template.name}</td>
                <td className="td">{formatVND(o.total)}</td><td className="td">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Chưa có đơn nào.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">Website khách mới nhất</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Khách</th><th className="th">Tên miền</th><th className="th">Trạng thái</th><th className="th">Hết hạn</th></tr></thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="td font-medium">{s.name}</td><td className="td">{s.user.name}</td><td className="td">{s.domain}</td>
                <td className="td"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).color}`}>{(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).label}</span></td>
                <td className="td">{formatDate(s.expiresAt)}</td>
              </tr>
            ))}
            {sites.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Chưa có website nào được tạo.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
