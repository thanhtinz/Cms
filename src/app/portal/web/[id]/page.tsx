import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, SITE_STATUS } from "@/lib/utils";
import DomainCheckButton from "@/components/DomainCheckButton";

export const dynamic = "force-dynamic";

export default async function PortalSitePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const site = await prisma.site.findUnique({
    where: { id: params.id },
    include: { template: true, plan: true, order: true },
  });
  if (!site || site.userId !== user.id) notFound();
  const s = await getSettings();
  const st = SITE_STATUS[site.status] ?? SITE_STATUS.HET_HAN;

  const records = [
    { type: "CNAME", name: "@", value: s.cnameTarget, note: "Trỏ tên miền về hệ thống. Trên Cloudflare đặt Proxy: DNS only (mây xám)." },
    { type: "TXT", name: `_cf-custom-hostname`, value: site.dnsToken, note: "Chứng minh bạn sở hữu tên miền này." },
    { type: "CNAME", name: "_acme-challenge", value: `${site.slug}.${s.acmeTarget}`, note: "Uỷ quyền cấp & gia hạn SSL tự động — làm 1 lần duy nhất." },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/portal" className="text-sm text-brand-700 hover:underline">← Quay lại Web của tôi</Link>
      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-slate-500">Mẫu {site.template.name} · Gói {site.plan.name} · Đơn {site.order.code}</p>
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
          <h2 className="text-lg font-bold">Kết nối tên miền {site.domain}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Đăng nhập <b>Cloudflare</b> bằng tài khoản của bạn, chọn tên miền <b>{site.domain}</b> (nếu chưa thêm tên miền vào Cloudflare, hãy thêm trước và đổi Nameserver theo hướng dẫn của Cloudflare).</li>
            <li>Vào mục <b>DNS → Records</b>, thêm đúng 3 bản ghi dưới đây. Nếu đang có bản ghi A/CNAME cũ cùng tên trỏ về hosting cũ, hãy xoá hoặc sửa nó.</li>
            <li>Bấm nút <b>Kiểm tra lại kết nối</b> — khi đủ điều kiện, hệ thống cấp SSL và kích hoạt website; hạn thuê bắt đầu tính từ ngày kích hoạt.</li>
          </ol>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="th">Loại</th><th className="th">Tên</th><th className="th">Giá trị</th><th className="th">Ghi chú</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.name} className="border-b last:border-0">
                    <td className="td font-semibold">{r.type}</td>
                    <td className="td font-mono text-xs">{r.name}</td>
                    <td className="td font-mono text-xs break-all">{r.value}</td>
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
          <h2 className="font-bold">Website đang hoạt động</h2>
          <p className="mt-2 text-sm text-slate-600">
            Website của bạn đang chạy tại <b>{site.domain}</b>. Trang quản trị nội dung (CMS) của website nằm tại
            {" "}<b>{site.domain}/admin</b> — phần CMS thuộc mã nguồn website trong thư mục <b>sites/{site.template.folderSlug ?? ""}</b> của hệ thống và sẽ được kích hoạt cùng mẫu này.
          </p>
          <p className="mt-2 text-sm text-slate-600">Nhớ gia hạn trước ngày {formatDate(site.expiresAt)} để website không bị tạm ngưng. Hệ thống sẽ nhắc bạn trước 30/7/3/1 ngày.</p>
        </div>
      )}

      {(site.status === "TAM_NGUNG" || site.status === "HET_HAN") && (
        <div className="card mt-6 border-red-200 bg-red-50 p-6">
          <h2 className="font-bold text-red-800">Website đang {st.label.toLowerCase()}</h2>
          <p className="mt-2 text-sm text-red-700">Vui lòng liên hệ {s.supportEmail}{s.supportPhone ? ` — ${s.supportPhone}` : ""} để gia hạn. Dữ liệu của bạn được giữ trong {s.archiveDays} ngày kể từ ngày hết hạn.</p>
        </div>
      )}
    </div>
  );
}
