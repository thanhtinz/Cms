import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, SITE_STATUS, TICKET_STATUS } from "@/lib/utils";
import { getCapacity } from "@/lib/quota";

export const dynamic = "force-dynamic";

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

// Tong quan quan tri: doanh thu, viec can xu ly, don/web/ticket moi
export default async function AdminDashboard() {
  const in30 = new Date(Date.now() + 30 * 86400000);
  const [templates, packages, orders, sites, customers, paidAgg, pendingCount, waitingDns, openTickets, expiringSites, recentTickets, capacity] = await Promise.all([
    prisma.template.count({ where: { status: "PUBLISHED" } }),
    prisma.timePackage.count({ where: { active: true } }),
    prisma.rentalOrder.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true, template: true } }),
    prisma.site.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.rentalOrder.aggregate({ where: { status: "DA_THANH_TOAN" }, _sum: { total: true }, _count: true }),
    prisma.rentalOrder.count({ where: { status: "CHO_THANH_TOAN" } }),
    prisma.site.count({ where: { status: "CHO_TRO_DNS" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.site.findMany({
      where: { status: "DANG_HOAT_DONG", expiresAt: { not: null, lte: in30 } },
      include: { user: true },
      orderBy: { expiresAt: "asc" },
      take: 8,
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "ANSWERED"] } },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    getCapacity(),
  ]);
  const diskPct = capacity.limitDiskGb > 0 ? Math.min(100, Math.round((capacity.allocatedDiskGb / capacity.limitDiskGb) * 100)) : 0;
  const bwPct = capacity.limitBandwidthGb > 0 ? Math.min(100, Math.round((capacity.allocatedBandwidthGb / capacity.limitBandwidthGb) * 100)) : 0;

  const cards = [
    { icon: "fa-sack-dollar", label: "Doanh thu đã thu", value: formatVND(paidAgg._sum.total ?? 0), sub: `${paidAgg._count} đơn đã thanh toán`, href: "/admin/don-thue" },
    { icon: "fa-hourglass-half", label: "Đơn chờ thanh toán", value: String(pendingCount), sub: "cần đối soát chuyển khoản", href: "/admin/don-thue", alert: pendingCount > 0 },
    { icon: "fa-users", label: "Khách hàng", value: String(customers), sub: "tài khoản khách đã đăng ký", href: "/admin/khach-hang" },
    { icon: "fa-globe", label: "Web chờ trỏ tên miền", value: String(waitingDns), sub: "khách chưa thêm DNS", href: "/admin/website", alert: waitingDns > 0 },
    { icon: "fa-headset", label: "Ticket hỗ trợ đang mở", value: String(openTickets), sub: "chờ đội hỗ trợ phản hồi", href: "/admin/ho-tro", alert: openTickets > 0 },
    { icon: "fa-layer-group", label: "Mẫu đang đăng / Gói đang bán", value: `${templates} / ${packages}`, sub: "cấu hình trong Mẫu & Gói thời gian", href: "/admin/mau" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">Tổng quan quản trị</h1>
      <p className="mt-1 text-slate-500">Số liệu toàn hệ thống và các việc cần xử lý hôm nay.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card group flex items-start gap-3.5 p-5 transition hover:shadow-md">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${c.alert ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600"}`}>
              <i className={`fa-solid ${c.icon} text-lg`} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xl font-black text-slate-900 group-hover:text-brand-700">{c.value}</div>
              <div className="text-sm font-medium text-slate-600">{c.label}</div>
              <div className="text-xs text-slate-400">{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900"><i className="fa-solid fa-server mr-2 text-brand-600" aria-hidden /> Dung lượng hệ thống (VPS)</h2>
          <Link href="/admin/cai-dat" className="text-sm font-semibold text-brand-700 hover:underline">Cấu hình sức chứa →</Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Đã tự động cấp cho {capacity.siteCount} website · Sức chứa khai báo {capacity.capacityDiskGb} GB đĩa / {capacity.capacityBandwidthGb.toLocaleString("vi-VN")} GB băng thông · Hệ số bán vượt ×{capacity.oversellRatio}
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm"><span className="font-medium text-slate-700">Dung lượng đĩa đã cấp</span><span>{capacity.allocatedDiskGb} / {capacity.limitDiskGb} GB ({diskPct}%)</span></div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${diskPct >= 90 ? "bg-red-500" : diskPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${diskPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Còn trống {capacity.freeDiskGb} GB cho website mới.</p>
          </div>
          <div>
            <div className="flex justify-between text-sm"><span className="font-medium text-slate-700">Băng thông đã cấp / tháng</span><span>{capacity.allocatedBandwidthGb.toLocaleString("vi-VN")} / {capacity.limitBandwidthGb.toLocaleString("vi-VN")} GB ({bwPct}%)</span></div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${bwPct >= 90 ? "bg-red-500" : bwPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${bwPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Chưa tính các gói băng thông không giới hạn hợp lý.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Website sắp hết hạn (≤ 30 ngày)</h2>
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Khách</th><th className="th">Hết hạn</th><th className="th">Còn</th></tr></thead>
              <tbody>
                {expiringSites.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="td font-medium">{s.name}<div className="text-xs font-normal text-slate-400">{s.domain}</div></td>
                    <td className="td">{s.user.name}</td>
                    <td className="td">{formatDate(s.expiresAt)}</td>
                    <td className="td"><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{daysLeft(s.expiresAt)} ngày</span></td>
                  </tr>
                ))}
                {expiringSites.length === 0 && <tr><td className="td text-slate-500" colSpan={4}>Không có website nào sắp hết hạn.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-lg font-bold text-slate-900">Ticket hỗ trợ mới nhất</h2>
          <div className="mt-3 space-y-2.5">
            {recentTickets.map((t) => {
              const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.OPEN;
              return (
                <Link key={t.id} href={`/admin/ho-tro/${t.id}`} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{t.user.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{t.subject}</span>
                    <span className="block text-xs text-slate-400">{t.user.name} · {formatDate(t.updatedAt)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </Link>
              );
            })}
            {recentTickets.length === 0 && <p className="text-sm text-slate-500">Chưa có ticket nào đang mở.</p>}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Đơn thuê mới nhất</h2>
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Khách</th><th className="th">Tổng</th><th className="th">Ngày</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="td font-medium">
                      <Link href={`/admin/don-thue/${o.id}`} className="text-brand-700 hover:underline">{o.code}</Link>
                      {o.renewalSiteId && <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">Gia hạn</span>}
                      <div className="text-xs font-normal text-slate-400">{o.template.name}</div>
                    </td>
                    <td className="td">{o.user.name}</td>
                    <td className="td">{formatVND(o.total)}</td>
                    <td className="td">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={4}>Chưa có đơn nào.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-lg font-bold text-slate-900">Website khách mới nhất</h2>
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Tên miền</th><th className="th">Trạng thái</th><th className="th">Hết hạn</th></tr></thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="td font-medium">{s.name}<div className="text-xs font-normal text-slate-400">{s.user.name}</div></td>
                    <td className="td">{s.domain}</td>
                    <td className="td"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).color}`}>{(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).label}</span></td>
                    <td className="td">{formatDate(s.expiresAt)}</td>
                  </tr>
                ))}
                {sites.length === 0 && <tr><td className="td text-slate-500" colSpan={4}>Chưa có website nào được tạo.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
