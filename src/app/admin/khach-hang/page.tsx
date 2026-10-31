import { prisma } from "@/lib/db";
import { formatDate, formatVND } from "@/lib/utils";
import { parseListParams, pageInfo, filterQuery } from "@/lib/admin-list";
import { customerWhere } from "@/lib/order-filter";
import { FilterBar, Pagination } from "@/components/admin/ListTools";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const p = parseListParams(searchParams);
  const where = customerWhere(p);
  const [total, paidGroups, filteredIds] = await Promise.all([
    prisma.user.count({ where: where as never }),
    prisma.rentalOrder.groupBy({ by: ["userId"], where: { status: "DA_THANH_TOAN" }, _sum: { total: true }, _count: true }),
    prisma.user.findMany({ where: where as never, select: { id: true } }),
  ]);
  const spentMap = new Map(paidGroups.map((g) => [g.userId, g._sum.total ?? 0]));
  const filteredIdSet = new Set(filteredIds.map((u) => u.id));
  const totalSpentFiltered = paidGroups.filter((g) => filteredIdSet.has(g.userId)).reduce((s, g) => s + (g._sum.total ?? 0), 0);
  const pg = pageInfo(p, total);
  const users = await prisma.user.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    skip: pg.skip,
    take: p.size,
    include: { _count: { select: { orders: true, sites: true } } },
  });
  const csvQs = filterQuery(p);
  return (
    <div>
      <h1 className="text-2xl font-bold">Khách hàng</h1>

      <FilterBar
        base="/admin/khach-hang"
        params={p}
        searchPlaceholder="Tên, email, số điện thoại khách..."
        csvHref={`/admin/khach-hang/xuat-csv${csvQs ? `?${csvQs}` : ""}`}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Khách</th><th className="th">Liên hệ</th><th className="th">Tổng đã chi</th><th className="th">Số đơn thuê</th><th className="th">Số website</th><th className="th">Ngày đăng ký</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="td font-medium">{u.name}</td>
                <td className="td">{u.email}{u.phone ? <div className="text-xs text-slate-400">{u.phone}</div> : null}</td>
                <td className="td font-semibold text-slate-800">{formatVND(spentMap.get(u.id) ?? 0)}</td>
                <td className="td">{u._count.orders}</td>
                <td className="td">{u._count.sites}</td>
                <td className="td">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td className="td text-slate-500" colSpan={6}>Không có khách nào khớp bộ lọc.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t bg-slate-50 font-semibold text-slate-700">
              <td className="td" colSpan={2}>Tổng theo bộ lọc: {total} khách hàng</td>
              <td className="td">{formatVND(totalSpentFiltered)}</td>
              <td className="td" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Pagination base="/admin/khach-hang" params={p} page={pg.page} totalPages={pg.totalPages} total={total} from={pg.from} to={pg.to} />
    </div>
  );
}
