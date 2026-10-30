import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatVND, formatDate, ORDER_STATUS } from "@/lib/utils";
import { cancelMyOrderAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "CHO_THANH_TOAN", label: "Chờ thanh toán" },
  { key: "DA_THANH_TOAN", label: "Đã thanh toán" },
  { key: "DA_HUY", label: "Đã huỷ" },
];

// Danh sach don thue + don gia han cua khach
export default async function PortalOrdersPage({ searchParams }: { searchParams: { tt?: string } }) {
  const user = await requireUser();
  const tt = searchParams.tt ?? "";
  const orders = await prisma.rentalOrder.findMany({
    where: { userId: user.id, ...(FILTERS.some((f) => f.key === tt && tt) ? { status: tt } : {}) },
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Đơn thuê & gia hạn</h1>
      <p className="mt-1 text-slate-500">Toàn bộ đơn thuê website và đơn gia hạn của bạn, gồm cả voucher đã áp dụng.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/portal/don-thue?tt=${f.key}` : "/portal/don-thue"}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${tt === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-slate-50">
            <tr><th className="th">Mã đơn</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Ngày tạo</th><th className="th">Tổng tiền</th><th className="th">Trạng thái</th><th className="th"></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium">
                  {o.code}
                  {o.renewalSiteId && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">Gia hạn</span>}
                  {o.voucherCode && <div className="mt-0.5 text-xs font-normal text-emerald-600">Voucher {o.voucherCode}</div>}
                </td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{o.domain}</td>
                <td className="td">{formatDate(o.createdAt)}</td>
                <td className="td font-medium">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}</td>
                <td className="td whitespace-nowrap">
                  {o.status === "CHO_THANH_TOAN" && (
                    <span className="flex items-center gap-3">
                      <Link href={`/thue/hoan-tat/${o.code}`} className="font-semibold text-brand-700 hover:underline">Thanh toán</Link>
                      <form action={cancelMyOrderAction}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <input type="hidden" name="back" value="/portal/don-thue" />
                        <button className="font-medium text-red-500 hover:underline">Huỷ đơn</button>
                      </form>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={7}>Chưa có đơn nào ở mục này.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
