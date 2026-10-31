import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, ORDER_STATUS, SITE_STATUS, TICKET_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Ho so 360 do cua mot khach hang: thong tin, tong da chi, toan bo don thue,
// website va ticket ho tro cua khach — mo tu danh sach Khach hang.
export default async function AdminCustomerDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { template: true } },
      sites: { orderBy: { createdAt: "desc" }, include: { template: true, timePackage: true, plan: true } },
      tickets: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
  if (!user || user.role !== "CUSTOMER") notFound();
  const totalSpent = user.orders.filter((o) => o.status === "DA_THANH_TOAN").reduce((s, o) => s + o.total, 0);
  const paidCount = user.orders.filter((o) => o.status === "DA_THANH_TOAN").length;

  const tiles = [
    { icon: "fa-sack-dollar", label: "Tổng đã chi", value: formatVND(totalSpent) },
    { icon: "fa-receipt", label: "Đơn thuê", value: `${user.orders.length} đơn (${paidCount} đã thanh toán)` },
    { icon: "fa-globe", label: "Website", value: `${user.sites.length} website` },
    { icon: "fa-calendar-plus", label: "Ngày đăng ký", value: formatDate(user.createdAt) },
  ];

  return (
    <div>
      <Link href="/admin/khach-hang" className="text-sm text-brand-700 hover:underline">← Danh sách khách hàng</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3.5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
          {(user.name || "?").trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card flex items-start gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <i className={`fa-solid ${t.icon}`} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate font-black text-slate-900">{t.value}</div>
              <div className="text-xs text-slate-400">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold">Đơn thuê của khách</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Tổng</th><th className="th">Trạng thái</th><th className="th">Ngày</th></tr></thead>
          <tbody>
            {user.orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium"><Link href={`/admin/don-thue/${o.id}`} className="text-brand-700 hover:underline">{o.code}</Link>{o.renewalSiteId && <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">Gia hạn</span>}</td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{o.domain}</td>
                <td className="td font-medium">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}</td>
                <td className="td">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {user.orders.length === 0 && <tr><td className="td text-slate-500" colSpan={6}>Khách chưa có đơn thuê nào.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">Website của khách</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Tên miền</th><th className="th">Key kích hoạt</th><th className="th">Trạng thái</th><th className="th">Hết hạn</th></tr></thead>
          <tbody>
            {user.sites.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="td font-medium">{s.name}<div className="text-xs text-slate-400">{s.timePackage?.name ?? s.plan?.name ?? "—"}</div></td>
                <td className="td">{s.domain}</td>
                <td className="td">
                  <code className="font-mono text-xs font-semibold text-slate-700">{s.licenseKey ?? "—"}</code>
                  <div className={`text-xs ${s.keyActivatedAt ? "text-emerald-600" : "text-amber-600"}`}>{s.keyActivatedAt ? "Đã kích hoạt" : "Chưa kích hoạt"}</div>
                </td>
                <td className="td"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).color}`}>{(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).label}</span></td>
                <td className="td">{formatDate(s.expiresAt)}</td>
              </tr>
            ))}
            {user.sites.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Khách chưa có website nào.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">Ticket hỗ trợ gần đây</h2>
      <div className="mt-3 space-y-2.5">
        {user.tickets.map((t) => {
          const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.OPEN;
          return (
            <Link key={t.id} href={`/admin/ho-tro/${t.id}`} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">{t.subject}</span>
                <span className="block text-xs text-slate-400">Cập nhật {formatDate(t.updatedAt)}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
            </Link>
          );
        })}
        {user.tickets.length === 0 && <p className="text-sm text-slate-500">Khách chưa gửi ticket hỗ trợ nào.</p>}
      </div>
    </div>
  );
}
