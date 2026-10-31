import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, SITE_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Trang cong khai: khach nhap KEY KICH HOAT hoac TEN MIEN de tu kiem tra
// trang thai website cua minh (da kich hoat chua, con han bao lau) —
// giong trang kiem tra ban quyen cua cac nen tang ban source chuyen nghiep.
export default async function CheckKeyPage({ searchParams }: { searchParams: { key?: string; domain?: string } }) {
  const key = (searchParams.key ?? "").trim().toUpperCase();
  const domain = (searchParams.domain ?? "").trim().toLowerCase();
  const searched = !!(key || domain);
  let site = null;
  if (key) {
    site = await prisma.site.findUnique({ where: { licenseKey: key }, include: { template: true, timePackage: true, plan: true } });
  } else if (domain) {
    site = await prisma.site.findFirst({ where: { domain: { equals: domain } }, include: { template: true, timePackage: true, plan: true } });
  }
  const daysLeft = site?.expiresAt ? Math.ceil((site.expiresAt.getTime() - Date.now()) / 86400000) : null;
  const st = site ? (SITE_STATUS[site.status] ?? SITE_STATUS.HET_HAN) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600">
          <i className="fa-solid fa-key" aria-hidden />
        </span>
        <h1 className="!mt-4 text-3xl font-black text-slate-900">Kiểm tra key kích hoạt</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Nhập key kích hoạt bạn nhận được khi thuê website (định dạng TW-XXXXXX-XXXXXX-XXXXXX) hoặc tên miền của website để xem trạng thái kích hoạt và thời hạn thuê.
        </p>
      </div>

      <form method="GET" action="/kiem-tra-key" className="card mx-auto mt-7 max-w-xl space-y-3 p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Key kích hoạt</span>
          <input name="key" defaultValue={key} placeholder="TW-XXXXXX-XXXXXX-XXXXXX" className="input font-mono" />
        </label>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> hoặc <span className="h-px flex-1 bg-slate-200" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Tên miền website</span>
          <input name="domain" defaultValue={domain} placeholder="vidu.vn" className="input" />
        </label>
        <button className="btn-primary w-full !rounded-xl py-3">
          <i className="fa-solid fa-magnifying-glass mr-2" aria-hidden /> Kiểm tra
        </button>
      </form>

      {searched && !site && (
        <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
          <i className="fa-solid fa-circle-exclamation mr-1.5" aria-hidden />
          Không tìm thấy website nào khớp. Kiểm tra lại key (đủ 3 nhóm ký tự, có dấu gạch ngang) hoặc tên miền rồi thử lại.
        </div>
      )}

      {site && st && (
        <div className="card mx-auto mt-5 max-w-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black text-slate-900">{site.name}</div>
              <div className="text-sm text-slate-500">{site.domain}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.color}`}>{st.label}</span>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-400">Key kích hoạt</dt>
              <dd className="mt-0.5 font-mono text-[13px] font-semibold text-slate-800">{site.licenseKey ?? "—"}</dd>
              <dd className={`mt-0.5 text-xs font-semibold ${site.keyActivatedAt ? "text-emerald-600" : "text-amber-600"}`}>
                {site.keyActivatedAt ? `Đã kích hoạt · ${formatDate(site.keyActivatedAt)}` : "Chưa được kích hoạt"}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-400">Hạn thuê</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{site.expiresAt ? `Đến ${formatDate(site.expiresAt)}` : "Chưa bắt đầu (chờ kích hoạt)"}</dd>
              <dd className="mt-0.5 text-xs text-slate-500">
                {daysLeft === null ? "Hạn tính từ ngày kích hoạt website" : daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã hết hạn — hãy gia hạn để website hoạt động lại"}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-400">Mẫu website</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{site.template.name}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-400">Gói thuê</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{site.timePackage?.name ?? site.plan?.name ?? "—"}</dd>
            </div>
          </dl>
          {site.status === "HET_HAN" && (
            <Link href="/portal/website" className="btn-primary mt-5 w-full !rounded-xl py-3">
              Đăng nhập để gia hạn ngay
            </Link>
          )}
        </div>
      )}

      <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-slate-400">
        Key kích hoạt là duy nhất cho mỗi lần thuê và chỉ dùng khi cài đặt website lần đầu. Nếu bạn chưa có key, hãy đăng nhập và mở mục Website của tôi trong Dashboard.
      </p>
    </div>
  );
}
