import { prisma } from "@/lib/db";
import { saveSettingsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminSettings({ searchParams }: { searchParams: { ok?: string } }) {
  const s = await prisma.setting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
      <p className="mt-1 text-sm text-slate-500">Mọi thông tin thương hiệu, liên hệ, thanh toán và thông số tên miền của nền tảng đều cấu hình tại đây — không cần sửa code.</p>
      {searchParams.ok && <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">Đã lưu cài đặt.</div>}
      <form action={saveSettingsAction} className="card mt-5 space-y-6 p-6">
        <section>
          <h2 className="font-bold">Thương hiệu & trang chủ</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div><label className="label">Tên thương hiệu</label><input name="brandName" defaultValue={s.brandName} className="input" /></div>
            <div><label className="label">Logo (URL, để trống = dùng chữ)</label><input name="logoUrl" defaultValue={s.logoUrl ?? ""} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Tiêu đề lớn trang chủ (Hero)</label><input name="heroTitle" defaultValue={s.heroTitle} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Mô tả dưới tiêu đề</label><textarea name="heroSubtitle" rows={2} defaultValue={s.heroSubtitle} className="input" /></div>
            <div><label className="label">Chữ nút chính</label><input name="heroCtaText" defaultValue={s.heroCtaText} className="input" /></div>
            <div><label className="label">Dòng chân trang (footer)</label><input name="footerText" defaultValue={s.footerText} className="input" /></div>
          </div>
        </section>
        <section>
          <h2 className="font-bold">Liên hệ hỗ trợ</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="label">Email hỗ trợ</label><input name="supportEmail" defaultValue={s.supportEmail} className="input" /></div>
            <div><label className="label">Hotline</label><input name="supportPhone" defaultValue={s.supportPhone} className="input" /></div>
            <div><label className="label">Link Zalo</label><input name="zaloUrl" defaultValue={s.zaloUrl ?? ""} className="input" /></div>
          </div>
        </section>
        <section>
          <h2 className="font-bold">Tên miền nền tảng & kết nối Cloudflare</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="label">Tên miền chính của nền tảng</label><input name="platformDomain" defaultValue={s.platformDomain} className="input" /><p className="mt-1 text-xs text-slate-400">Tên miền tạm của khách = slug.{`{tên miền này}`}</p></div>
            <div><label className="label">CNAME target (khách trỏ về)</label><input name="cnameTarget" defaultValue={s.cnameTarget} className="input" /></div>
            <div><label className="label">ACME target (uỷ quyền SSL)</label><input name="acmeTarget" defaultValue={s.acmeTarget} className="input" /></div>
          </div>
        </section>
        <section>
          <h2 className="font-bold">Thanh toán chuyển khoản (VietQR)</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="label">Mã ngân hàng (MB, VCB, TCB...)</label><input name="bankCode" defaultValue={s.bankCode} className="input" /></div>
            <div><label className="label">Số tài khoản</label><input name="bankAccount" defaultValue={s.bankAccount} className="input" /></div>
            <div><label className="label">Chủ tài khoản</label><input name="bankOwner" defaultValue={s.bankOwner} className="input" /></div>
          </div>
          <p className="mt-1 text-xs text-slate-400">Điền đủ 3 ô này, trang thanh toán của khách tự hiện mã VietQR kèm mã đơn để đối soát.</p>
        </section>
        <section>
          <h2 className="font-bold">Sức chứa VPS (tự động chia dung lượng)</h2>
          <p className="mt-1 text-xs text-slate-400">Khai báo theo cấu hình máy chủ thật của bạn. Mỗi khi một website được tạo, hệ thống tự động cấp hạn mức của gói cho website đó và cộng dồn vào đây — hết dung lượng là hệ thống dừng nhận đơn tạo mới (gia hạn vẫn được) và báo rõ lý do cho admin.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="label">Tổng dung lượng đĩa cho web khách (GB)</label><input name="capacityDiskGb" type="number" min={1} defaultValue={s.capacityDiskGb} className="input" /></div>
            <div><label className="label">Tổng băng thông / tháng (GB)</label><input name="capacityBandwidthGb" type="number" min={1} defaultValue={s.capacityBandwidthGb} className="input" /></div>
            <div><label className="label">Hệ số bán vượt (1 = không vượt)</label><input name="oversellRatio" type="number" step="0.1" min={1} max={5} defaultValue={s.oversellRatio} className="input" /><p className="mt-1 text-xs text-slate-400">VD 1.5 = cấp tối đa 150% sức chứa (dựa trên thực tế khách hiếm khi dùng hết hạn mức).</p></div>
          </div>
        </section>
        <section>
          <h2 className="font-bold">Vòng đời thuê bao (ngày)</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><label className="label">Dùng thử miễn phí</label><input name="trialDays" type="number" defaultValue={s.trialDays} className="input" /></div>
            <div><label className="label">Ân hạn sau hết hạn</label><input name="graceDays" type="number" defaultValue={s.graceDays} className="input" /></div>
            <div><label className="label">Lưu trữ dữ liệu sau tạm ngưng</label><input name="archiveDays" type="number" defaultValue={s.archiveDays} className="input" /></div>
          </div>
        </section>
        <button className="btn-primary px-6 py-2.5">Lưu tất cả cài đặt</button>
      </form>
    </div>
  );
}
