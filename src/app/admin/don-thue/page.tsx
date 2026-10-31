import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDate, ORDER_STATUS } from "@/lib/utils";
import { parseListParams, pageInfo, filterQuery } from "@/lib/admin-list";
import { orderWhere } from "@/lib/order-filter";
import { FilterBar, Pagination } from "@/components/admin/ListTools";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const p = parseListParams(searchParams);
  const where = orderWhere(p);
  const [agg, statusGroups] = await Promise.all([
    prisma.rentalOrder.aggregate({ where: where as never, _count: true, _sum: { total: true } }),
    prisma.rentalOrder.groupBy({ by: ["status"], _count: true }),
  ]);
  const total = agg._count;
  const pg = pageInfo(p, total);
  const orders = await prisma.rentalOrder.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    skip: pg.skip,
    take: p.size,
    include: { user: true, template: true, site: true },
  });
  const countByStatus = new Map(statusGroups.map((g) => [g.status, g._count]));
  const totalAll = statusGroups.reduce((s, g) => s + g._count, 0);
  const csvQs = filterQuery(p);

  return (
    <div>
      <h1 className="text-2xl font-bold">Đơn thuê</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/don-thue" className={`rounded-full border px-3 py-1.5 ${!p.status ? "border-brand-600 bg-brand-600 font-semibold text-white" : "bg-white"}`}>
          Tất cả <span className="opacity-70">({totalAll})</span>
        </Link>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <Link key={k} href={`/admin/don-thue?trangthai=${k}`} className={`rounded-full border px-3 py-1.5 ${p.status === k ? "border-brand-600 bg-brand-600 font-semibold text-white" : "bg-white"}`}>
            {v} <span className="opacity-70">({countByStatus.get(k) ?? 0})</span>
          </Link>
        ))}
      </div>

      <FilterBar
        base="/admin/don-thue"
        params={p}
        statusOptions={Object.entries(ORDER_STATUS).map(([value, label]) => ({ value, label }))}
        searchPlaceholder="Mã đơn, tên miền, tên/email khách..."
        csvHref={`/admin/don-thue/xuat-csv${csvQs ? `?${csvQs}` : ""}`}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mã đơn</th><th className="th">Khách</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Tổng</th><th className="th">Trạng thái</th><th className="th">Ngày</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="td font-medium"><Link href={`/admin/don-thue/${o.id}`} className="text-brand-700 hover:underline">{o.code}</Link>{o.renewalSiteId && <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">Gia hạn</span>}</td>
                <td className="td">{o.user.name}<div className="text-xs text-slate-400">{o.user.email}</div></td>
                <td className="td">{o.template.name}<div className="text-xs text-slate-400">{o.planName} · {o.durationMonths} tháng</div></td>
                <td className="td">{o.domain}</td>
                <td className="td font-medium">{formatVND(o.total)}</td>
                <td className="td">{ORDER_STATUS[o.status] ?? o.status}</td>
                <td className="td">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-500" colSpan={7}>Không có đơn nào khớp bộ lọc.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t bg-slate-50 font-semibold text-slate-700">
              <td className="td" colSpan={4}>Tổng theo bộ lọc: {total} đơn</td>
              <td className="td">{formatVND(agg._sum.total ?? 0)}</td>
              <td className="td" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Pagination base="/admin/don-thue" params={p} page={pg.page} totalPages={pg.totalPages} total={total} from={pg.from} to={pg.to} />
    </div>
  );
}
