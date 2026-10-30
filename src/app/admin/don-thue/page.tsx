import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, ORDER_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: { trangthai?: string } }) {
  const where = searchParams.trangthai ? { status: searchParams.trangthai } : {};
  const orders = await prisma.rentalOrder.findMany({ where, orderBy: { createdAt: "desc" }, include: { user: true, template: true, site: true } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Đơn thuê</h1>
      <div className="mt-3 flex gap-2 text-sm">
        <Link href="/admin/don-thue" className="rounded-full border bg-white px-3 py-1.5">Tất cả</Link>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <Link key={k} href={`/admin/don-thue?trangthai=${k}`} className="rounded-full border bg-white px-3 py-1.5">{v}</Link>
        ))}
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Khách</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Tổng</th><th className="th">Trạng thái</th><th className="th">Ngày</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium"><Link href={`/admin/don-thue/${o.id}`} className="text-brand-700 hover:underline">{o.code}</Link></td>
                <td className="td">{o.user.name}<div className="text-xs text-slate-400">{o.user.email}</div></td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{o.domain}</td>
                <td className="td">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}{o.site ? "" : ""}</td>
                <td className="td">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={7}>Không có đơn nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
