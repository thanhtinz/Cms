import { prisma } from "@/lib/db";
import { formatDate, SITE_STATUS } from "@/lib/utils";
import { setSiteStatusAction, activateSiteAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminSites() {
  const sites = await prisma.site.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, template: true, plan: true } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Website khách</h1>
      <p className="mt-1 text-sm text-slate-500">Mọi website hệ thống đã tạo cho khách. Kích hoạt khi khách trỏ DNS xong — hạn thuê tính từ ngày kích hoạt.</p>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Website</th><th className="th">Khách</th><th className="th">Mẫu / Gói</th><th className="th">Tên miền</th><th className="th">Trạng thái</th><th className="th">Hết hạn</th><th className="th"></th></tr></thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="td font-medium">{s.name}<div className="text-xs text-slate-400">{s.slug}</div></td>
                <td className="td">{s.user.name}</td>
                <td className="td">{s.template.name}<div className="text-xs text-slate-400">{s.plan.name}</div></td>
                <td className="td">{s.domain}</td>
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
                </td>
              </tr>
            ))}
            {sites.length === 0 && <tr><td className="td text-slate-500" colSpan={7}>Chưa có website nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
