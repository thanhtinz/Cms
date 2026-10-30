import Link from "next/link";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, SITE_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Danh sach website cua khach
export default async function PortalSitesPage() {
  const user = await requireUser();
  const [sites, settings] = await Promise.all([
    prisma.site.findMany({ where: { userId: user.id }, include: { template: true, plan: true, timePackage: true }, orderBy: { createdAt: "desc" } }),
    getSettings(),
  ]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Website của tôi</h1>
          <p className="mt-1 text-slate-500">{sites.length} website — bấm vào từng website để kết nối tên miền, gia hạn và xem chi tiết.</p>
        </div>
        <Link href="/mau" className="btn-primary"><i className="fa-solid fa-plus mr-2" aria-hidden /> Thuê website mới</Link>
      </div>

      {sites.length === 0 && (
        <div className="card mt-6 p-8 text-center">
          <div className="font-bold text-slate-900">Chưa có website nào</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Website xuất hiện tại đây ngay khi đơn thuê của bạn được xác nhận thanh toán.</p>
          <Link href="/mau" className="btn-primary mt-4">Xem kho mẫu</Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sites.map((s) => {
          const st = SITE_STATUS[s.status] ?? SITE_STATUS.HET_HAN;
          return (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">{s.name}</div>
                  <div className="text-sm text-slate-500">Mẫu: {s.template.name} · Gói: {s.timePackage?.name ?? s.plan?.name ?? "—"}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Tên miền tạm</dt><dd className="font-medium">{s.slug}.{settings.platformDomain}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Tên miền chính</dt><dd className="font-medium">{s.domain}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Ngày hết hạn</dt><dd className="font-medium">{s.expiresAt ? formatDate(s.expiresAt) : "Chưa kích hoạt"}</dd></div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Link href={`/portal/website/${s.id}`} className="btn-primary flex-1">
                  {s.status === "CHO_TRO_DNS" ? "Kết nối tên miền" : "Quản lý website"}
                </Link>
                {s.startedAt && s.status !== "CHO_TRO_DNS" && (
                  <Link href={`/portal/website/${s.id}#gia-han`} className="btn-ghost flex-1"><i className="fa-solid fa-rotate mr-2" aria-hidden /> Gia hạn</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
