import { prisma } from "@/lib/db";
import { saveVoucherAction, deleteVoucherAction } from "@/lib/actions";
import { formatVND, formatDate } from "@/lib/utils";
import { describeVoucher } from "@/lib/voucher-shared";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export default async function AdminVouchers({ searchParams }: { searchParams: { ok?: string; loi?: string } }) {
  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Voucher giảm giá</h1>
      <p className="mt-1 text-sm text-slate-500">
        Khách nhập mã ở form thuê (trong trang chi tiết mẫu). Voucher đang bật và còn hạn sẽ hiện ở mục Ưu đãi trên trang chủ.
        Số tiền giảm tính trên số tiền sau chiết khấu thời hạn.
      </p>
      {searchParams.ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="mt-5 space-y-4">
        {vouchers.map((v) => (
          <form key={v.id} action={saveVoucherAction} className="card space-y-3 p-5">
            <input type="hidden" name="id" value={v.id} />
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg font-black tracking-wide">{v.code}</span>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{describeVoucher(v)}</span>
              <span className="text-xs text-slate-400">Đã dùng {v.usedCount}{v.usageLimit > 0 ? `/${v.usageLimit}` : ""} lượt</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{v.active ? "Đang chạy" : "Đã tắt"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="label">Mã voucher</label><input name="code" defaultValue={v.code} className="input font-mono uppercase" /></div>
              <div><label className="label">Mô tả cho khách</label><input name="description" defaultValue={v.description} className="input" /></div>
              <div>
                <label className="label">Loại giảm</label>
                <select name="type" defaultValue={v.type} className="input">
                  <option value="PERCENT">Theo %</option>
                  <option value="FIXED">Giảm thẳng (VND)</option>
                </select>
              </div>
              <div><label className="label">Giá trị (% hoặc VND)</label><input name="value" type="number" min={0} defaultValue={v.value} className="input" /></div>
              <div><label className="label">Trần giảm VND (loại %; 0 = không trần)</label><input name="maxDiscount" type="number" min={0} defaultValue={v.maxDiscount} className="input" /></div>
              <div><label className="label">Đơn tối thiểu (VND)</label><input name="minTotal" type="number" min={0} defaultValue={v.minTotal} className="input" /></div>
              <div><label className="label">Giới hạn lượt dùng (0 = không giới hạn)</label><input name="usageLimit" type="number" min={0} defaultValue={v.usageLimit} className="input" /></div>
              <div><label className="label">Lượt đã dùng</label><input value={v.usedCount} disabled className="input bg-slate-50" /></div>
              <div><label className="label">Ngày bắt đầu</label><input name="startsAt" type="date" defaultValue={toDateInput(v.startsAt)} className="input" /></div>
              <div><label className="label">Ngày hết hạn</label><input name="expiresAt" type="date" defaultValue={toDateInput(v.expiresAt)} className="input" /></div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={v.active} className="h-4 w-4" /> Kích hoạt</label>
              <button className="btn-primary">Lưu</button>
              <button formAction={deleteVoucherAction} className="font-semibold text-red-600 hover:underline">Xoá</button>
              <span className="text-xs text-slate-400">Tạo {formatDate(v.createdAt)}</span>
            </div>
          </form>
        ))}
        {vouchers.length === 0 && <p className="text-sm text-slate-500">Chưa có voucher nào — tạo mã đầu tiên bên dưới.</p>}
      </div>

      <form action={saveVoucherAction} className="card mt-6 space-y-3 border-dashed p-5">
        <div className="font-bold">Tạo voucher mới</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label">Mã voucher *</label><input name="code" required placeholder="VD: WEBSITE10" className="input font-mono uppercase" /></div>
          <div><label className="label">Mô tả cho khách</label><input name="description" placeholder="VD: Ưu đãi khách mới" className="input" /></div>
          <div>
            <label className="label">Loại giảm</label>
            <select name="type" defaultValue="PERCENT" className="input">
              <option value="PERCENT">Theo %</option>
              <option value="FIXED">Giảm thẳng (VND)</option>
            </select>
          </div>
          <div><label className="label">Giá trị (% hoặc VND)</label><input name="value" type="number" min={0} defaultValue={10} className="input" /></div>
          <div><label className="label">Trần giảm VND (loại %; 0 = không trần)</label><input name="maxDiscount" type="number" min={0} defaultValue={0} className="input" /></div>
          <div><label className="label">Đơn tối thiểu (VND)</label><input name="minTotal" type="number" min={0} defaultValue={0} className="input" /></div>
          <div><label className="label">Giới hạn lượt dùng (0 = không giới hạn)</label><input name="usageLimit" type="number" min={0} defaultValue={0} className="input" /></div>
          <div><label className="label">Ngày hết hạn</label><input name="expiresAt" type="date" className="input" /></div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="h-4 w-4" /> Kích hoạt ngay</label>
          <button className="btn-primary">Tạo voucher</button>
          <span className="text-xs text-slate-400">Ví dụ: Gói 12 Tháng giá {formatVND(1399000)} — voucher giảm 10% sẽ trừ thêm {formatVND(139900)}.</span>
        </div>
      </form>
    </div>
  );
}
