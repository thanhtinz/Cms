import { prisma } from "@/lib/db";
import { saveTimePackageAction, deleteTimePackageAction } from "@/lib/actions";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

function PkgForm({ p }: { p?: any }) {
  const isNew = !p;
  return (
    <form action={saveTimePackageAction} className={`card space-y-3 p-5 ${isNew ? "border-dashed" : ""}`}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold">{isNew ? "Thêm gói thời gian mới" : p.name}</span>
        {p && (
          <>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {formatVND(p.price)} / {p.months} tháng · tier {p.tier}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{p.active ? "Đang bán" : "Đã tắt"}</span>
            {p.highlight && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Nổi bật</span>}
          </>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label">Tên gói *</label><input name="name" required defaultValue={p?.name ?? ""} placeholder="VD: Gói 6 Tháng" className="input" /></div>
        <div><label className="label">Slug (trống = tự sinh)</label><input name="slug" defaultValue={p?.slug ?? ""} className="input" /></div>
        <div><label className="label">Số tháng của gói *</label><input name="months" type="number" min={1} required defaultValue={p?.months ?? 6} className="input" /></div>
        <div><label className="label">Giá trọn gói (VND) *</label><input name="price" type="number" min={0} required defaultValue={p?.price ?? 0} className="input" /></div>
        <div><label className="label">Giá gốc so sánh (0 = ẩn)</label><input name="compareAt" type="number" min={0} defaultValue={p?.compareAt ?? 0} className="input" /></div>
        <div><label className="label">Tier (cấp dịch vụ)</label><input name="tier" type="number" min={1} defaultValue={p?.tier ?? 1} className="input" /></div>
        <div><label className="label">Dung lượng (GB)</label><input name="storageGb" type="number" defaultValue={p?.storageGb ?? 5} className="input" /></div>
        <div><label className="label">Băng thông (GB, −1 = không giới hạn)</label><input name="bandwidthGb" type="number" defaultValue={p?.bandwidthGb ?? 100} className="input" /></div>
        <div><label className="label">Giới hạn trang (−1 = không giới hạn)</label><input name="pagesLimit" type="number" defaultValue={p?.pagesLimit ?? -1} className="input" /></div>
        <div><label className="label">Giới hạn sản phẩm (−1 = không giới hạn)</label><input name="productsLimit" type="number" defaultValue={p?.productsLimit ?? -1} className="input" /></div>
        <div><label className="label">Tài khoản quản trị CMS</label><input name="cmsUsers" type="number" min={1} defaultValue={p?.cmsUsers ?? 2} className="input" /></div>
        <div><label className="label">Thứ tự hiển thị</label><input name="sort" type="number" defaultValue={p?.sort ?? 0} className="input" /></div>
      </div>
      <div>
        <label className="label">Tính năng của gói (mỗi dòng 1 tính năng)</label>
        <textarea name="features" rows={4} defaultValue={p?.features ?? ""} className="input" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ecommerce" defaultChecked={p?.ecommerce ?? false} className="h-4 w-4" /> Có bán hàng online</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="highlight" defaultChecked={p?.highlight ?? false} className="h-4 w-4" /> Gói nổi bật</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="h-4 w-4" /> Đang bán</label>
        <button className="btn-primary">{isNew ? "Thêm gói" : "Lưu"}</button>
        {p && <button formAction={deleteTimePackageAction} className="font-semibold text-red-600 hover:underline">Xoá</button>}
      </div>
    </form>
  );
}

export default async function AdminTimePackages({ searchParams }: { searchParams: { ok?: string; loi?: string } }) {
  const packages = await prisma.timePackage.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Gói thời gian</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mô hình giá hiện tại: khách chọn đúng <b>một gói thời gian</b> — giá là tổng trọn gói cho cả kỳ thuê, không còn chọn gói tháng × thời hạn.
        Tier của gói quyết định mẫu nào dùng được (mẫu Premium yêu cầu tier cao). Các gói tháng/thời hạn cũ vẫn giữ trong hệ thống cho đơn cũ nhưng không còn bán.
      </p>
      {searchParams.ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
      <div className="mt-5 space-y-4">
        {packages.map((p) => <PkgForm key={p.id} p={p} />)}
        {packages.length === 0 && <p className="text-sm text-slate-500">Chưa có gói nào — thêm gói đầu tiên bên dưới.</p>}
      </div>
      <div className="mt-6"><PkgForm /></div>
    </div>
  );
}
