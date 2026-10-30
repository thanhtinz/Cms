import Link from "next/link";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatVND, formatDate, ORDER_STATUS, SITE_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

// Dashboard khach hang — trang Tong quan
export default async function PortalOverview() {
  const user = await requireUser();
  const [orders, sites, settings, openTickets] = await Promise.all([
    prisma.rentalOrder.findMany({ where: { userId: user.id }, include: { template: true }, orderBy: { createdAt: "desc" } }),
    prisma.site.findMany({ where: { userId: user.id }, include: { template: true, plan: true, timePackage: true }, orderBy: { createdAt: "desc" } }),
    getSettings(),
    prisma.supportTicket.count({ where: { userId: user.id, status: { in: ["OPEN", "ANSWERED"] } } }),
  ]);

  const activeSites = sites.filter((s) => s.status === "DANG_HOAT_DONG");
  const pendingOrders = orders.filter((o) => o.status === "CHO_THANH_TOAN");
  const totalSpent = orders.filter((o) => o.status === "DA_THANH_TOAN").reduce((a, o) => a + o.total, 0);
  const needDns = sites.filter((s) => s.status === "CHO_TRO_DNS");
  const expiring = activeSites
    .map((s) => ({ s, d: daysLeft(s.expiresAt) }))
    .filter((x) => x.d !== null && x.d <= 30)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0));

  const stats = [
    { icon: "fa-globe", label: "Website đang hoạt động", value: String(activeSites.length), sub: `trên tổng ${sites.length} website` },
    { icon: "fa-receipt", label: "Đơn chờ thanh toán", value: String(pendingOrders.length), sub: pendingOrders.length ? "thanh toán để kích hoạt dịch vụ" : "không có đơn nào đang chờ" },
    { icon: "fa-sack-dollar", label: "Tổng đã thanh toán", value: formatVND(totalSpent), sub: `qua ${orders.filter((o) => o.status === "DA_THANH_TOAN").length} đơn thành công` },
    { icon: "fa-headset", label: "Yêu cầu hỗ trợ đang mở", value: String(openTickets), sub: "đội hỗ trợ phản hồi trong mục Hỗ trợ" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Xin chào, {user.name}</h1>
          <p className="mt-1 text-slate-500">Tổng quan website, đơn thuê và những việc cần xử lý của bạn.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/ho-tro" className="btn-ghost"><i className="fa-solid fa-headset mr-2" aria-hidden /> Gửi yêu cầu hỗ trợ</Link>
          <Link href="/mau" className="btn-primary"><i className="fa-solid fa-plus mr-2" aria-hidden /> Thuê website mới</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="card flex items-start gap-3.5 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <i className={`fa-solid ${x.icon} text-lg`} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xl font-black text-slate-900">{x.value}</div>
              <div className="text-sm font-medium text-slate-600">{x.label}</div>
              <div className="text-xs text-slate-400">{x.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {(needDns.length > 0 || expiring.length > 0 || pendingOrders.length > 0) && (
        <div className="mt-6 space-y-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Cần xử lý</h2>
          {needDns.map((s) => (
            <Link key={s.id} href={`/portal/website/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100/70">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden />
              <span className="flex-1"><b>{s.name}</b> đang chờ kết nối tên miền {s.domain} — thêm 3 bản ghi DNS trên Cloudflare để kích hoạt.</span>
              <span className="font-bold">Xem hướng dẫn →</span>
            </Link>
          ))}
          {expiring.map(({ s, d }) => (
            <Link key={s.id} href={`/portal/website/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 transition hover:bg-red-100/70">
              <i className="fa-solid fa-clock" aria-hidden />
              <span className="flex-1"><b>{s.name}</b> ({s.domain}) {d! < 0 ? `đã hết hạn ${-d!} ngày` : `còn ${d} ngày là hết hạn`} — gia hạn ngay để website không bị tạm ngưng.</span>
              <span className="font-bold">Gia hạn →</span>
            </Link>
          ))}
          {pendingOrders.map((o) => (
            <Link key={o.id} href={`/thue/hoan-tat/${o.code}`} className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 transition hover:bg-brand-100/70">
              <i className="fa-solid fa-credit-card" aria-hidden />
              <span className="flex-1">Đơn <b>{o.code}</b> ({o.planName}) đang chờ thanh toán {formatVND(o.total)}.</span>
              <span className="font-bold">Thanh toán →</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Website của bạn</h2>
        <Link href="/portal/website" className="text-sm font-semibold text-brand-700 hover:underline">Xem tất cả →</Link>
      </div>
      {sites.length === 0 ? (
        <div className="card mt-3 p-8 text-center">
          <div className="font-bold text-slate-900">Bạn chưa có website nào</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Chọn một mẫu ưng ý và thuê theo gói thời gian — website được tạo tự động ngay khi thanh toán được xác nhận.</p>
          <Link href="/mau" className="btn-primary mt-4">Xem kho mẫu</Link>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {sites.slice(0, 4).map((s) => {
            const st = SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN;
            return (
              <Link key={s.id} href={`/portal/website/${s.id}`} className="card group p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900 group-hover:text-brand-700">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.template.name} · {s.timePackage?.name ?? s.plan?.name ?? "—"}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span><i className="fa-solid fa-globe mr-1.5 text-slate-300" aria-hidden />{s.domain}</span>
                  <span><i className="fa-solid fa-calendar-days mr-1.5 text-slate-300" aria-hidden />Hết hạn: {s.expiresAt ? formatDate(s.expiresAt) : "chưa kích hoạt"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Đơn thuê gần đây</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Mẫu / Gói</th><th className="th">Tổng tiền</th><th className="th">Trạng thái</th><th className="th"></th></tr></thead>
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium">{o.code}{o.renewalSiteId && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">Gia hạn</span>}</td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}</td>
                <td className="td">{o.status === "CHO_THANH_TOAN" && <Link href={`/thue/hoan-tat/${o.code}`} className="font-semibold text-brand-700 hover:underline">Thanh toán</Link>}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Chưa có đơn thuê nào.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Tên miền tạm để xem trước có dạng: {`{slug}`}.{settings.platformDomain} · Cần giúp đỡ? Bấm bong bóng chat ở góc phải hoặc vào mục Hỗ trợ.</p>
    </div>
  );
}
