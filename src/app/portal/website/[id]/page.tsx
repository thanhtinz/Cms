import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatVND, SITE_STATUS, ORDER_STATUS } from "@/lib/utils";
import DomainCheckButton from "@/components/DomainCheckButton";
import RenewForm from "@/components/RenewForm";

export const dynamic = "force-dynamic";

// Chi tiet 1 website cua khach: ket noi DNS + gia han + lich su gia han
export default async function PortalSiteDetail({ params, searchParams }: { params: { id: string }; searchParams: { loi?: string } }) {
  const user = await requireUser();
  const site = await prisma.site.findUnique({
    where: { id: params.id },
    include: { template: true, plan: true, timePackage: true, order: true },
  });
  if (!site || site.userId !== user.id) notFound();
  const [s, packages, renewals] = await Promise.all([
    getSettings(),
    prisma.timePackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.rentalOrder.findMany({ where: { renewalSiteId: site.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const st = SITE_STATUS[site.status] ?? SITE_STATUS.HET_HAN;

  const records = [
    { type: "CNAME", name: "@", value: s.cnameTarget, note: "Trỏ tên miền về hệ thống. Trên Cloudflare đặt Proxy: DNS only (mây xám)." },
    { type: "TXT", name: "_cf-custom-hostname", value: site.dnsToken, note: "Chứng minh bạn sở hữu tên miền này." },
    { type: "CNAME", name: "_acme-challenge", value: `${site.slug}.${s.acmeTarget}`, note: "Uỷ quyền cấp & gia hạn SSL tự động — làm 1 lần duy nhất." },
  ];

  return (
    <div>
      <Link href="/portal/website" className="text-sm font-medium text-brand-700 hover:underline">← Quay lại Website của tôi</Link>
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{site.name}</h1>
            <p className="text-sm text-slate-500">Mẫu {site.template.name} · Gói {site.timePackage?.name ?? site.plan?.name ?? "—"} · Đơn gốc {site.order.code}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Tên miền tạm (xem trước ngay)</dt><dd className="font-medium">{site.slug}.{s.platformDomain}</dd></div>
          <div><dt className="text-slate-500">Tên miền chính</dt><dd className="font-medium">{site.domain}</dd></div>
          <div><dt className="text-slate-500">Ngày kích hoạt</dt><dd className="font-medium">{formatDate(site.startedAt)}</dd></div>
          <div><dt className="text-slate-500">Ngày hết hạn</dt><dd className="font-medium">{formatDate(site.expiresAt)}</dd></div>
        </dl>
      </div>

      {site.status === "CHO_TRO_DNS" && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold text-slate-900">Kết nối tên miền {site.domain}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Đăng nhập <b>Cloudflare</b> bằng tài khoản của bạn, chọn tên miền <b>{site.domain}</b> (nếu chưa thêm tên miền vào Cloudflare, hãy thêm trước và đổi Nameserver theo hướng dẫn của Cloudflare).</li>
            <li>Vào mục <b>DNS → Records</b>, thêm đúng 3 bản ghi dưới đây. Nếu đang có bản ghi A/CNAME cũ cùng tên trỏ về hosting cũ, hãy xoá hoặc sửa nó.</li>
            <li>Bấm nút <b>Kiểm tra lại kết nối</b> — khi đủ điều kiện, hệ thống cấp SSL và kích hoạt website; hạn thuê bắt đầu tính từ ngày kích hoạt.</li>
          </ol>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-slate-50"><tr><th className="th">Loại</th><th className="th">Tên</th><th className="th">Giá trị</th><th className="th">Ghi chú</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.name} className="border-b last:border-0">
                    <td className="td font-semibold">{r.type}</td>
                    <td className="td font-mono text-xs">{r.name}</td>
                    <td className="td break-all font-mono text-xs">{r.value}</td>
                    <td className="td text-slate-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5"><DomainCheckButton domain={site.domain} /></div>
        </div>
      )}

      {site.status === "DANG_HOAT_DONG" && (
        <div className="card mt-6 p-6">
          <h2 className="font-bold text-slate-900">Website đang hoạt động</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Website của bạn đang chạy tại <b>{site.domain}</b>. Trang quản trị nội dung (CMS) của website nằm tại <b>{site.domain}/admin</b> —
            phần CMS thuộc mã nguồn website trong thư mục <b>sites/{site.template.folderSlug ?? ""}</b> của hệ thống và được kích hoạt cùng mẫu này.
          </p>
        </div>
      )}

      {(site.status === "TAM_NGUNG" || site.status === "HET_HAN") && (
        <div className="card mt-6 border-red-200 bg-red-50 p-6">
          <h2 className="font-bold text-red-800">Website đang {st.label.toLowerCase()}</h2>
          <p className="mt-2 text-sm text-red-700">Gia hạn ngay ở mục bên dưới để website chạy lại. Dữ liệu của bạn được giữ trong {s.archiveDays} ngày kể từ ngày hết hạn; cần trợ giúp thêm hãy liên hệ {s.supportEmail}{s.supportPhone ? ` — ${s.supportPhone}` : ""}.</p>
        </div>
      )}

      {site.startedAt && (
        <div id="gia-han" className="card mt-6 scroll-mt-24 p-6">
          <h2 className="text-lg font-bold text-slate-900"><i className="fa-solid fa-rotate mr-2 text-brand-600" aria-hidden /> Gia hạn website</h2>
          <p className="mt-1 text-sm text-slate-500">Hạn hiện tại: <b className="text-slate-700">{formatDate(site.expiresAt)}</b>. Chọn gói thời gian để cộng thêm — áp được cả voucher.</p>
          <RenewForm siteId={site.id} packages={packages} currentExpiry={site.expiresAt ? site.expiresAt.toISOString() : null} />
          {renewals.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-bold text-slate-900">Lịch sử gia hạn</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {renewals.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-3">
                    <span className="font-medium">{o.code}</span>
                    <span>{o.planName} · +{o.durationMonths} tháng · {formatVND(o.total)}</span>
                    <span className="text-slate-400">{ORDER_STATUS[o.status] ?? o.status} · {formatDate(o.createdAt)}</span>
                    {o.status === "CHO_THANH_TOAN" && <Link href={`/thue/hoan-tat/${o.code}`} className="font-semibold text-brand-700 hover:underline">Thanh toán</Link>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
