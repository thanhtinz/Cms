import Link from "next/link";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatVND, formatDate, ORDER_STATUS, SITE_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requireUser();
  const [orders, sites, settings] = await Promise.all([
    prisma.rentalOrder.findMany({ where: { userId: user.id }, include: { template: true }, orderBy: { createdAt: "desc" } }),
    prisma.site.findMany({ where: { userId: user.id }, include: { template: true, plan: true }, orderBy: { createdAt: "desc" } }),
    getSettings(),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Web của tôi</h1>
          <p className="text-slate-500">Xin chào {user.name} — quản lý các website và đơn thuê của bạn tại đây.</p>
        </div>
        <Link href="/thue" className="btn-primary">Thuê thêm website</Link>
      </div>

      <h2 className="mt-10 text-xl font-bold">Website đã tạo</h2>
      {sites.length === 0 && <p className="mt-3 text-slate-500">Chưa có website nào. Website xuất hiện tại đây ngay khi đơn thuê được xác nhận thanh toán.</p>}
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        {sites.map((s) => {
          const st = SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN;
          return (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-lg">{s.name}</div>
                  <div className="text-sm text-slate-500">Mẫu: {s.template.name} · Gói: {s.plan.name}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Tên miền tạm</dt><dd className="font-medium">{s.slug}.{settings.platformDomain}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Tên miền chính</dt><dd className="font-medium">{s.domain}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Ngày hết hạn</dt><dd className="font-medium">{s.expiresAt ? formatDate(s.expiresAt) : "Chưa kích hoạt"}</dd></div>
              </dl>
              <Link href={`/portal/web/${s.id}`} className="btn-ghost mt-4 w-full">
                {s.status === "CHO_TRO_DNS" ? "Xem hướng dẫn kết nối tên miền" : "Quản lý website"}
              </Link>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-bold">Đơn thuê của tôi</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-slate-50">
            <tr><th className="th">Mã đơn</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Tổng tiền</th><th className="th">Trạng thái</th><th className="th"></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium">{o.code}</td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{o.domain}</td>
                <td className="td">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}</td>
                <td className="td">{o.status === "CHO_THANH_TOAN" && <Link href={`/thue/hoan-tat/${o.code}`} className="font-semibold text-brand-700 hover:underline">Thanh toán</Link>}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={6}>Chưa có đơn thuê nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
