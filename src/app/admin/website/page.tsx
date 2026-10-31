import { prisma } from "@/lib/db";
import { formatDate, SITE_STATUS } from "@/lib/utils";
import { setSiteStatusAction, activateSiteAction, regenerateLicenseKeyAction } from "@/lib/actions";
import { ensureLicenseKey } from "@/lib/license";
import { parseListParams, pageInfo } from "@/lib/admin-list";
import { siteWhere } from "@/lib/order-filter";
import { FilterBar, Pagination } from "@/components/admin/ListTools";

export const dynamic = "force-dynamic";

export default async function AdminSites({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const p = parseListParams(searchParams);
  const where = siteWhere(p);
  const total = await prisma.site.count({ where: where as never });
  const pg = pageInfo(p, total);
  const sites = await prisma.site.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    skip: pg.skip,
    take: p.size,
    include: { user: true, template: true, plan: true, timePackage: true },
  });
  const keys = new Map<string, string>();
  for (const s of sites) keys.set(s.id, await ensureLicenseKey(s));
  return (
    <div>
      <h1 className="text-2xl font-bold">Website khách</h1>
      <p className="mt-1 text-sm text-slate-500">Mọi website hệ thống đã tạo cho khách. Kích hoạt khi khách trỏ DNS xong — hạn thuê tính từ ngày kích hoạt.</p>

      <FilterBar
        base="/admin/website"
        params={p}
        statusOptions={Object.entries(SITE_STATUS).map(([value, v]) => ({ value, label: v.label }))}
        searchPlaceholder="Tên web, tên miền, slug, key, tên/email khách..."
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Khách</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Key kích hoạt</th><th className="th">Trạng thái</th><th className="th">Hết hạn</th><th className="th"></th></tr></thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="td font-medium">{s.name}<div className="text-xs text-slate-400">{s.slug}</div></td>
                <td className="td">{s.user.name}</td>
                <td className="td">{s.template.name}<div className="text-xs text-slate-400">{s.timePackage?.name ?? s.plan?.name ?? "—"}</div><div className="text-xs text-slate-400">Đã cấp: {s.quotaStorageGb} GB đĩa · {s.quotaBandwidthGb === -1 ? "BW không giới hạn" : `${s.quotaBandwidthGb} GB BW`} · Đã dùng {(s.usedStorageMb / 1024).toFixed(2)} GB</div></td>
                <td className="td">{s.domain}</td>
                <td className="td">
                  <code className="font-mono text-xs font-semibold text-slate-700">{keys.get(s.id)}</code>
                  <div className="text-xs">
                    {s.keyActivatedAt
                      ? <span className="font-medium text-emerald-600">Đã kích hoạt · {formatDate(s.keyActivatedAt)}</span>
                      : <span className="text-amber-600">Chưa kích hoạt</span>}
                  </div>
                </td>
                <td className="td"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).color}`}>{(SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN).label}</span></td>
                <td className="td">{formatDate(s.expiresAt)}</td>
                <td className="td whitespace-nowrap">
                  {s.status === "CHO_TRO_DNS" && (
                    <form action={activateSiteAction} className="inline">
                      <input type="hidden" name="siteId" value={s.id} />
                      <input type="hidden" name="back" value="/admin/website" />
                      <button className="font-semibold text-emerald-700 hover:underline">Kích hoạt</button>
                    </form>
                  )}
                  {s.status === "DANG_HOAT_DONG" && (
                    <form action={setSiteStatusAction} className="inline">
                      <input type="hidden" name="siteId" value={s.id} />
                      <input type="hidden" name="status" value="TAM_NGUNG" />
                      <input type="hidden" name="back" value="/admin/website" />
                      <button className="font-semibold text-red-600 hover:underline">Tạm ngưng</button>
                    </form>
                  )}
                  {s.status === "TAM_NGUNG" && (
                    <form action={setSiteStatusAction} className="inline">
                      <input type="hidden" name="siteId" value={s.id} />
                      <input type="hidden" name="status" value="DANG_HOAT_DONG" />
                      <input type="hidden" name="back" value="/admin/website" />
                      <button className="font-semibold text-emerald-700 hover:underline">Mở lại</button>
                    </form>
                  )}
                  <form action={regenerateLicenseKeyAction} className="mt-1 block">
                    <input type="hidden" name="siteId" value={s.id} />
                    <button className="font-semibold text-slate-500 hover:text-amber-600 hover:underline" title="Cấp key mới — key cũ mất hiệu lực, trạng thái kích hoạt đặt lại">Cấp lại key</button>
                  </form>
                </td>
              </tr>
            ))}
            {sites.length === 0 && <tr><td className="td text-slate-500" colSpan={8}>Không có website nào khớp bộ lọc.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t bg-slate-50 font-semibold text-slate-700">
              <td className="td" colSpan={8}>Tổng theo bộ lọc: {total} website</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Pagination base="/admin/website" params={p} page={pg.page} totalPages={pg.totalPages} total={total} from={pg.from} to={pg.to} />
    </div>
  );
}
