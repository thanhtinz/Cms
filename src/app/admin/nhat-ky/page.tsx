import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ACTIVITY_LABELS } from "@/lib/activity";
import { parseListParams, pageInfo, qVariants } from "@/lib/admin-list";
import { FilterBar, Pagination } from "@/components/admin/ListTools";

export const dynamic = "force-dynamic";

// Nhật ký hoạt động: mọi thao tác quan trọng của đội quản trị đều được ghi lại
// (xác nhận thanh toán, kích hoạt, cấp lại key, đổi cài đặt...) để đối soát.
export default async function AdminActivityLog({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const p = parseListParams(searchParams);
  const where: Record<string, unknown> = {};
  if (p.status) where.action = p.status;
  if (p.from || p.to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (p.from) range.gte = new Date(`${p.from}T00:00:00`);
    if (p.to) range.lte = new Date(`${p.to}T23:59:59.999`);
    where.createdAt = range;
  }
  if (p.q) {
    const vs = qVariants(p.q);
    where.OR = [
      ...vs.map((v) => ({ detail: { contains: v } })),
      ...vs.map((v) => ({ actorName: { contains: v } })),
    ];
  }
  const total = await prisma.activityLog.count({ where: where as never });
  const pg = pageInfo(p, total);
  const logs = await prisma.activityLog.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    skip: pg.skip,
    take: p.size,
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">Nhật ký hoạt động</h1>
      <p className="mt-1 text-sm text-slate-500">Mọi thao tác quan trọng của đội quản trị — xác nhận thanh toán, kích hoạt website, cấp lại key, thay đổi cài đặt — đều được ghi lại để đối soát.</p>

      <FilterBar
        base="/admin/nhat-ky"
        params={p}
        statusOptions={Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label }))}
        searchPlaceholder="Nội dung thao tác, người thực hiện..."
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Thời gian</th><th className="th">Người thực hiện</th><th className="th">Hành động</th><th className="th">Chi tiết</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="td whitespace-nowrap text-slate-500">{formatDate(l.createdAt)}<div className="text-xs text-slate-400">{l.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div></td>
                <td className="td">{l.actorName}</td>
                <td className="td"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{ACTIVITY_LABELS[l.action] ?? l.action}</span></td>
                <td className="td">{l.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td className="td text-slate-500" colSpan={4}>Chưa có thao tác nào được ghi lại{total === 0 && !p.q && !p.status ? " — nhật ký sẽ bắt đầu có dữ liệu khi quản trị viên thực hiện thao tác" : " khớp bộ lọc"}.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination base="/admin/nhat-ky" params={p} page={pg.page} totalPages={pg.totalPages} total={total} from={pg.from} to={pg.to} />
    </div>
  );
}
