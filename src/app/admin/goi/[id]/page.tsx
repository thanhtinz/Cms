import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { savePlanAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminPlanEdit({ params }: { params: { id: string } }) {
  const isNew = params.id === "moi";
  const p = isNew ? null : await prisma.plan.findUnique({ where: { id: params.id } });
  if (!isNew && !p) notFound();
  return (
    <div>
      <Link href="/admin/goi" className="text-sm text-brand-700 hover:underline">← Danh sách gói</Link>
      <h1 className="mt-2 text-2xl font-bold">{isNew ? "Thêm gói thuê" : `Sửa gói: ${p!.name}`}</h1>
      <form action={savePlanAction} className="card mt-5 space-y-4 p-6">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Tên gói *</label><input name="name" required defaultValue={p?.name ?? ""} className="input" /></div>
          <div><label className="label">Slug</label><input name="slug" defaultValue={p?.slug ?? ""} className="input" /></div>
          <div><label className="label">Tier (mẫu yêu cầu tier tối thiểu so với số này)</label><input name="tier" type="number" min={1} required defaultValue={p?.tier ?? 1} className="input" /></div>
          <div><label className="label">Giá / tháng (VND)</label><input name="priceMonth" type="number" min={0} required defaultValue={p?.priceMonth ?? 0} className="input" /></div>
          <div><label className="label">Dung lượng (GB)</label><input name="storageGb" type="number" min={0} required defaultValue={p?.storageGb ?? 5} className="input" /></div>
          <div><label className="label">Băng thông (GB/tháng, -1 = không giới hạn)</label><input name="bandwidthGb" type="number" required defaultValue={p?.bandwidthGb ?? 100} className="input" /></div>
          <div><label className="label">Giới hạn số trang (-1 = không giới hạn)</label><input name="pagesLimit" type="number" required defaultValue={p?.pagesLimit ?? -1} className="input" /></div>
          <div><label className="label">Giới hạn sản phẩm (-1 = không giới hạn)</label><input name="productsLimit" type="number" required defaultValue={p?.productsLimit ?? -1} className="input" /></div>
          <div><label className="label">Số tài khoản CMS</label><input name="cmsUsers" type="number" min={1} required defaultValue={p?.cmsUsers ?? 2} className="input" /></div>
          <div><label className="label">Số tên miền</label><input name="domains" type="number" min={1} required defaultValue={p?.domains ?? 1} className="input" /></div>
          <div><label className="label">Thứ tự hiển thị</label><input name="sort" type="number" defaultValue={p?.sort ?? 0} className="input" /></div>
          <div className="flex flex-wrap items-center gap-5 pt-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="ecommerce" defaultChecked={p?.ecommerce} className="h-4 w-4" /> Có bán hàng</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="highlight" defaultChecked={p?.highlight} className="h-4 w-4" /> Gói nổi bật</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="h-4 w-4" /> Đang bán</label>
          </div>
        </div>
        <div><label className="label">Tính năng gồm có (mỗi dòng 1 dòng — hiện ở bảng giá)</label><textarea name="features" rows={6} defaultValue={p?.features ?? ""} className="input" /></div>
        <div><label className="label">Tính năng không có (mỗi dòng 1 dòng, có thể để trống)</label><textarea name="excluded" rows={3} defaultValue={p?.excluded ?? ""} className="input" /></div>
        <button className="btn-primary px-6 py-2.5">{isNew ? "Thêm gói" : "Lưu thay đổi"}</button>
      </form>
    </div>
  );
}
