import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, SITE_STATUS, TICKET_STATUS } from "@/lib/utils";
import { getCapacity } from "@/lib/quota";

export const dynamic = "force-dynamic";

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function pctChange(cur: number, prev: number): { text: string; up: boolean } | null {
  if (prev <= 0) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { text: `${p >= 0 ? "+" : ""}${p}%`, up: p >= 0 };
}

// Mau cho bieu do tron trang thai website
const SITE_CHART_COLORS: Record<string, string> = {
  DANG_HOAT_DONG: "#10b981",
  CHO_TRO_DNS: "#f59e0b",
  TAM_NGUNG: "#fb923c",
  HET_HAN: "#ef4444",
};

// Tong quan quan tri: doanh thu, viec can xu ly, don/web/ticket moi
export default async function AdminDashboard() {
  const in30 = new Date(Date.now() + 30 * 86400000);
  const today0 = startOfDay(new Date());
  const start14 = new Date(today0.getTime() - 13 * 86400000);
  const start28 = new Date(today0.getTime() - 27 * 86400000);
  const start30 = new Date(today0.getTime() - 29 * 86400000);
  const start60 = new Date(today0.getTime() - 59 * 86400000);
  const [templates, packages, orders, sites, customers, paidAgg, pendingCount, waitingDns, openTickets, expiringSites, recentTickets, capacity, paidRecent, orders30, ordersPrev30, users30, usersPrev30, siteStatusGroups, packageGroups] = await Promise.all([
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
    prisma.rentalOrder.findMany({
      where: { status: "DA_THANH_TOAN", OR: [{ paidAt: { gte: start60 } }, { paidAt: null, createdAt: { gte: start60 } }] },
      select: { total: true, paidAt: true, createdAt: true },
    }),
    prisma.rentalOrder.count({ where: { createdAt: { gte: start30 } } }),
    prisma.rentalOrder.count({ where: { createdAt: { gte: start60, lt: start30 } } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start30 } } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start60, lt: start30 } } }),
    prisma.site.groupBy({ by: ["status"], _count: true }),
    prisma.rentalOrder.groupBy({
      by: ["planName"],
      where: { status: "DA_THANH_TOAN" },
      _count: true,
      _sum: { total: true },
      orderBy: { _count: { planName: "desc" } },
      take: 5,
    }),
  ]);

  // --- Thong ke: doanh thu 14 ngay + so sanh ky truoc ---
  const revByDay = new Map<string, number>();
  let rev14 = 0, revPrev14 = 0, rev30 = 0, revPrev30 = 0;
  for (const o of paidRecent) {
    const when = startOfDay(o.paidAt ?? o.createdAt);
    const t = when.getTime();
    revByDay.set(dayKey(when), (revByDay.get(dayKey(when)) ?? 0) + o.total);
    if (t >= start14.getTime()) rev14 += o.total;
    else if (t >= start28.getTime()) revPrev14 += o.total;
    if (t >= start30.getTime()) rev30 += o.total;
    else revPrev30 += o.total;
  }
  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start14.getTime() + i * 86400000);
    return { date: d, value: revByDay.get(dayKey(d)) ?? 0 };
  });
  const chartMax = Math.max(1, ...chartDays.map((d) => d.value));
  const revDelta = pctChange(rev14, revPrev14);
  const stat30 = [
    { icon: "fa-sack-dollar", label: "Doanh thu 30 ngày", value: formatVND(rev30), delta: pctChange(rev30, revPrev30), note: "so với 30 ngày trước" },
    { icon: "fa-receipt", label: "Đơn thuê 30 ngày", value: String(orders30), delta: pctChange(orders30, ordersPrev30), note: "so với 30 ngày trước" },
    { icon: "fa-user-plus", label: "Khách mới 30 ngày", value: String(users30), delta: pctChange(users30, usersPrev30), note: "so với 30 ngày trước" },
  ];
  const siteTotal = siteStatusGroups.reduce((s, g) => s + g._count, 0);
  let acc = 0;
  const donutSegs = siteStatusGroups
    .filter((g) => g._count > 0)
    .map((g) => {
      const from = (acc / Math.max(1, siteTotal)) * 100;
      acc += g._count;
      const to = (acc / Math.max(1, siteTotal)) * 100;
      return `${SITE_CHART_COLORS[g.status] ?? "#94a3b8"} ${from}% ${to}%`;
    });
  const donutBg = donutSegs.length ? `conic-gradient(${donutSegs.join(", ")})` : "#e2e8f0";
  const pkgMax = Math.max(1, ...packageGroups.map((g) => g._count));
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

      {/* ===== THONG KE ===== */}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900"><i className="fa-solid fa-chart-column mr-2 text-brand-600" aria-hidden /> Doanh thu 14 ngày gần nhất</h2>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="text-2xl font-black text-slate-900">{formatVND(rev14)}</span>
                {revDelta && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${revDelta.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    <i className={`fa-solid ${revDelta.up ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} aria-hidden /> {revDelta.text}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">So với 14 ngày trước đó ({formatVND(revPrev14)}) · tính theo ngày thanh toán</p>
            </div>
            <Link href="/admin/don-thue" className="text-sm font-semibold text-brand-700 hover:underline">Xem đơn thuê →</Link>
          </div>
          <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2">
            {chartDays.map((d, i) => (
              <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.date.getDate()}/${d.date.getMonth() + 1}: ${formatVND(d.value)}`}>
                <span className="text-[10px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
                  {d.value > 0 ? `${Math.round(d.value / 1000)}k` : ""}
                </span>
                <div
                  className={`w-full rounded-t-md transition ${d.value > 0 ? "bg-gradient-to-t from-brand-600 to-brand-400 group-hover:from-brand-700 group-hover:to-brand-500" : "bg-slate-100"}`}
                  style={{ height: `${Math.max(2, Math.round((d.value / chartMax) * 100))}%` }}
                />
                <span className={`text-[10px] ${i === 13 ? "font-bold text-brand-700" : "text-slate-400"}`}>
                  {d.date.getDate()}/{d.date.getMonth() + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            {stat30.map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500"><i className={`fa-solid ${s.icon} mr-1.5 text-brand-500`} aria-hidden />{s.label}</span>
                  {s.delta && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${s.delta.up ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>{s.delta.text}</span>
                  )}
                </div>
                <div className="mt-1 truncate text-lg font-black text-slate-900">{s.value}</div>
                <div className="text-[11px] text-slate-400">{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900"><i className="fa-solid fa-chart-pie mr-2 text-brand-600" aria-hidden /> Website theo trạng thái</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: donutBg }}>
                <div className="absolute inset-[16px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-xl font-black leading-none text-slate-900">{siteTotal}</span>
                  <span className="text-[10px] text-slate-400">website</span>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {siteStatusGroups.map((g) => (
                  <li key={g.status} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: SITE_CHART_COLORS[g.status] ?? "#94a3b8" }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{(SITE_STATUS[g.status] ?? SITE_STATUS.HET_HAN).label}</span>
                    <b className="text-slate-900">{g._count}</b>
                    <span className="w-10 text-right text-xs text-slate-400">{siteTotal ? Math.round((g._count / siteTotal) * 100) : 0}%</span>
                  </li>
                ))}
                {siteTotal === 0 && <li className="text-sm text-slate-500">Chưa có website nào.</li>}
              </ul>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-slate-900"><i className="fa-solid fa-ranking-star mr-2 text-brand-600" aria-hidden /> Gói bán chạy nhất</h2>
            <div className="mt-4 space-y-3.5">
              {packageGroups.map((g, i) => (
                <div key={g.planName}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-700"><span className="mr-1.5 font-black text-slate-300">{i + 1}</span>{g.planName}</span>
                    <span className="shrink-0 text-xs text-slate-400">{g._count} đơn · <b className="text-slate-700">{formatVND(g._sum.total ?? 0)}</b></span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${Math.round((g._count / pkgMax) * 100)}%` }} />
                  </div>
                </div>
              ))}
              {packageGroups.length === 0 && <p className="text-sm text-slate-500">Chưa có đơn nào được thanh toán.</p>}
            </div>
          </div>
        </div>
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
